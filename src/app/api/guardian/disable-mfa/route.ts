import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/guardian/disable-mfa
 * Body: { password: string } OR { code: string }
 *
 * Disables MFA for the authenticated user.
 * Requires either the account password or a valid TOTP code.
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (c) =>
                        c.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        ),
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await request.json();
        const { password, code } = body;

        if (!password && !code) {
            return NextResponse.json(
                { error: "Password or authenticator code is required" },
                { status: 400 }
            );
        }

        // Verify identity: either password or TOTP code
        if (password) {
            // Re-authenticate with password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password,
            });
            if (signInError) {
                return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
            }
        } else if (code) {
            // Verify TOTP code
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.totp?.find((f: { status: string }) => f.status === "verified");
            if (!totpFactor) {
                return NextResponse.json({ error: "No active 2FA factor found" }, { status: 400 });
            }

            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: totpFactor.id,
            });
            if (challengeError) {
                return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
            }

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challenge.id,
                code,
            });
            if (verifyError) {
                return NextResponse.json({ error: "Incorrect authenticator code" }, { status: 403 });
            }
        }

        // Identity verified — now unenroll via admin API
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

        // List user's MFA factors via admin API
        const factorsRes = await fetch(
            `${supabaseUrl}/auth/v1/admin/users/${user.id}/factors`,
            {
                headers: {
                    Authorization: `Bearer ${serviceKey}`,
                    apikey: serviceKey,
                },
            }
        );

        if (!factorsRes.ok) {
            return NextResponse.json({ error: "Failed to fetch MFA factors" }, { status: 500 });
        }

        const adminFactors = await factorsRes.json();
        const totpFactors = (Array.isArray(adminFactors) ? adminFactors : []).filter(
            (f: { factor_type: string }) => f.factor_type === "totp"
        );

        for (const factor of totpFactors) {
            await fetch(
                `${supabaseUrl}/auth/v1/admin/users/${user.id}/factors/${factor.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${serviceKey}`,
                        apikey: serviceKey,
                    },
                }
            );
        }

        // Update profile
        const serviceSupabase = createServerClient(
            supabaseUrl,
            serviceKey,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );

        await serviceSupabase.from("profiles").update({
            mfa_enabled: false,
            mfa_verified_at: null,
        }).eq("id", user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[disable-mfa] Error:", error instanceof Error ? error.message : error);
        return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
    }
}
