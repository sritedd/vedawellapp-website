"use client";

import { useEffect } from "react";
import { trackToolView } from "@/lib/analytics";

/** Fires a GA4 tool_view event once when a tool page mounts. */
export default function ToolViewTracker({ toolSlug }: { toolSlug: string }) {
    useEffect(() => {
        trackToolView(toolSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}
