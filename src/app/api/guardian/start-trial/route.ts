import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAuthSupabase(cookieStore: any) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );
}

function getServiceSupabase() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for start-trial");
    }
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

export async function POST() {
    const cookieStore = await cookies();
    const authSupabase = getAuthSupabase(cookieStore);

    // 1. Require authentication (use anon client for auth only)
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Use service role for all profile reads/writes (bypasses RLS restrictions on sensitive columns)
    const supabase = getServiceSupabase();

    // 3. Look up profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier, trial_ends_at")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        return NextResponse.json(
            { error: "Profile not found. Please complete signup first." },
            { status: 404 }
        );
    }

    // 4. Already a paying subscriber
    if (profile.subscription_tier === "guardian_pro") {
        return NextResponse.json(
            { error: "Already subscribed to Guardian Pro." },
            { status: 400 }
        );
    }

    // 5. Trial currently active
    if (
        profile.subscription_tier === "trial" &&
        profile.trial_ends_at &&
        new Date(profile.trial_ends_at) > new Date()
    ) {
        return NextResponse.json(
            { error: "Trial already active. Expires " + new Date(profile.trial_ends_at).toLocaleDateString() + "." },
            { status: 400 }
        );
    }

    // 6. Trial already used (trial_ends_at is in the past)
    if (profile.trial_ends_at && new Date(profile.trial_ends_at) <= new Date()) {
        return NextResponse.json(
            { error: "Trial already used. Subscribe to Guardian Pro to continue with full access." },
            { status: 400 }
        );
    }

    // 7. Grant 7-day trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            subscription_tier: "trial",
            trial_ends_at: trialEnd.toISOString(),
            subscription_updated_at: now.toISOString(),
        })
        .eq("id", user.id);

    if (updateError) {
        console.error("[start-trial] Update error:", updateError);
        return NextResponse.json(
            { error: "Failed to start trial. Please try again." },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        trialEnd: trialEnd.toISOString(),
    });
}
