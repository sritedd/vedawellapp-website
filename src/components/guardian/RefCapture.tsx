"use client";

import { useEffect } from "react";

/**
 * Captures ?ref=CODE from the URL and persists it to localStorage so that
 * when the visitor later signs up (from any page), the login page can read
 * it and credit the referrer via /api/guardian/apply-referral.
 *
 * Mount anywhere on a public landing page — it renders nothing.
 */
export default function RefCapture() {
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get("ref");
            if (ref && /^[A-Z0-9]{4,16}$/.test(ref)) {
                localStorage.setItem("vw_ref_code", ref);
            }
        } catch {
            // Storage may be blocked in privacy mode — referral silently skipped.
        }
    }, []);

    return null;
}
