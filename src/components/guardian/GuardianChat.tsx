"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  updated_at: string;
}

interface GuardianChatProps {
  projectId: string;
  projectName: string;
}

export default function GuardianChat({
  projectId,
  projectName,
}: GuardianChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Conversation history state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/guardian/ai/chat",
        body: { projectId },
      }),
    [projectId]
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Fetch user ID on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Fetch conversation history when userId is available
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    supabase
      .from("ai_conversations")
      .select("id, title, messages, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: Conversation[] | null }) => {
        if (data) setConversations(data);
        setLoadingHistory(false);
      });
  }, [userId, projectId]);

  // Save conversation to Supabase (debounced — called after AI response completes)
  const saveConversation = useCallback(
    async (
      conversationId: string | null,
      msgs: { role: string; content: string }[]
    ) => {
      if (!userId || msgs.length === 0) return;

      const supabase = createClient();

      // Build serializable messages array
      const serialized = msgs.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Generate title from first user message
      const firstUserMsg = msgs.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "")
        : "New Conversation";

      if (conversationId) {
        // Update existing conversation
        await supabase
          .from("ai_conversations")
          .update({ messages: serialized, title })
          .eq("id", conversationId);

        // Update local list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: serialized as Conversation["messages"], title, updated_at: new Date().toISOString() }
              : c
          )
        );
      } else {
        // Create new conversation
        const { data } = await supabase
          .from("ai_conversations")
          .insert({
            project_id: projectId,
            user_id: userId,
            title,
            messages: serialized,
          })
          .select("id, title, messages, updated_at")
          .single();

        if (data) {
          setActiveConversationId(data.id);
          setConversations((prev) => [data as Conversation, ...prev]);
        }
      }
    },
    [userId, projectId]
  );

  // Watch for AI response completion — save when streaming finishes
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    const nowReady = status === "ready";
    prevStatusRef.current = status;

    if (wasStreaming && nowReady && messages.length > 0) {
      // Debounce: clear any pending save, schedule new one
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        // Extract text content from message parts
        const plainMessages = messages.map((m) => ({
          role: m.role,
          content: m.parts
            ?.filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("") || "",
        }));
        saveConversation(activeConversationId, plainMessages);
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [status, messages, activeConversationId, saveConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load a past conversation
  function loadConversation(conv: Conversation) {
    setActiveConversationId(conv.id);

    // Convert saved messages into the format useChat expects
    const restored = conv.messages.map((m, i) => ({
      id: `restored-${i}`,
      role: m.role as "user" | "assistant",
      content: m.content,
      parts: [{ type: "text" as const, text: m.content }],
      createdAt: new Date(),
    }));

    setMessages(restored);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  // Start a new conversation
  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  // Delete a conversation
  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    await supabase.from("ai_conversations").delete().eq("id", convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
  }

  // Format date for sidebar
  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex h-[600px] max-h-[80vh] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Sidebar — conversation history */}
      <div
        className={`${
          sidebarOpen ? "w-64 border-r border-gray-200 dark:border-gray-700" : "w-0"
        } transition-all duration-200 overflow-hidden flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-800`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            History
          </span>
          <button
            onClick={startNewChat}
            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="New Chat"
          >
            + New
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingHistory ? (
            <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500">
              No past conversations
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group ${
                  activeConversationId === conv.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1 leading-snug">
                    {conv.title}
                  </p>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity flex-shrink-0 mt-0.5"
                    title="Delete"
                    aria-label="Delete conversation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatDate(conv.updated_at)} &middot; {conv.messages.length} msgs
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-tr-xl">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            title={sidebarOpen ? "Close history" : "Show history"}
            aria-label="Toggle conversation history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-xl" role="img" aria-label="robot">
            &#x1F916;
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Guardian AI
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {projectName}
              {activeConversationId && conversations.find((c) => c.id === activeConversationId) && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  &mdash; {conversations.find((c) => c.id === activeConversationId)?.title}
                </span>
              )}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Start new conversation"
            >
              New Chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <span className="text-4xl block mb-3" role="img" aria-label="construction">
                  &#x1F3D7;&#xFE0F;
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Ask me anything about your build — inspections, defects,
                  payments, or Australian building standards.
                </p>
                {conversations.length > 0 && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View {conversations.length} past conversation{conversations.length !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.parts.map((part, i) =>
                    part.type === "text" ? <span key={i}>{part.text}</span> : null
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">
              Something went wrong. Please try again.
            </p>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your build..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
