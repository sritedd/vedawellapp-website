"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Don't show if user already dismissed
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after user has been on the site for 30 seconds
            setTimeout(() => setShowPrompt(true), 30000);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slideUp">
            <div className="max-w-md mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5">
                <div className="flex items-start gap-4">
                    <div className="text-3xl">🛠️</div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm">Add VedaWell to Home Screen</h3>
                        <p className="text-xs text-muted mt-1">
                            Quick access to 90+ tools, daily Panchang, and games — works offline!
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-muted hover:text-foreground text-lg leading-none"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 text-sm text-muted hover:text-foreground py-2 rounded-lg border border-border"
                    >
                        Not now
                    </button>
                    <button
                        onClick={handleInstall}
                        className="flex-1 btn-primary text-sm py-2"
                    >
                        Install
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}
