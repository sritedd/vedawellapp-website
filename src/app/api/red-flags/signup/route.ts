import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { generateRedFlagsPdf } from "@/lib/export/red-flags-pdf";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

const VALID_STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
const UTM_FIELD_MAX = 120;
const REFERRER_FIELD_MAX = 500;

const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Extract + sanitise UTM/referrer attribution from request body. */
function parseAttribution(raw: unknown): {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    utm_term: string | null;
    referrer_url: string | null;
} {
    const empty = {
        utm_source: null, utm_medium: null, utm_campaign: null,
        utm_content: null, utm_term: null, referrer_url: null,
    };
    if (!raw || typeof raw !== "object") return empty;
    const a = raw as Record<string, unknown>;
    const clean = (v: unknown, max: number): string | null => {
        if (typeof v !== "string") return null;
        const trimmed = v.trim().slice(0, max);
        return trimmed || null;
    };
    return {
        utm_source: clean(a.utm_source, UTM_FIELD_MAX),
        utm_medium: clean(a.utm_medium, UTM_FIELD_MAX),
        utm_campaign: clean(a.utm_campaign, UTM_FIELD_MAX),
        utm_content: clean(a.utm_content, UTM_FIELD_MAX),
        utm_term: clean(a.utm_term, UTM_FIELD_MAX),
        referrer_url: clean(a.referrer_url, REFERRER_FIELD_MAX),
    };
}

/**
 * POST /api/red-flags/signup
 *
 * Lead-magnet signup. Stores the email in `email_subscribers` (source =
 * "red-flags-pdf") and sends the welcome email with the PDF attached.
 *
 * Idempotent: if the email is already subscribed (any source), we re-send the
 * PDF but don't error. Marketing intent: never make a worried homeowner feel
 * shut out from the document they came for.
 */
export async function POST(req: NextRequest) {
    let body: { email?: unknown; firstName?: unknown; state?: unknown; attribution?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 60) : null;
    const stateInput = typeof body.state === "string" ? body.state.toUpperCase().trim() : null;
    const state = stateInput && VALID_STATES.has(stateInput) ? stateInput : null;
    const attribution = parseAttribution(body.attribution);

    if (!email || !email.includes("@") || email.length > 200) {
        return NextResponse.json({ error: "Valid email address required." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        console.error("[red-flags/signup] RESEND_API_KEY not configured");
        return NextResponse.json({ error: "Email delivery temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const supabase = getServiceSupabase();

    // Check existing subscriber so we can return alreadySubscribed flag (UX cue,
    // not a hard fail — we still re-send the PDF in case they lost it).
    const { data: existing, error: existingErr } = await supabase
        .from("email_subscribers")
        .select("email, status, first_name")
        .eq("email", email)
        .maybeSingle();

    if (existingErr) {
        console.error("[red-flags/signup] Lookup failed:", existingErr.message);
        return NextResponse.json({ error: "Could not save your signup. Please try again." }, { status: 503 });
    }

    // Upsert. We persist whatever extra fields the user provided. If the row
    // already exists with a name/state we don't overwrite with null — only fill blanks.
    const upsertPayload: Record<string, unknown> = {
        email,
        source: "red-flags-pdf",
        status: "active",
    };
    if (firstName) upsertPayload.first_name = firstName;

    // First-touch attribution: only set UTM/referrer if the row is new.
    // Existing rows keep their original attribution so we don't credit a
    // returning visitor's last-click over the channel that originally found them.
    if (!existing) {
        if (attribution.utm_source) upsertPayload.utm_source = attribution.utm_source;
        if (attribution.utm_medium) upsertPayload.utm_medium = attribution.utm_medium;
        if (attribution.utm_campaign) upsertPayload.utm_campaign = attribution.utm_campaign;
        if (attribution.utm_content) upsertPayload.utm_content = attribution.utm_content;
        if (attribution.utm_term) upsertPayload.utm_term = attribution.utm_term;
        if (attribution.referrer_url) upsertPayload.referrer_url = attribution.referrer_url;
    }

    const { error: upsertErr } = await supabase
        .from("email_subscribers")
        .upsert(upsertPayload, { onConflict: "email" });

    if (upsertErr) {
        console.error("[red-flags/signup] Upsert failed:", upsertErr.message);
        return NextResponse.json({ error: "Could not save your signup. Please try again." }, { status: 503 });
    }

    // Generate PDF + send welcome email
    let pdfBytes: Uint8Array;
    try {
        pdfBytes = await generateRedFlagsPdf();
    } catch (e) {
        console.error("[red-flags/signup] PDF generation failed:", e instanceof Error ? e.message : e);
        return NextResponse.json({ error: "Could not generate the PDF. Please try again." }, { status: 503 });
    }

    // Fetch unsubscribe token (auto-generated by the schema default)
    const { data: tokenRow } = await supabase
        .from("email_subscribers")
        .select("unsubscribe_token")
        .eq("email", email)
        .maybeSingle();

    const unsubToken = tokenRow?.unsubscribe_token || "";
    const unsubUrl = `https://vedawellapp.com/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

    const greetingName = firstName || existing?.first_name || "there";
    const safeName = escapeHtml(greetingName);
    const stateNote = state ? `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">We noticed you're in <strong>${escapeHtml(state)}</strong>. We'll send you the occasional tip specific to ${escapeHtml(state)} build disputes.</p>` : "";

    const resend = new Resend(resendKey);
    try {
        await resend.emails.send({
            from: "HomeGuardian <hello@vedawellapp.com>",
            to: email,
            subject: "Your free PDF: 30 Red Flags Your Builder Is Dodgy",
            html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#0d6e6e 0%,#075959 100%);color:#ffffff;padding:32px 28px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5eead4;margin-bottom:8px;">HomeGuardian</div>
    <h1 style="margin:0;font-size:26px;font-weight:800;line-height:1.25;">Your PDF is attached</h1>
  </div>
  <div style="padding:28px;">
    <p style="color:#0f172a;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${safeName},</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">Thanks for grabbing the guide. The PDF — <strong>30 Red Flags Your Builder Is Dodgy</strong> — is attached to this email.</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">Save it to your phone now. When something feels off during your build, come back to it and match what you're seeing. Each red flag has a specific action — follow it the same day. Delay is the builder's friend.</p>
    ${stateNote}
    <div style="background:#f0fdfa;border-left:4px solid #14b8a6;padding:16px 18px;border-radius:6px;margin:24px 0;">
      <div style="color:#0f766e;font-weight:700;font-size:14px;margin-bottom:6px;">If you're already in a builder dispute</div>
      <p style="color:#134e4a;font-size:14px;line-height:1.6;margin:0;">HomeGuardian is the tool we built to help you log defects, generate tribunal-ready evidence packages, and run AI checks on contracts and progress claims. <a href="https://vedawellapp.com/guardian/pricing" style="color:#0d9488;font-weight:600;">Try it free for 7 days</a> — no credit card.</p>
    </div>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">Stay sharp out there.</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0;">— The HomeGuardian team</p>
  </div>
  <div style="background:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.6;">
    <p style="margin:0 0 8px;">HomeGuardian by VedaWell &middot; Australia</p>
    <p style="margin:0;">Don't want these emails? <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe in one click</a></p>
  </div>
</div>
</body></html>`,
            attachments: [
                {
                    filename: "30-Red-Flags-HomeGuardian.pdf",
                    content: Buffer.from(pdfBytes),
                },
            ],
        });
    } catch (e) {
        console.error("[red-flags/signup] Resend send failed:", e instanceof Error ? e.message : e);
        return NextResponse.json({ error: "Could not send the email. Please try again." }, { status: 503 });
    }

    // Mark welcome as sent (sequence_stage = 1 = welcome delivered)
    const { error: stampErr } = await supabase
        .from("email_subscribers")
        .update({ sequence_stage: 1, last_email_at: new Date().toISOString() })
        .eq("email", email);
    if (stampErr) {
        console.error("[red-flags/signup] Stage stamp failed:", stampErr.message);
        // Non-fatal — email already sent
    }

    return NextResponse.json({
        success: true,
        alreadySubscribed: !!existing && existing.status === "active",
    });
}
