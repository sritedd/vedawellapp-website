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

    if (!isAIAvailable()) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

    const { allowed } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Inspector report parsing requires Pro." }, { status: 403 });
    }

    if (checkRateLimit(user.id, 10000)) {
      return NextResponse.json({ error: "Please wait before trying again" }, { status: 429 });
    }

    const body = await request.json();
    const { textContent, projectId } = body;

    if (!textContent || textContent.length < 50 || !projectId) {
      return NextResponse.json({ error: "Report text and projectId required" }, { status: 400 });
    }

    const truncated = textContent.slice(0, 15000);

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
}

REPORT TEXT:
${truncated}`;

    const { text } = await generateText({
      model: getSmartModel(),
      prompt,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse report" }, { status: 422 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[parse-inspector-report] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to parse report" }, { status: 500 });
  }
}
