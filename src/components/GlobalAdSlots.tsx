"use client";

import { usePathname } from "next/navigation";
import AdBanner from "@/components/AdBanner";

/** Routes where ads should NOT appear (authenticated/SaaS pages) */
const AD_FREE_PREFIXES = [
    "/guardian/dashboard",
    "/guardian/projects",
    "/guardian/profile",
];

/**
 * Global ad slot rendered in root layout.
 * Appears on all pages except Guardian authenticated routes.
 *
 * position="top"    → leaderboard ad below navbar
 * position="bottom" → rectangle ad above footer
 */
export default function GlobalAdSlot({ position }: { position: "top" | "bottom" }) {
    const pathname = usePathname();

    if (AD_FREE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return null;
    }

    if (position === "top") {
        return (
            <div className="max-w-7xl mx-auto px-4 pt-4">
                <AdBanner slot="1696472735" format="horizontal" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pb-4">
            <AdBanner slot="9056088001" format="horizontal" />
        </div>
    );
}
