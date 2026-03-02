import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function sendWelcomeEmail(email: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // skip if not configured

    try {
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "VedaWell <hello@vedawellapp.com>",
                to: email,
                subject: "Welcome to VedaWell — 5 Tools You'll Love",
                html: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:24px;color:#1a1a2e;">Welcome to VedaWell!</h1>
  <p style="color:#555;line-height:1.6;">Thanks for subscribing. Here are 5 popular tools you might not know about:</p>
  <ol style="color:#333;line-height:2;">
    <li><a href="https://vedawell.tools/tools/password-generator" style="color:#6366f1;">Password Generator</a> — secure passwords in one click</li>
    <li><a href="https://vedawell.tools/tools/json-formatter" style="color:#6366f1;">JSON Formatter</a> — format, validate & minify JSON</li>
    <li><a href="https://vedawell.tools/tools/image-compressor" style="color:#6366f1;">Image Compressor</a> — shrink images without quality loss</li>
    <li><a href="https://vedawell.tools/tools/pdf-merge" style="color:#6366f1;">PDF Merge</a> — combine PDFs instantly in-browser</li>
    <li><a href="https://vedawell.tools/tools/qr-code-generator" style="color:#6366f1;">QR Code Generator</a> — URLs, WiFi, contacts & more</li>
  </ol>
  <p style="color:#555;line-height:1.6;">We have <strong>97+ free tools</strong> — all running in your browser, no signup needed.</p>
  <a href="https://vedawell.tools/tools" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">Browse All Tools</a>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#999;font-size:12px;">VedaWell Tools — Free, Private, Browser-Based<br>
  <a href="https://vedawell.tools/guardian/pricing" style="color:#6366f1;">Go Pro</a> for an ad-free experience.</p>
</div>`,
            }),
        });
    } catch (e) {
        console.error("Welcome email failed:", e);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { email, source } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
            process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );

        // Check if already subscribed (don't re-send welcome email)
        const { data: existing } = await supabase
            .from("email_subscribers")
            .select("email")
            .eq("email", cleanEmail)
            .maybeSingle();

        // Upsert to handle duplicate emails gracefully
        const { error } = await supabase
            .from("email_subscribers")
            .upsert(
                { email: cleanEmail, source: source || "unknown" },
                { onConflict: "email" }
            );

        if (error) {
            console.error("Subscribe error:", error);
            return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
        }

        // Send welcome email only to new subscribers (fire-and-forget)
        if (!existing) {
            void sendWelcomeEmail(cleanEmail);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
