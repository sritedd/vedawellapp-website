"use client";

import { useState } from "react";

export default function ReferralCard({ url, code, count }: { url: string; code: string; count: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {/* Referral link */}
            <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wide">Your Referral Link</label>
                <div className="mt-2 flex items-center gap-2">
                    <input
                        type="text"
                        readOnly
                        value={url}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/5 text-sm font-mono select-all"
                    />
                    <button
                        onClick={handleCopy}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                            copied
                                ? "bg-green-500 text-white"
                                : "bg-primary text-white hover:bg-primary/90"
                        }`}
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-2">
                <div>
                    <p className="text-2xl font-extrabold">{count}</p>
                    <p className="text-xs text-muted">Referral{count !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-xs text-muted">
                    <p>Code: <span className="font-mono font-bold">{code}</span></p>
                </div>
            </div>
        </div>
    );
}
