"use client";

import { useState } from "react";

interface EmailCaptureProps {
    source: string;
    heading?: string;
    subtext?: string;
}

export default function EmailCapture({
    source,
    heading = "Get weekly tool tips & new releases",
    subtext = "Join builders, developers, and productivity nerds. No spam, unsubscribe anytime.",
}: EmailCaptureProps) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes("@")) return;

        setStatus("loading");
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source }),
            });

            if (res.ok) {
                setStatus("success");
                setEmail("");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-sm font-medium text-green-600">You are in! Check your inbox soon.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold mb-1 text-sm">{heading}</h3>
            <p className="text-xs text-muted mb-3">{subtext}</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                    {status === "loading" ? "..." : "Subscribe"}
                </button>
            </form>
            {status === "error" && (
                <p className="text-xs text-red-500 mt-2">Something went wrong. Please try again.</p>
            )}
        </div>
    );
}
