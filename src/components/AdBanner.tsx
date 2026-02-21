"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
    slot: string;
    format?: "auto" | "horizontal" | "vertical" | "rectangle";
    className?: string;
}

declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

// Publisher ID — matches ADSENSE_PUB_ID in layout.tsx
const ADSENSE_PUB_ID = "ca-pub-3026726001538425";

export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
    const pushed = useRef(false);

    useEffect(() => {
        if (pushed.current) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
        } catch {
            // AdSense not loaded or blocked by ad blocker
        }
    }, []);

    return (
        <div className={`ad-container w-full overflow-hidden text-center min-h-[90px] ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", minHeight: "90px" }}
                data-ad-client={ADSENSE_PUB_ID}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
