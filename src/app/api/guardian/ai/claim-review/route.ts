import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateText } from "ai";
import { getSmartModel, getSmartModelName, isAIAvailable } from "@/lib/ai/provider";
import { checkRateLimit, checkProAccess, checkDailyQuota } from "@/lib/ai/rate-limit";
import { logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isAIAvailable()) {
      return NextResponse.json({ error: "AI features are not configured" }, { status: 503 });
    }

    const { allowed, tier } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Progress Claim Review is available on the Pro plan. Upgrade to unlock." },
        { status: 403 }
      );
    }

    if (checkRateLimit(user.id)) {
      return NextResponse.json({ error: "Please wait a few seconds before trying again" }, { status: 429 });
    }

    // Daily quota check
    const quota = await checkDailyQuota(supabase, user.id, tier, "claim-review");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${quota.used}/${quota.limit}).` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { projectId, claimAmount, claimStage, claimDescription } = body;

    // Allow $0 claims (e.g. variation-only claims or zero-progress checks) — a
    // legitimately-zero amount should not 400. Only reject undefined/null, NaN,
    // and negative values.
    const claimAmountValid = typeof claimAmount === "number" && Number.isFinite(claimAmount) && claimAmount >= 0;
    if (!projectId || !claimAmountValid || !claimStage) {
      return NextResponse.json({ error: "projectId, claimAmount (non-negative number), and claimStage are required" }, { status: 400 });
    }

    // Verify ownership and fetch project data. NOTE: current_stage is NOT a
    // DB column — it's computed from the stages table. Don't select it here.
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("id, name, address, contract_value, state, builder_name")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Compute current stage = first non-completed stage by order
    const { data: stagesRow } = await supabase
      .from("stages")
      .select("name, status")
      .eq("project_id", projectId)
      .neq("status", "completed")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const currentStageName = stagesRow?.name || "Not specified";

    // Parallel fetch: defects, certificates, variations, payments
    const [defectsRes, certsRes, variationsRes, paymentsRes] = await Promise.all([
      supabase.from("defects").select("title, severity, status").eq("project_id", projectId),
      supabase.from("certifications").select("type, required_for_stage, status").eq("project_id", projectId),
      supabase.from("variations").select("description, status, additional_cost").eq("project_id", projectId),
      supabase.from("payments").select("stage_name, amount, status").eq("project_id", projectId),
    ]);

    const openDefects = (defectsRes.data || []).filter(
      (d: { status: string }) => !["verified", "rectified"].includes(d.status)
    );
    const criticalDefects = openDefects.filter(
      (d: { severity: string }) => d.severity === "critical" || d.severity === "major"
    );
    const certificates = certsRes.data || [];
    const variations = variationsRes.data || [];
    const payments = paymentsRes.data || [];
    const totalPaid = payments
      .filter((p: { status: string }) => p.status === "paid")
      .reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);

    let prompt = `You are an expert Australian construction advisor helping a homeowner decide whether to pay a builder's progress claim.

PROJECT DETAILS:
- Address: ${project.address || "Not specified"}
- Contract Value: $${project.contract_value || "Not specified"}
- Current Stage: ${currentStageName}
- Builder: ${project.builder_name || "Not specified"}
- State: ${project.state || "Not specified"}

CLAIM BEING REVIEWED:
- Claimed Stage: ${sanitize(String(claimStage)).slice(0, 200)}
- Claimed Amount: $${Number(claimAmount).toLocaleString()}
- Description: ${claimDescription ? sanitize(String(claimDescription)).slice(0, 500) : "None provided"}

CURRENT PROJECT STATE:
- Open Defects: ${openDefects.length} (${criticalDefects.length} critical/major)
- Critical/Major Defects: ${criticalDefects.map((d: { title: string }) => d.title).join(", ") || "None"}
- Certificates Uploaded: ${certificates.length}
- Variations: ${variations.length} total (${variations.filter((v: { status: string }) => v.status === "approved").length} approved, ${variations.filter((v: { status: string }) => v.status === "pending").length} pending)
- Total Paid So Far: $${totalPaid.toLocaleString()}

INSTRUCTIONS:
Analyze this progress claim and return your response as valid JSON with this exact structure:
{
  "verdict": "PAY" or "HOLD" or "DISPUTE",
  "confidence": <number 0-100>,
  "reasons": ["reason 1", "reason 2", ...],
  "missingItems": ["item 1", "item 2", ...],
  "suggestedResponse": "Pre-drafted email to builder..."
}

Consider:
1. Are there unresolved critical/major defects at the claimed stage?
2. Are required certificates uploaded for this stage?
3. Is the claimed amount reasonable vs contract value?
4. Are there pending unapproved variations affecting this stage?
5. Reference relevant Australian building legislation for the state.

PAY = all clear, safe to pay. HOLD = minor issues to resolve first. DISPUTE = serious problems, do not pay.`;

    // Ground in knowledge base
    const kbSnippets = await retrieveKnowledge({
      state: project.state,
      stage: sanitize(String(claimStage)).slice(0, 200),
      category: "payments",
    });
    if (kbSnippets.length > 0) {
      prompt += `\n\nREFERENCE DATA (use these for accurate regulatory references):\n${kbSnippets.join("\n\n")}`;
    }

    const startTime = Date.now();
    const { text, usage } = await generateText({
      model: getSmartModel(),
      prompt,
    });
    const latencyMs = Date.now() - startTime;
    const inputTokens = (usage as { inputTokens?: number; promptTokens?: number } | undefined)?.inputTokens
      ?? (usage as { inputTokens?: number; promptTokens?: number } | undefined)?.promptTokens;
    const outputTokens = (usage as { outputTokens?: number; completionTokens?: number } | undefined)?.outputTokens
      ?? (usage as { outputTokens?: number; completionTokens?: number } | undefined)?.completionTokens;

    // Log telemetry (fire-and-forget). Model name is derived from the active
    // provider, not a guess based on ANTHROPIC_API_KEY presence.
    logAIUsage({
      userId: user.id,
      feature: "claim-review",
      model: getSmartModelName(),
      latencyMs,
      success: true,
      inputTokens,
      outputTokens,
    }).catch(() => {});

    // Parse JSON from AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        fallback: true,
        verdict: "HOLD",
        confidence: 50,
        reasons: ["AI analysis could not be parsed. Please review the claim manually."],
        missingItems: [],
        suggestedResponse: "Please review this claim with your building inspector before proceeding.",
      }, { status: 502 });
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[claim-review] JSON parse failed:", jsonMatch[0].slice(0, 200));
      return NextResponse.json({
        fallback: true,
        verdict: "HOLD",
        confidence: 50,
        reasons: ["AI response could not be parsed. Please try again or review manually."],
        missingItems: [],
        suggestedResponse: "Please review this claim with your building inspector before proceeding.",
      }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[claim-review] Error:", error instanceof Error ? error.message : error);
    logAIUsage({ feature: "claim-review", model: "unknown", success: false, errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown" }).catch(() => {});
    return NextResponse.json({
      fallback: true,
      verdict: "HOLD",
      confidence: 0,
      reasons: ["An error occurred during analysis. Please try again or review manually."],
      missingItems: [],
      suggestedResponse: "",
    }, { status: 503 });
  }
}
