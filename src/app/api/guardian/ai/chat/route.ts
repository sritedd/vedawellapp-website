import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { getSmartModel, getSmartModelName, isAIAvailable, isCheapAIAvailable } from "@/lib/ai/provider";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, checkProAccess, checkDailyQuota } from "@/lib/ai/rate-limit";
import { logAIUsage, retrieveKnowledge } from "@/lib/ai/cache";

/** GET /api/guardian/ai/chat — diagnostic endpoint (no auth required) */
export async function GET() {
  const diag: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    ai_available: isAIAvailable(),
    cheap_ai_available: isCheapAIAvailable(),
    env: {
      GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
      GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    selected_model: "unknown",
    model_init: "not_tested",
  };

  try {
    diag.selected_model = getSmartModelName();
    const model = getSmartModel();
    diag.model_init = "ok";
    diag.model_id = (model as any).modelId || "unknown";
  } catch (e) {
    diag.model_init = "failed";
    diag.model_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(diag);
}

/**
 * Safely convert incoming messages to model messages.
 * The client sends UIMessage[] (with parts/id/status) via DefaultChatTransport.
 * If convertToModelMessages fails (e.g. malformed data), fall back to manual extraction.
 */
async function safeConvertMessages(messages: unknown[]) {
  try {
    return await convertToModelMessages(messages as UIMessage[]);
  } catch (e) {
    console.warn("[guardian-chat] convertToModelMessages failed, using fallback:", e);
    // Fallback: extract text from whatever format we received
    return messages.map((msg: any) => {
      let content = "";
      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (Array.isArray(msg.parts)) {
        content = msg.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text || "")
          .join("");
      }
      const role = msg.role === "assistant" ? ("assistant" as const) : ("user" as const);
      return { role, content: content || "[empty message]" };
    });
  }
}

export async function POST(request: NextRequest) {
  const debug: Record<string, unknown> = { steps: [] };
  const step = (name: string, data?: unknown) => {
    (debug.steps as string[]).push(name);
    if (data !== undefined) debug[name] = data;
    console.log(`[guardian-chat] ✓ ${name}`, data !== undefined ? JSON.stringify(data).slice(0, 200) : "");
  };

  try {
    // Step 1: Check AI availability
    const available = isAIAvailable();
    step("ai_available", { available });
    if (!available) {
      return NextResponse.json(
        { error: "AI features are not currently available. Please configure an AI API key.", debug },
        { status: 503 }
      );
    }

    // Step 2: Authenticate user
    step("auth_start");
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    step("env_check", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasGoogleKey: !!process.env.GOOGLE_AI_API_KEY || !!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !!process.env.GEMINI_API_KEY,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY,
    });

    const supabase = createServerClient(
      supabaseUrl!,
      supabaseKey!,
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
      step("auth_failed");
      return NextResponse.json({ error: "Unauthorized", debug }, { status: 401 });
    }
    step("auth_ok", { userId: user.id.slice(0, 8) + "..." });

    // Step 3: Tier gating — chat is Pro-only
    const { allowed, tier } = await checkProAccess(supabase, user.id);
    step("tier_check", { allowed, tier });
    if (!allowed) {
      return NextResponse.json(
        { error: "AI Chat is available on the Pro plan. Upgrade to unlock.", debug },
        { status: 403 }
      );
    }

    // Step 4: Rate limiting (3-second window for chat)
    if (checkRateLimit(user.id, 3000)) {
      step("rate_limited");
      return NextResponse.json(
        { error: "Please wait a moment before sending another message", debug },
        { status: 429 }
      );
    }
    step("rate_limit_ok");

    // Step 5: Daily quota check
    const quota = await checkDailyQuota(supabase, user.id, tier, "chat");
    step("quota_check", { allowed: quota.allowed, used: quota.used, limit: quota.limit });
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily chat limit reached (${quota.used}/${quota.limit}).`, debug },
        { status: 429 }
      );
    }

    // Step 6: Parse and validate body
    const body = await request.json();
    const { messages, projectId } = body;
    step("body_parsed", {
      projectId: projectId?.slice(0, 8),
      messageCount: Array.isArray(messages) ? messages.length : "not-array",
      firstMsgKeys: messages?.[0] ? Object.keys(messages[0]) : [],
      firstMsgRole: messages?.[0]?.role,
      bodyKeys: Object.keys(body),
    });

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required", debug },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required", debug },
        { status: 400 }
      );
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 messages per request", debug },
        { status: 400 }
      );
    }

    // Step 7: Convert UIMessages from the client into model messages
    const modelMessages = await safeConvertMessages(messages);
    step("messages_converted", {
      count: modelMessages.length,
      roles: modelMessages.map((m: any) => m.role),
    });

    // Step 8: Fetch project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, state, builder_name, contract_value, status, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      step("project_not_found", { error: projectError?.message });
      return NextResponse.json(
        { error: "Project not found", debug },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      step("project_forbidden");
      return NextResponse.json({ error: "Forbidden", debug }, { status: 403 });
    }
    step("project_ok", { name: project.name, state: project.state });

    // Step 9: Fetch current stage
    const { data: stages } = await supabase
      .from("stages")
      .select("name, status")
      .eq("project_id", projectId)
      .eq("status", "in_progress")
      .order("order_index", { ascending: true })
      .limit(1);

    const currentStage = stages?.[0]?.name || "Unknown";
    step("stage_fetched", { currentStage });

    // Step 10: Fetch open defects for context
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
    step("defects_fetched", { count: openDefects.length });

    // Step 11: Retrieve knowledge base context
    const kbSnippets = await retrieveKnowledge({
      state: project.state,
      limit: 8,
    });
    step("kb_retrieved", { snippetCount: kbSnippets.length });

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

    step("prompt_built", { systemPromptLength: (systemPrompt + kbContext).length });

    // Step 12: Initialize model
    const startTime = Date.now();
    const modelName = getSmartModelName();
    step("model_selected", { modelName });

    let model;
    try {
      model = getSmartModel();
      step("model_init_ok");
    } catch (modelError) {
      const msg = modelError instanceof Error ? modelError.message : String(modelError);
      step("model_init_failed", { error: msg });
      console.error("[guardian-chat] Model init failed:", msg);
      return NextResponse.json(
        { error: `AI service is not configured: ${msg}`, debug },
        { status: 503 }
      );
    }

    // Step 13: Start streaming
    step("streaming_start", {
      model: modelName,
      messageCount: modelMessages.length,
      systemLength: (systemPrompt + kbContext).length,
    });

    const result = streamText({
      model,
      system: systemPrompt + kbContext,
      messages: modelMessages,
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
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.constructor.name : typeof error;
        const errorStack = error instanceof Error ? error.stack?.split("\n").slice(0, 3).join(" | ") : undefined;
        console.error("[guardian-chat] Stream error:", JSON.stringify({
          name: errorName,
          message: errorMsg.slice(0, 500),
          stack: errorStack,
          model: modelName,
          debug,
        }));
        logAIUsage({
          userId: user.id,
          feature: "chat",
          model: modelName,
          success: false,
          errorCode: `${errorName}: ${errorMsg}`.slice(0, 100),
        }).catch(() => {});
        return `AI error (${modelName}): ${errorMsg.slice(0, 300)}`;
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack?.split("\n").slice(0, 5).join(" | ") : undefined;
    console.error("[guardian-chat] Unhandled error:", JSON.stringify({
      message: errorMsg,
      stack: errorStack,
      debug,
    }));
    logAIUsage({ feature: "chat", model: "unknown", success: false, errorCode: errorMsg.slice(0, 100) }).catch(() => {});
    return NextResponse.json(
      { error: `An error occurred: ${errorMsg.slice(0, 200)}`, debug },
      { status: 500 }
    );
  }
}
