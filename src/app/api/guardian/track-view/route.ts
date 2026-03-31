import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/guardian/track-view
 * Logs a page view for the authenticated user.
 * Called by the PageViewTracker client component on every Guardian page load.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "/unknown";
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 1000) : null;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    // Insert page view
    const { error } = await supabase
        .from("page_views")
        .insert({
            user_id: user.id,
            path,
            referrer,
            session_id: sessionId,
            user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
        });

    if (error) {
        // Don't fail the request — tracking is best-effort
        console.error("[TrackView] Insert failed:", error.message);
    }

    // Update profile last_page_view_at (fire-and-forget, throttled to 1 min)
    await supabase
        .from("profiles")
        .update({ last_page_view_at: new Date().toISOString() })
        .eq("id", user.id)
        .catch(() => {});

    return NextResponse.json({ ok: true });
}
