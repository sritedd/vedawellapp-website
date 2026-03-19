import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

export async function POST(req: NextRequest) {
    try {
        // Verify CRON_SECRET — internal use only
        const authHeader = req.headers.get("authorization");
        if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { referrerUserId } = await req.json();

        if (!referrerUserId || typeof referrerUserId !== "string") {
            return NextResponse.json(
                { error: "referrerUserId is required" },
                { status: 400 }
            );
        }

        const supabase = getServiceSupabase();

        // Look up the referrer's profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, subscription_tier, trial_ends_at, referral_count")
            .eq("id", referrerUserId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "Referrer not found" },
                { status: 404 }
            );
        }

        const tier = profile.subscription_tier || "free";

        // If referrer is already Pro, skip — they don't need a trial extension
        if (tier === "guardian_pro") {
            // Still increment referral_count
            await supabase
                .from("profiles")
                .update({ referral_count: (profile.referral_count || 0) + 1 })
                .eq("id", referrerUserId);

            return NextResponse.json({
                success: true,
                message: "Referrer is already Pro — referral counted but no trial extension needed",
            });
        }

        const REWARD_DAYS = 7;
        let newTrialEnd: Date;

        if (tier === "trial" && profile.trial_ends_at) {
            // Extend existing trial by 7 days
            const currentEnd = new Date(profile.trial_ends_at);
            // If trial already expired, extend from now instead
            const baseDate = currentEnd > new Date() ? currentEnd : new Date();
            newTrialEnd = new Date(baseDate.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000);
        } else {
            // Free tier — grant a new 7-day trial from now
            newTrialEnd = new Date(Date.now() + REWARD_DAYS * 24 * 60 * 60 * 1000);
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                subscription_tier: "trial",
                trial_ends_at: newTrialEnd.toISOString(),
                referral_count: (profile.referral_count || 0) + 1,
            })
            .eq("id", referrerUserId);

        if (updateError) {
            console.error("Error updating referrer profile:", updateError);
            return NextResponse.json(
                { error: "Failed to update referrer profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            newTrialEnd: newTrialEnd.toISOString(),
        });
    } catch (err) {
        console.error("Referral reward error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
