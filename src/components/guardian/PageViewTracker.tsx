"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Generates a random session ID, persisted for the browser tab lifetime */
function getSessionId(): string {
    if (typeof window === "undefined") return "";
    let sid = sessionStorage.getItem("pv_session_id");
    if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem("pv_session_id", sid);
    }
    return sid;
}

/**
 * Tracks page views for authenticated Guardian users.
 * Drop this into the Guardian layout — it fires on every route change.
 * Uses navigator.sendBeacon for reliability (survives tab close).
 */
export default function PageViewTracker() {
    const pathname = usePathname();
    const lastTracked = useRef<string>("");

    useEffect(() => {
        // Skip if same path (prevents double-fire from strict mode)
        if (pathname === lastTracked.current) return;
        lastTracked.current = pathname;

        // Only track /guardian/* pages
        if (!pathname.startsWith("/guardian")) return;

        const payload = JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
            sessionId: getSessionId(),
        });

        // Use sendBeacon for reliability — doesn't block navigation
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                "/api/guardian/track-view",
                new Blob([payload], { type: "application/json" })
            );
        } else {
            // Fallback for older browsers
            fetch("/api/guardian/track-view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
                keepalive: true,
            }).catch(() => {});
        }
    }, [pathname]);

    return null;
}
