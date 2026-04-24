"use client";

import { useState } from "react";
import { createAnnouncement, dismissAnnouncement, cleanupExpiredTrials } from "@/app/guardian/actions";

export default function AdminAnnouncementManager() {
    const [message, setMessage] = useState("");
    const [type, setType] = useState<"info" | "warning" | "success">("info");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleCreate = async () => {
        if (!message.trim()) return;
        setLoading(true);
        setResult(null);
        const res = await createAnnouncement(message.trim(), type);
        if (res.error) {
            setResult({ type: "error", text: res.error });
        } else {
            setResult({ type: "success", text: "Announcement published to all Guardian users" });
            setMessage("");
        }
        setLoading(false);
    };

    const handleDismiss = async () => {
        setLoading(true);
        setResult(null);
        const res = await dismissAnnouncement();
        if (res.error) {
            setResult({ type: "error", text: res.error });
        } else {
            setResult({ type: "success", text: "Active announcement dismissed" });
        }
        setLoading(false);
    };

    const handleCleanupTrials = async () => {
        setLoading(true);
        setResult(null);
        const res = await cleanupExpiredTrials();
        if (res.error) {
            setResult({ type: "error", text: res.error });
        } else {
            setResult({ type: "success", text: `Cleaned up ${res.count} expired trial(s)` });
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Announcement creator */}
            <div>
                <h3 className="text-sm font-bold mb-3">Create Announcement</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Banner message for all Guardian users..."
                        className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as "info" | "warning" | "success")}
                        className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
                    >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                    </select>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    <button
                        onClick={handleCreate}
                        disabled={loading || !message.trim()}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Publish Announcement
                    </button>
                    <button
                        onClick={handleDismiss}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-muted/20 text-foreground hover:bg-muted/30 border border-border disabled:opacity-50 transition-colors"
                    >
                        Dismiss Current
                    </button>
                </div>
            </div>

            {/* Maintenance actions */}
            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-bold mb-3">Maintenance</h3>
                <button
                    onClick={handleCleanupTrials}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    Cleanup Expired Trials
                </button>
                <p className="text-xs text-muted mt-1">Downgrades all users with expired trials back to free tier.</p>
            </div>

            {result && (
                <div className={`p-3 rounded-lg text-sm ${
                    result.type === "error"
                        ? "bg-red-500/10 text-red-600 border border-red-500/20"
                        : "bg-green-500/10 text-green-600 border border-green-500/20"
                }`}>
                    {result.text}
                </div>
            )}
        </div>
    );
}
