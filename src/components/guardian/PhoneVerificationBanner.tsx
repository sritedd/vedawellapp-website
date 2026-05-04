"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PhoneVerificationGate from "@/components/guardian/PhoneVerificationGate";

const DISMISS_KEY = "vw_phone_verify_banner_dismissed";

/**
 * Soft phone-verification prompt shown inside the project page when the user
 * hasn't verified their phone yet. Replaces the hard-block gate that used to
 * sit before project creation. Pro/admin users skip — same logic as the
 * underlying gate component.
 *
 * Dismissible per-session via sessionStorage. Reappears on next visit so we
 * don't lose the verification entirely if user dismisses absent-mindedly.
 */
export default function PhoneVerificationBanner() {
    const [shouldShow, setShouldShow] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function check() {
            try {
                const dismissed = sessionStorage.getItem(DISMISS_KEY) === "true";
                if (dismissed) return;
            } catch {
                // sessionStorage unavailable — proceed
            }

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("phone_verified, identity_verified, is_admin, subscription_tier")
                .eq("id", user.id)
                .single();
            if (cancelled) return;

            if (profile?.is_admin || profile?.subscription_tier === "guardian_pro") return;
            if (profile?.identity_verified || profile?.phone_verified) return;

            setShouldShow(true);
        }
        check();
        return () => { cancelled = true; };
    }, []);

    if (!shouldShow) return null;

    if (expanded) {
        return (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
                <PhoneVerificationGate
                    onVerified={() => {
                        setShouldShow(false);
                        try {
                            sessionStorage.setItem(DISMISS_KEY, "true");
                        } catch {
                            // best-effort
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Verify your phone to unlock everything</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 truncate">Takes 30 seconds — required for AI features and dispute escalation.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => setExpanded(true)}
                    className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
                >
                    Verify
                </button>
                <button
                    onClick={() => {
                        setShouldShow(false);
                        try { sessionStorage.setItem(DISMISS_KEY, "true"); } catch { /* best-effort */ }
                    }}
                    aria-label="Dismiss for this session"
                    className="p-1.5 rounded-md text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
