import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateObject } from "ai";
import { getCheapModel, isAIAvailable } from "@/lib/ai/provider";
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
    if (!isAIAvailable()) {
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

    // Parse and validate body
    const body = await request.json();
    const { builderName, abn, state } = body;

    if (!builderName || typeof builderName !== "string") {
      return NextResponse.json(
        { error: "builderName is required" },
        { status: 400 }
      );
    }

    const sanitizedName = stripHtml(builderName).slice(0, 200).trim();
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "builderName is required" },
        { status: 400 }
      );
    }

    const sanitizedAbn = abn
      ? stripHtml(String(abn)).slice(0, 20).trim()
      : undefined;
    const sanitizedState = state
      ? stripHtml(String(state)).slice(0, 10).trim().toUpperCase()
      : undefined;

    // Validate state if provided
    if (sanitizedState && !VALID_STATES.includes(sanitizedState as typeof VALID_STATES[number])) {
      return NextResponse.json(
        { error: `state must be one of: ${VALID_STATES.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate builder report with caching (3-day TTL)
    const report = await cachedAI(
      "builder-check",
      {
        builderName: sanitizedName.toLowerCase(),
        abn: sanitizedAbn || "",
        state: sanitizedState || "",
      },
      async () => {
        // Stub external API calls — pass null for each data source
        const abnData = null;
        const licenseData = null;
        const reviews = null;

        const prompt = buildBuilderCheckPrompt(
          sanitizedName,
          abnData,
          licenseData,
          reviews
        );

        const { object } = await generateObject({
          model: getCheapModel(),
          schema: BuilderReportSchema,
          prompt,
        });

        return object;
      },
      THREE_DAYS_SECONDS
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error("[builder-check] Error:",
      error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
