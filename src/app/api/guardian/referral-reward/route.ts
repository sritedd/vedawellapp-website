import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

// Max referral rewards per user to prevent abuse
const MAX_REFERRAL_REWARDS = 10;

export async function POST(req: NextRequest) {
    try {
        // Verify CRON_SECRET — internal use only
        const authHeader = req.headers.get("authorization");
        if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { referrerUserId, referredUserId } = await req.json();

        if (!referrerUserId || typeof referrerUserId !== "string") {
            return NextResponse.json(
                { error: "referrerUserId is required" },
                { status: 400 }
            );
        }

        // Guard: referrer cannot refer themselves
        if (referredUserId && referredUserId === referrerUserId) {
            return NextResponse.json(
                { error: "Cannot refer yourself" },
                { status: 400 }
            );
        }

        const supabase = getServiceSupabase();

        // Look up the referrer's profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, subscription_tier, trial_ends_at, referral_count")
            .eq("id", referrerUserId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "Referrer not found" },
                { status: 404 }
            );
        }

        // Guard: cap referral rewards to prevent farming
        if ((profile.referral_count || 0) >= MAX_REFERRAL_REWARDS) {
            return NextResponse.json({
                success: true,
                message: "Referral counted but reward cap reached",
            });
        }

        // Guard: if referred user exists, check they aren't using same email domain as referrer
        // (prevents creating user+1@gmail.com, user+2@gmail.com etc.)
        if (referredUserId) {
            const { data: referredProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", referredUserId)
                .single();

            if (referredProfile?.email && profile.email) {
                const referrerDomain = profile.email.split("@")[1]?.toLowerCase();
                const referredDomain = referredProfile.email.split("@")[1]?.toLowerCase();

                // Block if same custom domain (allow common providers like gmail, outlook, etc.)
                const commonProviders = new Set([
                    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com",
                    "yahoo.com", "icloud.com", "protonmail.com", "live.com",
                ]);

                if (referrerDomain === referredDomain && !commonProviders.has(referrerDomain)) {
                    return NextResponse.json(
                        { error: "Referral from same organization not eligible for rewards" },
                        { status: 400 }
                    );
                }
            }

            // Guard: check referred user's account age (must be created in last 7 days)
            const { data: referredAuth } = await supabase.auth.admin.getUserById(referredUserId);
            if (referredAuth?.user?.created_at) {
                const accountAge = Date.now() - new Date(referredAuth.user.created_at).getTime();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                if (accountAge > sevenDays) {
                    return NextResponse.json(
                        { error: "Referred user account too old for referral reward" },
                        { status: 400 }
                    );
                }
            }
        }

        const tier = profile.subscription_tier || "free";

        // If referrer is already Pro, skip — they don't need a trial extension
        if (tier === "guardian_pro") {
            // Atomic increment: use current value as condition to prevent lost updates
            await supabase
                .from("profiles")
                .update({ referral_count: (profile.referral_count || 0) + 1 })
                .eq("id", referrerUserId)
                .eq("referral_count", profile.referral_count || 0);

            return NextResponse.json({
                success: true,
                message: "Referrer is already Pro — referral counted but no trial extension needed",
            });
        }

        const REWARD_DAYS = 7;
        let newTrialEnd: Date;

        if (tier === "trial" && profile.trial_ends_at) {
            const currentEnd = new Date(profile.trial_ends_at);
            const baseDate = currentEnd > new Date() ? currentEnd : new Date();
            newTrialEnd = new Date(baseDate.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000);
        } else {
            newTrialEnd = new Date(Date.now() + REWARD_DAYS * 24 * 60 * 60 * 1000);
        }

        // Atomic update: condition on current referral_count to prevent race condition overwrites
        const { error: updateError, count: updatedCount } = await supabase
            .from("profiles")
            .update({
                subscription_tier: "trial",
                trial_ends_at: newTrialEnd.toISOString(),
                referral_count: (profile.referral_count || 0) + 1,
            })
            .eq("id", referrerUserId)
            .eq("referral_count", profile.referral_count || 0);

        // If no rows updated, another request already modified the count — retry would be needed
        if (!updateError && updatedCount === 0) {
            return NextResponse.json(
                { error: "Concurrent update detected. Please retry." },
                { status: 409 }
            );
        }

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
