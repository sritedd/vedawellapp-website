import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateObject } from "ai";
import { getCheapModel, isCheapAIAvailable } from "@/lib/ai/provider";
import {
  buildDefectAssistPrompt,
  DefectAnalysisSchema,
  DEFECT_ANALYSIS_FALLBACK,
} from "@/lib/ai/prompts";
import { cachedAI, logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";
import { checkRateLimit, checkDailyQuota } from "@/lib/ai/rate-limit";

/** Strip HTML tags from user input */
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
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

    // 2. AI availability
    if (!isCheapAIAvailable()) {
      return NextResponse.json(
        { error: "AI features are not configured" },
        { status: 503 }
      );
    }

    // 3. Rate limiting
    if (checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Please wait a few seconds before trying again" },
        { status: 429 }
      );
    }

    // 3b. Daily quota check
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, is_admin")
      .eq("id", user.id)
      .single();
    const tier = profile?.is_admin ? "admin" : (profile?.subscription_tier || "free");
    const quota = await checkDailyQuota(supabase, user.id, tier, "defect-assist");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${quota.used}/${quota.limit}). Upgrade to Pro for more.` },
        { status: 429 }
      );
    }

    // 4. Parse and validate input
    const body = await request.json();
    const { description, stage, state } = body as {
      description: unknown;
      stage?: unknown;
      state?: unknown;
    };

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const sanitized = stripHtml(description).slice(0, 2000);

    if (sanitized.length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const safeStage =
      typeof stage === "string" ? stripHtml(stage).slice(0, 200) : undefined;
    const safeState =
      typeof state === "string" ? stripHtml(state).slice(0, 50) : undefined;

    // 5. Retrieve knowledge base context for grounding
    const kbSnippets = await retrieveKnowledge({
      state: safeState,
      stage: safeStage,
      category: "defects",
    });

    // 6. Generate (with caching — defect descriptions are generic, shared cache is fine)
    const analysis = await cachedAI(
      "defect-assist",
      { description: sanitized, stage: safeStage, state: safeState },
      async () => {
        let prompt = buildDefectAssistPrompt(sanitized, safeStage, safeState);
        if (kbSnippets.length > 0) {
          prompt += `\n\nREFERENCE DATA (use these to ground your response in real Australian Standards):\n${kbSnippets.join("\n\n")}`;
        }
        const { object } = await generateObject({
          model: getCheapModel(),
          schema: DefectAnalysisSchema,
          prompt,
        });
        return object;
      },
      86400,
      user.id
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[describe-defect] AI generation failed:",
      error instanceof Error ? error.message : "Unknown error");
    logAIUsage({ feature: "defect-assist", model: "gemini-2.5-flash-lite", success: false, errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown" }).catch(() => {});
    return NextResponse.json(
      { ...DEFECT_ANALYSIS_FALLBACK, fallback: true, reason: "AI generation failed" },
      { status: 503 }
    );
  }
}
