import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateObject } from "ai";
import { getCheapModel, isCheapAIAvailable } from "@/lib/ai/provider";
import {
  buildStageAdvicePrompt,
  StageAdviceSchema,
  type StageAdvice,
} from "@/lib/ai/prompts";
import { cachedAI, logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";
import { checkRateLimit, checkProAccess, checkDailyQuota, VALID_STATES } from "@/lib/ai/rate-limit";

/** Strip HTML tags from user input */
function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

const STAGE_ADVICE_FALLBACK: StageAdvice = {
  advice:
    "We were unable to generate AI advice at this time. Please review your contract and consult your building inspector for stage-specific guidance. You can also contact your state's building authority for mandatory inspection requirements.",
  checklistItems: [
    "Verify all mandatory inspections have been booked",
    "Photograph the site before and after each stage",
    "Review your contract for stage-specific requirements",
    "Confirm the builder has appropriate insurance",
    "Check that materials match your contract specifications",
  ],
  documentsToDemand: [
    "Certificate of compliance for completed stage",
    "Updated construction schedule",
    "Builder's insurance certificate of currency",
  ],
  commonIssues: [
    "Incomplete work signed off prematurely",
    "Substitution of materials without written approval",
    "Missing or incomplete documentation",
  ],
  paymentAdvice:
    "Do not make progress payments until mandatory inspections are complete and you have the relevant certificates. Check your state's Home Building Act for progress payment limits.",
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate via Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) =>
            c.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            ),
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check AI availability
    if (!isCheapAIAvailable()) {
      return NextResponse.json(
        { error: "AI features are not configured" },
        { status: 503 }
      );
    }

    // Tier gating — stage advice is Pro-only
    const { allowed, tier } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "AI Stage Advice is available on the Pro plan. Upgrade to unlock." },
        { status: 403 }
      );
    }

    // Rate limiting
    if (checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Please wait a few seconds before trying again" },
        { status: 429 }
      );
    }

    // Daily quota check
    const quota = await checkDailyQuota(supabase, user.id, tier, "stage-advice");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${quota.used}/${quota.limit}).` },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const { stage: rawStage, state: rawState, projectContext: rawContext } = body;

    if (
      !rawStage ||
      typeof rawStage !== "string" ||
      !rawState ||
      typeof rawState !== "string"
    ) {
      return NextResponse.json(
        { error: "stage and state are required non-empty strings" },
        { status: 400 }
      );
    }

    const stage = sanitize(rawStage).slice(0, 200);
    const state = sanitize(rawState).toUpperCase();

    if (!stage || !state) {
      return NextResponse.json(
        { error: "stage and state must contain non-whitespace content" },
        { status: 400 }
      );
    }

    // Validate state against known Australian states
    if (!VALID_STATES.includes(state as typeof VALID_STATES[number])) {
      return NextResponse.json(
        { error: `state must be one of: ${VALID_STATES.join(", ")}` },
        { status: 400 }
      );
    }

    const projectContext = rawContext
      ? sanitize(String(rawContext)).slice(0, 500)
      : undefined;

    // Retrieve knowledge base context for grounding
    const kbSnippets = await retrieveKnowledge({
      state,
      stage,
      category: "stage_guidance",
    });

    // Generate advice with caching (7-day TTL, shared cache — stage advice is generic)
    const advice = await cachedAI<StageAdvice>(
      "stage-advice",
      { stage, state, projectContext: projectContext || "" },
      async () => {
        let prompt = buildStageAdvicePrompt(stage, state, projectContext);
        if (kbSnippets.length > 0) {
          prompt += `\n\nREFERENCE DATA (use these to ground your response in real Australian Standards and NCC requirements):\n${kbSnippets.join("\n\n")}`;
        }
        const { object } = await generateObject({
          model: getCheapModel(),
          schema: StageAdviceSchema,
          prompt,
        });
        return object;
      },
      604800, // 7 days
      user.id
    );

    return NextResponse.json(advice);
  } catch (error) {
    console.error("[stage-advice] AI generation failed:",
      error instanceof Error ? error.message : "Unknown error");
    logAIUsage({ feature: "stage-advice", model: "gemini-2.5-flash-lite", success: false, errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown" }).catch(() => {});
    return NextResponse.json(
      { ...STAGE_ADVICE_FALLBACK, fallback: true, reason: "AI generation failed" },
      { status: 503 }
    );
  }
}
