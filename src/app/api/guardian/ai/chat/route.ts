import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { streamText } from "ai";
import { getSmartModel, isAIAvailable } from "@/lib/ai/provider";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, checkProAccess, checkDailyQuota } from "@/lib/ai/rate-limit";
import { logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";

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

    // Tier gating — chat is Pro-only
    const { allowed, tier } = await checkProAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "AI Chat is available on the Pro plan. Upgrade to unlock." },
        { status: 403 }
      );
    }

    // Rate limiting (3-second window for chat)
    if (checkRateLimit(user.id, 3000)) {
      return NextResponse.json(
        { error: "Please wait a moment before sending another message" },
        { status: 429 }
      );
    }

    // Daily quota check
    const quota = await checkDailyQuota(supabase, user.id, tier, "chat");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily chat limit reached (${quota.used}/${quota.limit}).` },
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

    // Validate, sanitize, and normalize messages (Gemini strictly requires alternating roles starting with 'user')
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

    // Ensure messages strictly alternate for Google AI (user -> assistant -> user)
    const normalizedMessages: { role: "user" | "assistant"; content: string }[] = [];
    for (const msg of sanitizedMessages) {
      if (normalizedMessages.length === 0) {
        if (msg.role === "assistant") {
          // Google requires the first message to be from the user
          normalizedMessages.push({ role: "user", content: "[Conversation started by assistant]" });
        }
        normalizedMessages.push(msg);
      } else {
        const lastMsg = normalizedMessages[normalizedMessages.length - 1];
        if (lastMsg.role === msg.role) {
          // Merge consecutive messages of the same role
          lastMsg.content += "\\n\\n" + msg.content;
        } else {
          normalizedMessages.push(msg);
        }
      }
    }

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

    // Fetch current stage (deterministic: earliest in_progress stage by order_index)
    const { data: stages } = await supabase
      .from("stages")
      .select("name, status")
      .eq("project_id", projectId)
      .eq("status", "in_progress")
      .order("order_index", { ascending: true })
      .limit(1);

    const currentStage = stages?.[0]?.name || "Unknown";

    // Fetch open defects for context — matches dashboard logic: NOT in terminal states
    const { data: defects } = await supabase
      .from("defects")
      .select("title, severity, status")
      .eq("project_id", projectId)
      .not("status", "in", "(verified,rectified)")
      .limit(20);

    const openDefects = (defects || []).map((d) => ({
      title: d.title,
      severity: d.severity,
      status: d.status,
    }));

    // Retrieve knowledge base context for grounding
    const kbSnippets = await retrieveKnowledge({
      state: project.state,
      limit: 8,
    });

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

    // Append KB context to system prompt
    const kbContext = kbSnippets.length > 0
      ? `\n\nREFERENCE DATA (use these to ground your responses in real Australian Standards and NCC requirements — cite them when relevant):\n${kbSnippets.join("\n\n")}`
      : "";

    // Stream the response
    const startTime = Date.now();
    const modelName = process.env.ANTHROPIC_API_KEY ? "claude-sonnet-4-5" : "gemini-2.5-flash";

    let model;
    try {
      model = getSmartModel();
    } catch (modelError) {
      console.error("[guardian-chat] Model init failed:", modelError);
      return NextResponse.json(
        { error: "AI service is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const result = streamText({
      model,
      system: systemPrompt + kbContext,
      messages: normalizedMessages,
    });

    // Log telemetry (fire-and-forget, don't block stream)
    logAIUsage({
      userId: user.id,
      feature: "chat",
      model: modelName,
      latencyMs: Date.now() - startTime,
      success: true,
    }).catch(() => {});

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[guardian-chat] Stream error:", error);
        logAIUsage({
          userId: user.id,
          feature: "chat",
          model: modelName,
          success: false,
          errorCode: error instanceof Error ? error.message.slice(0, 100) : "stream-error",
        }).catch(() => {});
        return "AI service encountered an error. Please try again.";
      },
    });
  } catch (error) {
    console.error("[guardian-chat] Error:",
      error instanceof Error ? error.message : "Unknown error");
    logAIUsage({ feature: "chat", model: "unknown", success: false, errorCode: error instanceof Error ? error.message.slice(0, 100) : "unknown" }).catch(() => {});
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
