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

const PRO_MONTHLY_PRICE = 14.99;
const TRIAL_DAYS = 7;

/**
 * GET /api/admin/business-stats
 *
 * One-stop dashboard for the founder. Aggregates the numbers that actually
 * tell you whether the business is moving:
 *
 *   - tier counts (free / trial / pro) + active vs expired trials
 *   - MRR estimate from the Pro count (no Stripe fetch — this is the
 *     ledger-floor estimate, useful for sanity-checking Stripe)
 *   - signup velocity (new profiles in last 7 / 30 days)
 *   - new Pro conversions in last 30 days
 *   - PDF subscribers (top-of-funnel) and their conversion rate
 *   - project / defect / variation counts as engagement signals
 *
 * Admin-only via the same auth pattern as /api/admin/lead-stats.
 *
 * IMPORTANT: Stripe is the ledger of truth for actual revenue. This endpoint
 * reflects what the app's DB believes about subscriptions, which may briefly
 * lag Stripe between a webhook firing and the profile row updating. If the
 * numbers disagree with the Stripe dashboard, trust Stripe.
 */
export async function GET(req: NextRequest) {
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
        console.error("[business-stats] Profile lookup failed:", profileErr.message);
        return NextResponse.json({ error: "Could not verify access" }, { status: 503 });
    }

    const isAdmin = profile?.is_admin === true || isAdminEmail(user.email);
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = getServiceSupabase();
    const now = new Date();
    const nowIso = now.toISOString();
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const day90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Pull all profiles. Cheap at our scale (zero customers); revisit when
    // we have 100k+ users.
    const { data: profiles, error: profilesErr } = await service
        .from("profiles")
        .select("id, subscription_tier, subscription_updated_at, trial_ends_at, last_seen_at, created_at, stripe_customer_id, referral_count, is_admin");

    if (profilesErr) {
        console.error("[business-stats] Profiles read failed:", profilesErr.message);
        return NextResponse.json({ error: "Could not load profiles" }, { status: 503 });
    }

    const rows = profiles ?? [];

    // ── Tier breakdown ─────────────────────────────────────────────
    const counts = { free: 0, trial: 0, guardian_pro: 0, other: 0, admins: 0 };
    let trialActive = 0;
    let trialExpired = 0;
    let proConvertedLast30 = 0;
    let newSignupsLast7 = 0;
    let newSignupsLast30 = 0;
    let activeLast30 = 0;
    let withStripeCustomer = 0;

    for (const p of rows) {
        const tier = (p.subscription_tier as string) || "free";
        if (tier === "free") counts.free++;
        else if (tier === "trial") counts.trial++;
        else if (tier === "guardian_pro") counts.guardian_pro++;
        else counts.other++;

        if (p.is_admin) counts.admins++;
        if (p.stripe_customer_id) withStripeCustomer++;

        if (tier === "trial") {
            const trialEnds = p.trial_ends_at ? new Date(p.trial_ends_at as string).getTime() : 0;
            if (trialEnds > now.getTime()) trialActive++;
            else trialExpired++;
        }

        if (tier === "guardian_pro" && p.subscription_updated_at) {
            if (new Date(p.subscription_updated_at as string).toISOString() >= day30) {
                proConvertedLast30++;
            }
        }

        if (p.created_at) {
            const created = new Date(p.created_at as string).toISOString();
            if (created >= day7) newSignupsLast7++;
            if (created >= day30) newSignupsLast30++;
        }

        if (p.last_seen_at && new Date(p.last_seen_at as string).toISOString() >= day30) {
            activeLast30++;
        }
    }

    // ── MRR estimate ───────────────────────────────────────────────
    const proCount = counts.guardian_pro;
    const mrrEstimate = +(proCount * PRO_MONTHLY_PRICE).toFixed(2);
    const arrEstimate = +(mrrEstimate * 12).toFixed(2);

    // ── PDF funnel (red-flags lead magnet) ─────────────────────────
    const { count: pdfTotal } = await service
        .from("email_subscribers")
        .select("email", { count: "exact", head: true })
        .eq("source", "red-flags-pdf");

    const { count: pdfLast30 } = await service
        .from("email_subscribers")
        .select("email", { count: "exact", head: true })
        .eq("source", "red-flags-pdf")
        .gte("created_at", day30);

    const { count: pdfActive } = await service
        .from("email_subscribers")
        .select("email", { count: "exact", head: true })
        .eq("source", "red-flags-pdf")
        .eq("status", "active");

    // ── Engagement signals ─────────────────────────────────────────
    const { count: projectCount } = await service
        .from("projects")
        .select("id", { count: "exact", head: true });

    const { count: projectsLast30 } = await service
        .from("projects")
        .select("id", { count: "exact", head: true })
        .gte("created_at", day30);

    const { count: defectCount } = await service
        .from("defects")
        .select("id", { count: "exact", head: true });

    const { count: defectsLast30 } = await service
        .from("defects")
        .select("id", { count: "exact", head: true })
        .gte("created_at", day30);

    const { count: variationCount } = await service
        .from("variations")
        .select("id", { count: "exact", head: true });

    // ── Trials expiring in next 7 days (intervention window) ───────
    const day7Ahead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: trialsExpiringSoon } = await service
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_tier", "trial")
        .gte("trial_ends_at", nowIso)
        .lt("trial_ends_at", day7Ahead);

    return NextResponse.json({
        generated_at: nowIso,
        notice: "Stripe is the source of truth for revenue. These numbers reflect the app's DB and may briefly lag Stripe.",
        revenue: {
            mrr_estimate_aud: mrrEstimate,
            arr_estimate_aud: arrEstimate,
            pro_count: proCount,
            pro_price_aud_monthly: PRO_MONTHLY_PRICE,
        },
        tiers: {
            free: counts.free,
            trial_total: counts.trial,
            trial_active: trialActive,
            trial_expired_still_on_tier: trialExpired,
            guardian_pro: counts.guardian_pro,
            other_unknown: counts.other,
            admins: counts.admins,
        },
        users: {
            total: rows.length,
            with_stripe_customer: withStripeCustomer,
            new_signups_last_7d: newSignupsLast7,
            new_signups_last_30d: newSignupsLast30,
            active_last_30d: activeLast30,
            pro_conversions_last_30d: proConvertedLast30,
            trials_expiring_next_7d: trialsExpiringSoon ?? 0,
        },
        lead_magnet: {
            pdf_signups_total: pdfTotal ?? 0,
            pdf_signups_last_30d: pdfLast30 ?? 0,
            pdf_active_subscribers: pdfActive ?? 0,
            pdf_to_trial_or_pro_conversion_pct: pdfTotal && pdfTotal > 0
                ? +(((counts.trial + counts.guardian_pro) / pdfTotal) * 100).toFixed(2)
                : 0,
        },
        engagement: {
            projects_total: projectCount ?? 0,
            projects_last_30d: projectsLast30 ?? 0,
            defects_total: defectCount ?? 0,
            defects_last_30d: defectsLast30 ?? 0,
            variations_total: variationCount ?? 0,
            trial_length_days: TRIAL_DAYS,
        },
    });
}
