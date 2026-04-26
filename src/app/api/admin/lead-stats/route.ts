import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

interface SubscriberRow {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    referrer_url: string | null;
    sequence_stage: number | null;
    status: string | null;
    created_at: string;
}

/**
 * GET /api/admin/lead-stats?days=30
 *
 * Aggregates /red-flags signups by attribution source over the requested
 * window (default 30 days). Lets us see at a glance which marketing channel
 * is converting and where to double down.
 *
 * Admin-only. Returns JSON suitable for charting or a simple table.
 */
export async function GET(req: NextRequest) {
    // Auth via the user-context client (mirrors /api/admin/export pattern).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (profileErr) {
        console.error("[lead-stats] Profile lookup failed:", profileErr.message);
        return NextResponse.json({ error: "Could not verify access" }, { status: 503 });
    }

    const isAdmin = profile?.is_admin === true || isAdminEmail(user.email);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const daysParam = req.nextUrl.searchParams.get("days");
    const days = Math.min(Math.max(parseInt(daysParam || "30", 10) || 30, 1), 365);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Service-role read so we can scan all subscribers (RLS would otherwise deny).
    const service = getServiceSupabase();
    const { data: rows, error: readErr } = await service
        .from("email_subscribers")
        .select("utm_source, utm_medium, utm_campaign, referrer_url, sequence_stage, status, created_at")
        .eq("source", "red-flags-pdf")
        .gte("created_at", cutoff);

    if (readErr) {
        console.error("[lead-stats] Read failed:", readErr.message);
        return NextResponse.json({ error: "Could not load stats" }, { status: 503 });
    }

    const subscribers: SubscriberRow[] = rows ?? [];
    const total = subscribers.length;
    const active = subscribers.filter((r) => r.status === "active").length;
    const completedNurture = subscribers.filter((r) => (r.sequence_stage ?? 0) >= 99).length;

    // Aggregate by source (utm_source falls back to '(direct/organic)' when null)
    const bySource = new Map<string, { signups: number; active: number; completed: number }>();
    for (const r of subscribers) {
        const key = r.utm_source || "(direct/organic)";
        const bucket = bySource.get(key) ?? { signups: 0, active: 0, completed: 0 };
        bucket.signups++;
        if (r.status === "active") bucket.active++;
        if ((r.sequence_stage ?? 0) >= 99) bucket.completed++;
        bySource.set(key, bucket);
    }
    const sources = Array.from(bySource.entries())
        .map(([source, data]) => ({ source, ...data }))
        .sort((a, b) => b.signups - a.signups);

    // Aggregate by campaign (skip null campaigns)
    const byCampaign = new Map<string, { source: string; signups: number }>();
    for (const r of subscribers) {
        if (!r.utm_campaign) continue;
        const key = r.utm_campaign;
        const bucket = byCampaign.get(key) ?? { source: r.utm_source || "(unknown)", signups: 0 };
        bucket.signups++;
        byCampaign.set(key, bucket);
    }
    const campaigns = Array.from(byCampaign.entries())
        .map(([campaign, data]) => ({ campaign, ...data }))
        .sort((a, b) => b.signups - a.signups)
        .slice(0, 50);

    // Top referrer hostnames (helps spot organic / community-shared traffic)
    const byReferrer = new Map<string, number>();
    for (const r of subscribers) {
        if (!r.referrer_url) continue;
        try {
            const host = new URL(r.referrer_url).hostname;
            byReferrer.set(host, (byReferrer.get(host) ?? 0) + 1);
        } catch {
            // malformed URL — skip
        }
    }
    const referrers = Array.from(byReferrer.entries())
        .map(([hostname, signups]) => ({ hostname, signups }))
        .sort((a, b) => b.signups - a.signups)
        .slice(0, 25);

    return NextResponse.json({
        window_days: days,
        cutoff,
        totals: { signups: total, active, completed_nurture: completedNurture },
        by_source: sources,
        by_campaign: campaigns,
        by_referrer: referrers,
    });
}
