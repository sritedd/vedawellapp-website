import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { streamText } from "ai";
import { getSmartModel, isAIAvailable } from "@/lib/ai/provider";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

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

    // Rate limiting (3-second window for chat)
    if (checkRateLimit(user.id, 3000)) {
      return NextResponse.json(
        { error: "Please wait a moment before sending another message" },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const { messages, projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 messages per request" },
        { status: 400 }
      );
    }

    // Validate and sanitize each message
    const sanitizedMessages = messages.map(
      (msg: any) => {
        let rawText = "";
        if (msg.content && typeof msg.content === "string") {
            rawText = msg.content;
        } else if (Array.isArray(msg.parts)) {
            rawText = msg.parts.map((p: any) => p.text || "").join(" ");
        } else if (msg.text) {
            rawText = msg.text;
        }
        
        const content = stripHtml(String(rawText || "")).slice(0, 4000);
        
        // Block empty content which will crash Gemini
        const safeContent = content.trim() ? content : "[empty message]";
        
        const role = msg.role === "assistant" ? "assistant" : "user";
        return { role: role as "user" | "assistant", content: safeContent };
      }
    );

    // Fetch project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, state, builder_name, contract_value, status, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch current stage
    const { data: stages } = await supabase
      .from("stages")
      .select("name, status")
      .eq("project_id", projectId)
      .eq("status", "in_progress")
      .limit(1);

    const currentStage = stages?.[0]?.name || "Unknown";

    // Fetch open defects for context
    const { data: defects } = await supabase
      .from("defects")
      .select("title, severity, status")
      .eq("project_id", projectId)
      .in("status", ["open", "in_progress"])
      .limit(20);

    const openDefects = (defects || []).map((d) => ({
      title: d.title,
      severity: d.severity,
      status: d.status,
    }));

    // Build system prompt with real project data
    const systemPrompt = buildChatSystemPrompt(
      {
        name: project.name,
        state: project.state,
        builder_name: project.builder_name,
        contract_value: project.contract_value,
        status: project.status,
      },
      currentStage,
      openDefects
    );

    // Stream the response
    const result = streamText({
      model: getSmartModel(),
      system: systemPrompt,
      messages: sanitizedMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[guardian-chat] Error:",
      error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
