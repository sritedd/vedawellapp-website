// Thin wrapper around GA4 + Supabase tool-usage counter
// GA4 is loaded globally in layout.tsx — this just fires custom events

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gtag?: (...args: any[]) => void;
    }
}

/**
 * Fire a GA4 custom event when a user actually USES a tool (clicks the
 * primary action — calculate, convert, generate, etc.)
 *
 * Also increments the Supabase tool_usage counter (fire-and-forget).
 *
 * @param toolSlug  e.g. "bmi-calculator", "pdf-to-word"
 * @param category  Optional grouping label shown in GA4
 */
export function trackToolUse(toolSlug: string, category = "tool") {
    // GA4 custom event
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "tool_used", {
            event_category: category,
            tool_name: toolSlug,
        });
    }

    // Supabase counter — fire-and-forget, never throws
    fetch("/api/track-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
    }).catch(() => {/* ignore */});
}

/**
 * Fire a GA4 page_view-equivalent event when a tool page is first rendered.
 * Useful for tools that don't use ToolLayout (e.g. the custom PDF tools).
 * ToolLayout calls this automatically, so no need to call it manually there.
 */
export function trackToolView(toolSlug: string) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "tool_view", {
            event_category: "tool",
            tool_name: toolSlug,
        });
    }
}
