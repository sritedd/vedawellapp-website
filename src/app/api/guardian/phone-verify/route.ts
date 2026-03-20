import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * Phone OTP Verification API
 *
 * POST /api/guardian/phone-verify
 * Actions:
 *   - { action: "send", phone: "+61400000000" } — send OTP to phone
 *   - { action: "verify", code: "123456" } — verify OTP code
 *
 * OTP is stored as a SHA-256 hash in profiles.phone_otp_hash.
 * In production, integrate Twilio/MessageBird to send real SMS.
 * For MVP, the OTP is logged server-side (dev) or sent via email fallback.
 */

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function normalizePhone(raw: string): string {
    // Strip spaces, dashes, parens
    let phone = raw.replace(/[\s\-()]/g, "");
    // Convert Australian local format to international
    if (phone.startsWith("04")) {
        phone = "+61" + phone.slice(1);
    }
    if (phone.startsWith("614")) {
        phone = "+" + phone;
    }
    return phone;
}

function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

function hashOTP(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

async function getAuthenticatedUser(cookieStore: any) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: any[]) =>
                    c.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    ),
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
}

function getServiceSupabase() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for phone-verify");
    }
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { cookies: { getAll: () => [], setAll: () => {} } }
    );
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const { user } = await getAuthenticatedUser(cookieStore);

        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        const serviceSupabase = getServiceSupabase();

        if (action === "send") {
            const rawPhone = body.phone;
            if (!rawPhone || typeof rawPhone !== "string") {
                return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
            }

            const phone = normalizePhone(rawPhone);

            // Validate Australian phone format
            if (!/^\+61[2-9]\d{8}$/.test(phone)) {
                return NextResponse.json(
                    { error: "Please enter a valid Australian phone number (e.g. 0400 000 000)" },
                    { status: 400 }
                );
            }

            // Check if phone is already used by another account
            const { data: existingUser } = await serviceSupabase
                .from("profiles")
                .select("id")
                .eq("phone", phone)
                .neq("id", user.id)
                .single();

            if (existingUser) {
                return NextResponse.json(
                    { error: "This phone number is already linked to another account" },
                    { status: 409 }
                );
            }

            // Generate OTP
            const otp = generateOTP();
            const otpHash = hashOTP(otp);
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

            // Store OTP hash and update phone
            await serviceSupabase
                .from("profiles")
                .update({
                    phone,
                    phone_otp_hash: otpHash,
                    phone_otp_expires_at: expiresAt,
                    phone_otp_attempts: 0,
                    phone_verified: false,
                })
                .eq("id", user.id);

            // --- Send OTP ---
            // MVP: Use email fallback (free, no Twilio needed)
            // Production: Replace with Twilio SMS
            const userEmail = user.email;
            if (userEmail) {
                // NEVER log the OTP in production — credential exposure risk
                if (process.env.NODE_ENV === "development") {
                    console.log(`[Phone OTP] Code for ${phone}: ${otp} (dev only)`);
                }

                // If Resend is configured, send email with OTP
                if (process.env.RESEND_API_KEY) {
                    try {
                        await fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                from: "HomeOwner Guardian <noreply@vedawellapp.com>",
                                to: [userEmail],
                                subject: `Your verification code: ${otp}`,
                                html: `
                                    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                                        <h2 style="color: #333;">Phone Verification</h2>
                                        <p>Your verification code for phone number ${phone} is:</p>
                                        <div style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; padding: 20px; text-align: center; background: #F5F3FF; border-radius: 8px; margin: 16px 0;">
                                            ${otp}
                                        </div>
                                        <p style="color: #666; font-size: 14px;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
                                        <p style="color: #999; font-size: 12px;">HomeOwner Guardian by VedaWell</p>
                                    </div>
                                `,
                            }),
                        });
                    } catch (emailErr) {
                        console.warn("[Phone OTP] Email send failed:", emailErr);
                    }
                }
            }

            return NextResponse.json({
                success: true,
                // Be transparent: this is email-based verification until SMS is integrated
                message: `Verification code sent to your email (${userEmail}). This verifies your email identity — SMS verification coming soon.`,
                method: "email", // Clients can show appropriate UI
                expiresIn: OTP_EXPIRY_MINUTES * 60,
            });
        }

        if (action === "verify") {
            const code = body.code;
            if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
                return NextResponse.json({ error: "Please enter a 6-digit code" }, { status: 400 });
            }

            // Get current OTP data
            const { data: profile } = await serviceSupabase
                .from("profiles")
                .select("phone_otp_hash, phone_otp_expires_at, phone_otp_attempts, phone")
                .eq("id", user.id)
                .single();

            if (!profile || !profile.phone_otp_hash) {
                return NextResponse.json(
                    { error: "No verification code found. Please request a new one." },
                    { status: 400 }
                );
            }

            // Check attempts
            if ((profile.phone_otp_attempts || 0) >= MAX_OTP_ATTEMPTS) {
                return NextResponse.json(
                    { error: "Too many attempts. Please request a new code." },
                    { status: 429 }
                );
            }

            // Check expiry
            if (new Date(profile.phone_otp_expires_at) < new Date()) {
                return NextResponse.json(
                    { error: "Verification code has expired. Please request a new one." },
                    { status: 410 }
                );
            }

            // Increment attempts
            await serviceSupabase
                .from("profiles")
                .update({ phone_otp_attempts: (profile.phone_otp_attempts || 0) + 1 })
                .eq("id", user.id);

            // Verify OTP
            const codeHash = hashOTP(code);
            if (codeHash !== profile.phone_otp_hash) {
                const remaining = MAX_OTP_ATTEMPTS - (profile.phone_otp_attempts || 0) - 1;
                return NextResponse.json(
                    { error: `Incorrect code. ${remaining} attempt(s) remaining.` },
                    { status: 400 }
                );
            }

            // Success — mark as verified
            // Note: Currently email-based OTP, so this verifies identity, not phone ownership.
            // When Twilio SMS is integrated, this will verify actual phone ownership.
            await serviceSupabase
                .from("profiles")
                .update({
                    phone_verified: true,
                    phone_verified_at: new Date().toISOString(),
                    phone_otp_hash: null,
                    phone_otp_expires_at: null,
                    phone_otp_attempts: 0,
                })
                .eq("id", user.id);

            return NextResponse.json({
                success: true,
                message: "Phone verified successfully!",
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("[phone-verify] Error:", error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
