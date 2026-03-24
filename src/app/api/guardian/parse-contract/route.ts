import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateText } from "ai";
import { getSmartModel, isAIAvailable } from "@/lib/ai/provider";
import { checkRateLimit, checkProAccess } from "@/lib/ai/rate-limit";

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
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    if (!isAIAvailable()) {
      return NextResponse.json({ error: "AI features are not configured" }, { status: 503 });
    }

    const { allowed } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Contract parsing requires Pro. Upgrade to unlock." }, { status: 403 });
    }

    if (checkRateLimit(user.id, 10000)) {
      return NextResponse.json({ error: "Please wait before trying again" }, { status: 429 });
    }

    const body = await request.json();
    const { textContent } = body;

    if (!textContent || typeof textContent !== "string" || textContent.length < 100) {
      return NextResponse.json({ error: "Contract text content is too short or missing" }, { status: 400 });
    }

    if (textContent.length > 50000) {
      return NextResponse.json({ error: "Contract text too large (max 50,000 characters)" }, { status: 413 });
    }

    // Truncate to avoid token limits
    const truncated = textContent.slice(0, 15000);

    const prompt = `You are an expert Australian construction contract analyst. Extract the following fields from this building contract text and return valid JSON:

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
}

CONTRACT TEXT:
${truncated}`;

    const { text } = await generateText({
      model: getSmartModel(),
      prompt,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse contract. Try a clearer PDF." }, { status: 422 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[parse-contract] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to parse contract" }, { status: 500 });
  }
}
