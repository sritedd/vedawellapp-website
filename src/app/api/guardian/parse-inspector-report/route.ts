import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateText } from "ai";
import { getSmartModel, isAIAvailable } from "@/lib/ai/provider";
import { checkRateLimit, checkProAccess, checkDailyQuota } from "@/lib/ai/rate-limit";
import { logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";

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

    if (!isAIAvailable()) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

    const { allowed, tier } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Inspector report parsing requires Pro." }, { status: 403 });
    }

    if (checkRateLimit(user.id, 10000)) {
      return NextResponse.json({ error: "Please wait before trying again" }, { status: 429 });
    }

    const quota = await checkDailyQuota(supabase, user.id, tier, "parse-inspector-report");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${quota.used}/${quota.limit}).` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { textContent, projectId } = body;

    if (!textContent || typeof textContent !== "string" || textContent.length < 50 || !projectId) {
      return NextResponse.json({ error: "Report text and projectId required" }, { status: 400 });
    }

    if (textContent.length > 50000) {
      return NextResponse.json({ error: "Report text too large (max 50,000 characters)" }, { status: 413 });
    }

    // Verify project ownership and pull state for KB grounding
    const { data: project } = await supabase
      .from("projects")
      .select("state")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    const truncated = textContent.slice(0, 15000);

    const kbSnippets = await retrieveKnowledge({
      state: project?.state,
      category: "defects",
      limit: 5,
    });
    const kbBlock = kbSnippets.length > 0
      ? `\n\nREFERENCE DATA (Australian standards for defect classification):\n${kbSnippets.join("\n\n")}`
      : "";

    const prompt = `You are an expert Australian building inspector report analyst. Extract all defects from this building inspection report and return valid JSON:

{
  "inspectorName": "<string or null>",
  "inspectionDate": "<YYYY-MM-DD or null>",
  "reportSummary": "<brief summary>",
  "defects": [
    {
      "title": "<short defect title>",
      "description": "<detailed description>",
      "location": "<room/area>",
      "severity": "critical" | "major" | "minor" | "cosmetic",
      "recommendation": "<what should be done>"
    }
  ]
}${kbBlock}

REPORT TEXT:
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
        feature: "parse-inspector-report",
        model: "smart",
        success: false,
        errorCode: "no-json-match",
        latencyMs: Date.now() - startTime,
      }).catch(() => {});
      return NextResponse.json(
        { error: "Could not parse report", fallback: true },
        { status: 422 }
      );
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      logAIUsage({
        userId,
        feature: "parse-inspector-report",
        model: "smart",
        success: false,
        errorCode: "json-parse-failed",
        latencyMs: Date.now() - startTime,
      }).catch(() => {});
      console.error("[parse-inspector-report] JSON.parse failed:", parseErr instanceof Error ? parseErr.message : parseErr);
      return NextResponse.json(
        { error: "AI returned malformed output. Please retry.", fallback: true },
        { status: 502 }
      );
    }

    logAIUsage({
      userId,
      feature: "parse-inspector-report",
      model: "smart",
      success: true,
      latencyMs: Date.now() - startTime,
      inputTokens,
      outputTokens,
    }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    logAIUsage({
      userId,
      feature: "parse-inspector-report",
      model: "smart",
      success: false,
      errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown",
      latencyMs: Date.now() - startTime,
    }).catch(() => {});
    console.error("[parse-inspector-report] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to parse report", fallback: true },
      { status: 503 }
    );
  }
}
