import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Automated trial cleanup endpoint.
 *
 * Downgrades all expired trials to free tier.
 * Protected by a shared secret (CRON_SECRET) so only authorized
 * callers (Netlify scheduled functions, external cron, or admin) can trigger it.
 *
 * Setup options:
 * 1. Netlify Scheduled Function: call this endpoint daily
 * 2. External cron (e.g., cron-job.org): GET /api/cron/cleanup-trials?secret=YOUR_SECRET
 * 3. Manual: admin can call from browser/curl
 */
export async function GET(req: NextRequest) {
    // Verify authorization
    const secret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    // Allow if: correct secret provided, OR no CRON_SECRET env var set (dev mode)
    if (cronSecret && secret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );

    const now = new Date().toISOString();

    // 1. Downgrade expired trials
    // Keep trial_ends_at so start-trial can detect prior usage and block re-claims
    const { data: expiredTrials, error: trialError } = await supabase
        .from("profiles")
        .update({
            subscription_tier: "free",
            subscription_updated_at: now,
        })
        .eq("subscription_tier", "trial")
        .lt("trial_ends_at", now)
        .select("id, email");

    if (trialError) {
        console.error("[Cron] Trial cleanup error:", trialError);
        return NextResponse.json({ error: trialError.message }, { status: 500 });
    }

    const count = expiredTrials?.length ?? 0;

    if (count > 0) {
        console.log(`[Cron] Downgraded ${count} expired trials:`,
            expiredTrials?.map((p: { email: string }) => p.email));
    }

    return NextResponse.json({
        success: true,
        expired_trials_cleaned: count,
        timestamp: now,
    });
}
