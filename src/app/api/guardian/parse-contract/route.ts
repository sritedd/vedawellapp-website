import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateText } from "ai";
import { getSmartModel, isAIAvailable } from "@/lib/ai/provider";
import { checkRateLimit, checkProAccess, checkDailyQuota } from "@/lib/ai/rate-limit";
import { logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";

interface ParsedContract {
  contractSum: number | null;
  builderName: string | null;
  builderLicense: string | null;
  builderABN: string | null;
  homeownerName: string | null;
  projectAddress: string | null;
  startDate: string | null;
  completionDate: string | null;
  contractSignedDate: string | null;
  insurancePolicyNumber: string | null;
  stages: { name: string; percentage: number }[];
  pcAllowances: { item: string; amount: number }[];
  psAllowances: { item: string; amount: number }[];
  coolingOffPeriod: string | null;
  warrantyPeriod: string | null;
  unusualClauses: string[];
  missingProtections: string[];
}

function isIsoDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

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
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    userId = user.id;

    if (!isAIAvailable()) {
      return NextResponse.json({ error: "AI features are not configured" }, { status: 503 });
    }

    const { allowed, tier } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Contract parsing requires Pro. Upgrade to unlock." }, { status: 403 });
    }

    if (checkRateLimit(user.id, 10000)) {
      return NextResponse.json({ error: "Please wait before trying again" }, { status: 429 });
    }

    const quota = await checkDailyQuota(supabase, user.id, tier, "parse-contract");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${quota.used}/${quota.limit}).` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { textContent, projectId, persistToProject } = body;

    if (!textContent || typeof textContent !== "string" || textContent.length < 100) {
      return NextResponse.json({ error: "Contract text content is too short or missing" }, { status: 400 });
    }

    if (textContent.length > 50000) {
      return NextResponse.json({ error: "Contract text too large (max 50,000 characters)" }, { status: 413 });
    }

    // Load project state for KB grounding
    let state: string | undefined;
    if (projectId && typeof projectId === "string") {
      const { data: proj } = await supabase
        .from("projects")
        .select("state")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();
      state = proj?.state;
    }

    const kbSnippets = await retrieveKnowledge({
      state,
      category: "contract",
      limit: 5,
    });

    // Truncate to avoid token limits
    const truncated = textContent.slice(0, 15000);

    const kbBlock = kbSnippets.length > 0
      ? `\n\nREFERENCE DATA (Australian contract standards to validate against):\n${kbSnippets.join("\n\n")}`
      : "";

    const prompt = `You are an expert Australian construction contract analyst. Extract the following fields from this building contract text and return valid JSON (no prose, no markdown fencing — just the JSON object):

{
  "contractSum": <number or null>,
  "builderName": "<string or null>",
  "builderLicense": "<string or null>",
  "builderABN": "<string or null>",
  "homeownerName": "<string or null>",
  "projectAddress": "<string or null>",
  "startDate": "<YYYY-MM-DD or null>",
  "completionDate": "<YYYY-MM-DD or null>",
  "contractSignedDate": "<YYYY-MM-DD or null>",
  "insurancePolicyNumber": "<string or null>",
  "stages": [{"name": "<stage name>", "percentage": <payment percentage>}],
  "pcAllowances": [{"item": "<item name>", "amount": <number>}],
  "psAllowances": [{"item": "<item name>", "amount": <number>}],
  "coolingOffPeriod": "<string or null>",
  "warrantyPeriod": "<string or null>",
  "unusualClauses": ["<clause description>"],
  "missingProtections": ["<what's missing that should be there>"]
}${kbBlock}

CONTRACT TEXT:
${truncated}`;

    const { text, usage } = await generateText({
      model: getSmartModel(),
      prompt,
    });
    const inputTokens = (usage as { inputTokens?: number; promptTokens?: number } | undefined)?.inputTokens
      ?? (usage as { inputTokens?: number; promptTokens?: number } | undefined)?.promptTokens;
    const outputTokens = (usage as { outputTokens?: number; completionTokens?: number } | undefined)?.outputTokens
      ?? (usage as { outputTokens?: number; completionTokens?: number } | undefined)?.completionTokens;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logAIUsage({
        userId,
        feature: "parse-contract",
        model: "smart",
        success: false,
        errorCode: "no-json-match",
        latencyMs: Date.now() - startTime,
      }).catch(() => {});
      return NextResponse.json({ error: "Could not parse contract. Try a clearer PDF." }, { status: 422 });
    }

    let result: ParsedContract;
    try {
      result = JSON.parse(jsonMatch[0]) as ParsedContract;
    } catch (parseErr) {
      logAIUsage({
        userId,
        feature: "parse-contract",
        model: "smart",
        success: false,
        errorCode: "json-parse-failed",
        latencyMs: Date.now() - startTime,
      }).catch(() => {});
      console.error("[parse-contract] JSON.parse failed:", parseErr instanceof Error ? parseErr.message : parseErr);
      return NextResponse.json({ error: "AI returned malformed output. Please retry." }, { status: 502 });
    }

    // Optional: persist extracted fields back to the project row
    let persisted = false;
    if (persistToProject === true && projectId && typeof projectId === "string") {
      const updates: Record<string, unknown> = {};
      if (typeof result.contractSum === "number" && result.contractSum > 0) updates.contract_value = result.contractSum;
      if (result.builderName) updates.builder_name = result.builderName;
      if (result.builderLicense) updates.builder_license_number = result.builderLicense;
      if (result.builderABN) updates.builder_abn = result.builderABN;
      if (isIsoDate(result.startDate)) updates.start_date = result.startDate;
      if (isIsoDate(result.contractSignedDate)) updates.contract_signed_date = result.contractSignedDate;
      if (isIsoDate(result.completionDate)) updates.expected_end_date = result.completionDate;
      if (result.insurancePolicyNumber) updates.hbcf_policy_number = result.insurancePolicyNumber;

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from("projects")
          .update(updates)
          .eq("id", projectId)
          .eq("user_id", user.id);

        if (updateErr) {
          console.error("[parse-contract] Persist failed:", updateErr.message);
        } else {
          persisted = true;
        }
      }
    }

    logAIUsage({
      userId,
      feature: "parse-contract",
      model: "smart",
      success: true,
      latencyMs: Date.now() - startTime,
      inputTokens,
      outputTokens,
    }).catch(() => {});

    return NextResponse.json({ ...result, persisted });
  } catch (error) {
    logAIUsage({
      userId,
      feature: "parse-contract",
      model: "smart",
      success: false,
      errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown",
      latencyMs: Date.now() - startTime,
    }).catch(() => {});
    console.error("[parse-contract] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to parse contract" }, { status: 500 });
  }
}
