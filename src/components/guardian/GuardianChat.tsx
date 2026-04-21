"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";
import { Bot, X, Send, History, Trash2, PlusCircle, AlertCircle, ChevronDown } from "lucide-react";

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
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Floating widget state
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const [userId, setUserId] = useState<string | null>(null);
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Fetch history
  useEffect(() => {
    if (!userId || !isOpen) return; // Only load when opened
    const supabase = createClient();

    supabase
      .from("ai_conversations")
      .select("id, title, messages, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: any[] | null }) => {
        if (data) setConversations(data as Conversation[]);
        setLoadingHistory(false);
      });
  }, [userId, projectId, isOpen]);

  // Save conversation
  const saveConversation = useCallback(
    async (
      conversationId: string | null,
      msgs: { role: string; content: string }[]
    ) => {
      if (!userId || msgs.length === 0) return;

      const supabase = createClient();
      const firstUserMsg = msgs.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "")
        : "New Conversation";

      if (conversationId) {
        const { error: updateErr } = await supabase
          .from("ai_conversations")
          .update({ messages: msgs, title })
          .eq("id", conversationId);

        if (updateErr) {
          console.error("[GuardianChat] Failed to save conversation:", updateErr.message);
          return;
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: msgs as Conversation["messages"], title, updated_at: new Date().toISOString() }
              : c
          )
        );
      } else {
        const { data, error: insertErr } = await supabase
          .from("ai_conversations")
          .insert({
            project_id: projectId,
            user_id: userId,
            title,
            messages: msgs,
          })
          .select("id, title, messages, updated_at")
          .single();

        if (insertErr) {
          console.error("[GuardianChat] Failed to create conversation:", insertErr.message);
          return;
        }

        if (data) {
          setActiveConversationId(data.id);
          setConversations((prev) => [data as Conversation, ...prev]);
        }
      }
    },
    [userId, projectId]
  );

  // Watch for AI readiness and trigger save
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
          role: m.role as "user" | "assistant",
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

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  function loadConversation(conv: Conversation) {
    setActiveConversationId(conv.id);
    const restored = conv.messages.map((m, i) => ({
      id: `restored-${i}`,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
      createdAt: new Date(),
    }));
    setMessages(restored as any);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    const { error: delErr } = await supabase.from("ai_conversations").delete().eq("id", convId);
    if (delErr) {
      toast(`Failed to delete conversation: ${delErr.message}`, "error");
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  function handleSubmitIntercept(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const diff = new Date().getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  }

  // Parse error message nicely
  let displayError = null;
  if (error) {
    try {
        // Try to parse if it's JSON `{ error: "..." }`
        const parsed = JSON.parse(error.message);
        displayError = parsed.error || error.message;
    } catch {
        displayError = error.message || "Connection issue detected. Please try again.";
    }
  }

  return (
    <>
      <div className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-[60]">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:scale-105 transition-all duration-300 ease-out border border-white/10"
            aria-label="Open AI Chat"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75 [animation-duration:3s]" />
            <Bot className="w-7 h-7 md:w-8 md:h-8 text-white relative z-10" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-blue-500 items-center justify-center text-[10px] text-white font-bold border-2 border-white">+</span>
            </span>
          </button>
        )}
      </div>

      {/* Chat Overlay / Modal */}
      <div
        className={`fixed inset-x-3 bottom-0 top-16 md:inset-auto md:w-[450px] md:h-[650px] md:bottom-8 md:right-8 z-[60] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex w-full h-full rounded-t-3xl md:rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-800/80 bg-white/85 dark:bg-gray-950/85 backdrop-blur-2xl">
          
          {/* Sidebar */}
          <div
            className={`absolute md:relative inset-y-0 left-0 bg-white/95 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 z-20 ${
              sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-0"
            }`}
          >
            <div className="flex flex-col h-full pl-0">
               <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">History</span>
                 <button onClick={startNewChat} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-blue-500 transition-colors" title="New Chat">
                    <PlusCircle className="w-5 h-5" />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto w-full">
                  {loadingHistory ? (
                      <div className="flex items-center justify-center h-20 text-xs text-gray-400">Loading...</div>
                  ) : conversations.length === 0 ? (
                      <div className="p-5 text-xs text-center text-gray-400">No past conversations</div>
                  ) : (
                      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                          {conversations.map((conv) => (
                              <div
                                key={conv.id}
                                onClick={() => loadConversation(conv)}
                                className={`w-full group cursor-pointer text-left px-5 py-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors ${
                                  activeConversationId === conv.id ? "bg-blue-50/80 dark:bg-blue-900/30 border-l-[3px] border-blue-500" : "border-l-[3px] border-transparent"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate flex-1 leading-snug">
                                    {conv.title}
                                  </p>
                                  <button
                                    onClick={(e) => deleteConversation(conv.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-[11px] font-medium text-gray-400 mt-1.5">
                                  {formatDate(conv.updated_at)} &middot; {conv.messages.length} msgs
                                </p>
                              </div>
                          ))}
                      </div>
                  )}
               </div>
            </div>
            {/* Mobile Sidebar overlay close button */}
            {sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden absolute top-4 -right-10 w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-r-lg shadow-lg"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex flex-col flex-1 min-w-0 relative z-10 w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shrink-0">
               <div className="flex items-center gap-3">
                 <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`p-2 rounded-xl border hover:opacity-100 transition-all ${sidebarOpen ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-100 shadow-sm' : 'bg-transparent border-transparent opacity-60 hover:bg-black/5 dark:hover:bg-white/5'}`}
                 >
                    <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                 </button>
                 <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-[15px]">
                        Guardian AI
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    </h3>
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mt-0.5">{projectName}</p>
                 </div>
               </div>
               <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
               >
                 <ChevronDown className="w-5 h-5" />
               </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-6 space-y-6 scroll-smooth">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                  <div className="w-20 h-20 mb-6 rounded-[24px] bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                     <Bot className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 dark:text-white tracking-tight">How can I help you?</h4>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed">
                    I can review compliance, verify milestones, or explain building standards.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center mr-3 flex-shrink-0 mt-auto mb-1 shadow-md shadow-blue-500/20">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-5 py-3.5 text-[14px] leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      message.role === "user"
                        ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-[24px] rounded-br-[4px]"
                        : "bg-white dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 border border-gray-100/50 dark:border-gray-700/30 rounded-[24px] rounded-bl-[4px]"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words font-medium">
                      {(message.parts && message.parts.length > 0) ? 
                        message.parts.map((p, i) => p.type === "text" ? <span key={i}>{p.text}</span> : null) 
                        : null}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start items-end gap-3 animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                        <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800/90 rounded-[24px] rounded-bl-[4px] px-5 py-4 shadow-sm border border-gray-100/50 dark:border-gray-700/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="mx-5 mb-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-[13px] text-red-700 dark:text-red-400 font-medium leading-relaxed">
                  {displayError}
                </p>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmitIntercept}
              className="p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-t border-gray-100 dark:border-gray-800/60 pb-safe md:pb-4"
            >
              <div className="relative flex items-end">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitIntercept(e);
                      }
                  }}
                  placeholder="Message Guardian AI..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full max-h-32 min-h-[52px] pl-5 pr-14 py-4 rounded-[26px] bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 text-[14px] font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white dark:focus:bg-gray-900 resize-none transition-all shadow-sm inset-0"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-800 dark:disabled:to-gray-800 disabled:text-gray-400 text-white shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 ml-[1px]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
