"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, X } from "lucide-react";

export default function StickyGuardianCTA() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            // Show after scrolling past the hero (roughly 600px)
            setVisible(window.scrollY > 600);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (dismissed || !visible) return null;

    return (
        <>
            {/* Desktop: Top bar */}
            <div className="hidden md:block fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-primary/20 shadow-lg animate-slide-down">
                <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-primary-light" />
                        <span className="text-sm text-slate-300">
                            <strong className="text-white">Building a home?</strong> Guardian catches what builders hide.
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/guardian/login?view=sign-up"
                            className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                        >
                            Try Free
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 text-slate-500 hover:text-white transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: Bottom floating button */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 z-[60] animate-slide-up">
                <Link
                    href="/guardian/login?view=sign-up"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                    <Shield className="w-5 h-5" />
                    Get HomeOwner Guardian — Free
                </Link>
            </div>
        </>
    );
}
