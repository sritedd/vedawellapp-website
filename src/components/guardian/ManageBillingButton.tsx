"use client";

import { useState } from "react";

export default function ManageBillingButton() {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            // Silently fail — user can try again
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="text-sm px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
        >
            {loading ? "Loading..." : "Guardian Pro — Manage Billing"}
        </button>
    );
}
