import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Apply Referral
 *
 * POST /api/guardian/apply-referral { refCode: string }
 *
 * Called by the signup flow after a new user's account is created.
 * Looks up the referrer by their public `referral_code`, then invokes
 * the internal /api/guardian/referral-reward endpoint with CRON_SECRET
 * to credit the referrer.
 *
 * Wiring step that was missing for J14 (referral journey):
 * without this, every referral link silently failed to credit anyone.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const refCode: unknown = body?.refCode;

        if (!refCode || typeof refCode !== "string" || refCode.length < 4 || refCode.length > 16) {
            return NextResponse.json({ ok: true, applied: false, reason: "no-code" });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const cronSecret = process.env.CRON_SECRET;
        if (!serviceKey?.trim() || !cronSecret?.trim()) {
            console.error("[apply-referral] Missing SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET");
            return NextResponse.json({ ok: true, applied: false, reason: "not-configured" });
        }

        const service = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
            { cookies: { getAll: () => [], setAll: () => { } } }
        );

        // Look up referrer by public code
        const { data: referrer, error: lookupErr } = await service
            .from("profiles")
            .select("id")
            .eq("referral_code", refCode)
            .maybeSingle();

        if (lookupErr) {
            console.error("[apply-referral] Referrer lookup failed:", lookupErr.message);
            return NextResponse.json({ ok: true, applied: false, reason: "lookup-failed" });
        }

        if (!referrer?.id) {
            return NextResponse.json({ ok: true, applied: false, reason: "unknown-code" });
        }

        if (referrer.id === user.id) {
            return NextResponse.json({ ok: true, applied: false, reason: "self-referral" });
        }

        // Idempotency: only credit once per new user. If this user already
        // had a referrer recorded, skip.
        const { data: existing } = await service
            .from("profiles")
            .select("referred_by")
            .eq("id", user.id)
            .maybeSingle();

        if (existing?.referred_by) {
            return NextResponse.json({ ok: true, applied: false, reason: "already-referred" });
        }

        await service
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", user.id);

        // Invoke the internal referral-reward endpoint with CRON_SECRET
        const origin = req.nextUrl.origin;
        const res = await fetch(`${origin}/api/guardian/referral-reward`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cronSecret}`,
            },
            body: JSON.stringify({
                referrerUserId: referrer.id,
                referredUserId: user.id,
            }),
        });

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error("[apply-referral] referral-reward failed:", res.status, errBody);
            return NextResponse.json({ ok: true, applied: false, reason: "reward-call-failed" });
        }

        return NextResponse.json({ ok: true, applied: true });
    } catch (err) {
        console.error("[apply-referral] Error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
