import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/guardian/verify-mfa
 * Body: { code: string }
 *
 * Verifies a TOTP code for the authenticated user.
 * Used before destructive actions (project delete, account delete, etc.)
 * when the user has MFA enabled.
 *
 * Returns { verified: true } on success.
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
        const { code } = body;

        if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
            return NextResponse.json({ error: "Enter a 6-digit authenticator code" }, { status: 400 });
        }

        // Get verified TOTP factor
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.find((f: { status: string }) => f.status === "verified");

        if (!totpFactor) {
            return NextResponse.json({ error: "No active 2FA factor found" }, { status: 400 });
        }

        // Challenge + verify
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

        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error("[verify-mfa] Error:", error instanceof Error ? error.message : error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
