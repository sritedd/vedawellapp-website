"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendSupportMessage, getMyMessages } from "@/app/guardian/actions";

interface Message {
    id: string;
    message: string;
    is_admin_reply: boolean;
    read_at: string | null;
    created_at: string;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function SupportChat({ initialMessages }: { initialMessages: Message[] }) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isPending, startTransition] = useTransition();
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isPending) return;

        // Optimistic update
        const optimistic: Message = {
            id: `temp-${Date.now()}`,
            message: trimmed,
            is_admin_reply: false,
            read_at: null,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";

        startTransition(async () => {
            const res = await sendSupportMessage(trimmed);
            if (res.error) {
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                return;
            }
            // Refresh messages from server
            const { messages: fresh } = await getMyMessages();
            setMessages(fresh);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRefresh = () => {
        startTransition(async () => {
            const { messages: fresh } = await getMyMessages();
            setMessages(fresh);
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] max-h-[700px] bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/5">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold">VedaWell Support</span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isPending}
                    className="text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
                    title="Refresh messages"
                >
                    {isPending ? "..." : "Refresh"}
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">💬</div>
                        <p className="text-muted text-sm font-medium">No messages yet</p>
                        <p className="text-muted text-xs mt-1">Send us a message and we&apos;ll get back to you as soon as possible.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.is_admin_reply ? "justify-start" : "justify-end"}`}
                    >
                        <div className={`max-w-[80%] group`}>
                            {msg.is_admin_reply && (
                                <span className="text-[10px] text-muted font-medium ml-1 mb-0.5 block">
                                    VedaWell Support
                                </span>
                            )}
                            <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                    msg.is_admin_reply
                                        ? "bg-muted/15 text-foreground rounded-tl-md"
                                        : "bg-primary text-white rounded-tr-md"
                                }`}
                            >
                                {msg.message}
                            </div>
                            <span className={`text-[10px] text-muted/60 mt-0.5 block ${
                                msg.is_admin_reply ? "ml-1" : "mr-1 text-right"
                            }`}>
                                {timeAgo(msg.created_at)}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-3 bg-background">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        maxLength={2000}
                        className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-border bg-muted/5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm leading-relaxed"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isPending}
                        className="px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0"
                    >
                        Send
                    </button>
                </div>
                <p className="text-[10px] text-muted mt-1.5 ml-1">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
