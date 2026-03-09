"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { getAdminConversations, adminReply } from "@/app/guardian/actions";

interface Message {
    id: string;
    user_id: string;
    message: string;
    is_admin_reply: boolean;
    read_at: string | null;
    created_at: string;
}

interface Conversation {
    user_id: string;
    email: string | null;
    full_name: string | null;
    messages: Message[];
    unread_count: number;
    last_message_at: string;
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

export default function AdminSupportInbox({ initial }: { initial: Conversation[] }) {
    const [conversations, setConversations] = useState<Conversation[]>(initial);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [reply, setReply] = useState("");
    const [isPending, startTransition] = useTransition();
    const bottomRef = useRef<HTMLDivElement>(null);

    const active = conversations.find(c => c.user_id === activeId);
    const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeId, conversations]);

    const handleRefresh = () => {
        startTransition(async () => {
            const { conversations: fresh } = await getAdminConversations();
            setConversations(fresh as Conversation[]);
        });
    };

    const handleReply = () => {
        if (!reply.trim() || !activeId || isPending) return;
        const text = reply.trim();
        setReply("");

        startTransition(async () => {
            const res = await adminReply(activeId, text);
            if (res.error) return;
            const { conversations: fresh } = await getAdminConversations();
            setConversations(fresh as Conversation[]);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleReply();
        }
    };

    if (conversations.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-muted text-sm">No support messages yet</p>
            </div>
        );
    }

    return (
        <div className="flex border border-border rounded-xl overflow-hidden h-[500px]">
            {/* Sidebar — conversation list */}
            <div className="w-72 border-r border-border flex flex-col bg-muted/5 shrink-0">
                <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wide">
                        Inbox {totalUnread > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {totalUnread}
                            </span>
                        )}
                    </span>
                    <button
                        onClick={handleRefresh}
                        disabled={isPending}
                        className="text-[10px] text-muted hover:text-foreground disabled:opacity-50"
                    >
                        {isPending ? "..." : "Refresh"}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((c) => (
                        <button
                            key={c.user_id}
                            onClick={() => setActiveId(c.user_id)}
                            className={`w-full text-left px-3 py-3 border-b border-border/50 hover:bg-muted/10 transition-colors ${
                                activeId === c.user_id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium truncate max-w-[160px]">
                                    {c.full_name || c.email || "Unknown"}
                                </span>
                                {c.unread_count > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">
                                        {c.unread_count}
                                    </span>
                                )}
                            </div>
                            {c.email && c.full_name && (
                                <p className="text-[10px] text-muted truncate">{c.email}</p>
                            )}
                            <p className="text-[10px] text-muted mt-0.5 truncate">
                                {c.messages[c.messages.length - 1]?.message}
                            </p>
                            <p className="text-[10px] text-muted/50 mt-0.5">{timeAgo(c.last_message_at)}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
                {!active ? (
                    <div className="flex-1 flex items-center justify-center text-muted text-sm">
                        Select a conversation
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="px-4 py-2.5 border-b border-border bg-muted/5">
                            <p className="text-sm font-semibold">{active.full_name || active.email}</p>
                            {active.full_name && active.email && (
                                <p className="text-[10px] text-muted">{active.email}</p>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                            {active.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.is_admin_reply ? "justify-end" : "justify-start"}`}
                                >
                                    <div className="max-w-[80%]">
                                        <div
                                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                                msg.is_admin_reply
                                                    ? "bg-primary text-white rounded-tr-md"
                                                    : "bg-muted/15 text-foreground rounded-tl-md"
                                            }`}
                                        >
                                            {msg.message}
                                        </div>
                                        <span className={`text-[10px] text-muted/50 mt-0.5 block ${
                                            msg.is_admin_reply ? "text-right mr-1" : "ml-1"
                                        }`}>
                                            {msg.is_admin_reply ? "You" : "User"} · {timeAgo(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Reply input */}
                        <div className="border-t border-border px-3 py-2.5">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Reply..."
                                    rows={1}
                                    maxLength={2000}
                                    className="flex-1 resize-none px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={!reply.trim() || isPending}
                                    className="px-3 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0"
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
