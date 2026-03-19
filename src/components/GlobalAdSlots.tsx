"use client";

import { usePathname } from "next/navigation";
import AdBanner from "@/components/AdBanner";

/** Routes where ads SHOULD appear (content/free pages only) */
const AD_ENABLED_PREFIXES = [
    "/tools",
    "/blog",
    "/games",
    // "/panchang", // hidden for now
    "/compare",
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

    // Only show ads on content pages (tools, blog, games, etc.)
    if (!AD_ENABLED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return null;
    }

    if (position === "top") {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 pt-4">
                <AdBanner slot="1696472735" format="horizontal" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pb-4">
            <AdBanner slot="9056088001" format="horizontal" />
        </div>
    );
}
