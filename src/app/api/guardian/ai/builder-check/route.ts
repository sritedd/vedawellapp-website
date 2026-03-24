import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateObject } from "ai";
import { getCheapModel, isCheapAIAvailable } from "@/lib/ai/provider";
import {
  BuilderReportSchema,
  buildBuilderCheckPrompt,
} from "@/lib/ai/prompts";
import { cachedAI } from "@/lib/ai/cache";
import { checkRateLimit, checkProAccess, VALID_STATES } from "@/lib/ai/rate-limit";

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

const THREE_DAYS_SECONDS = 3 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    // Check AI availability
    if (!isCheapAIAvailable()) {
      return NextResponse.json(
        { error: "AI features are not currently available" },
        { status: 503 }
      );
    }

    // Authenticate user
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tier gating — builder check is Pro-only
    const { allowed } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "AI Builder Check is available on the Pro plan. Upgrade to unlock." },
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

    // DISABLED: Builder check currently generates reports from zero real external data.
    // Until real data sources are integrated (ABN Lookup API, state license APIs, Google Places),
    // this feature returns hallucinated assessments that could mislead homeowners.
    // Re-enable once at least ABN Lookup API integration is complete.
    return NextResponse.json(
      {
        error: "Builder Check is coming soon. We're integrating real data sources (ABN Lookup, state license registers) to provide verified builder assessments instead of AI-only analysis.",
        comingSoon: true,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("[builder-check] Error:",
      error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
