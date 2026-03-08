"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ConsentChoice = "granted" | "denied";

function getStoredConsent(): ConsentChoice | null {
    if (typeof window === "undefined") return null;
    const val = localStorage.getItem("cookie_consent");
    if (val === "granted" || val === "denied") return val;
    return null;
}

function updateGoogleConsent(adConsent: ConsentChoice, analyticsConsent: ConsentChoice) {
    if (typeof window === "undefined") return;
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    function gtag(...args: any[]) {
        w.dataLayer.push(args);
    }
    gtag("consent", "update", {
        ad_storage: adConsent,
        ad_user_data: adConsent,
        ad_personalization: adConsent,
        analytics_storage: analyticsConsent,
    });
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const stored = getStoredConsent();
        if (!stored) {
            // Show banner after short delay
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
        // Apply stored consent on load
        updateGoogleConsent(stored, stored);
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "granted");
        updateGoogleConsent("granted", "granted");
        setVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie_consent", "denied");
        updateGoogleConsent("denied", "denied");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-card border-t border-border shadow-lg">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
                <p className="text-sm text-muted flex-1">
                    We use cookies for analytics and personalised ads. By clicking &quot;Accept&quot;, you consent
                    to cookies as described in our{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                    </Link>
                    . You can change your preference at any time.
                </p>
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted/10 transition-colors font-medium"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
