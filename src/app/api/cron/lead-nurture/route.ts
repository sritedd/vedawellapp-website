import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STAGE_COMPLETE = 99;
const BATCH_LIMIT = 50;
const TIMEOUT_MS = 20_000;

/**
 * Day-N nurture sequence for /red-flags PDF subscribers.
 *
 * Sequence stage progression:
 *   stage 1 → welcome email sent (set by /api/red-flags/signup)
 *   stage 2 → day-3 educational email sent (this cron)
 *   stage 3 → day-7 case-study email sent (this cron)
 *   stage 4 → day-14 trial conversion email sent (this cron, terminal)
 *   stage 99 → sequence complete, no further emails
 *
 * Drift-tolerant: keys off `last_email_at` not signup date, so a missed run
 * day still ships emails in the right interval. Email is idempotent per stage.
 *
 * POST /api/cron/lead-nurture (Bearer ${CRON_SECRET})
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret?.trim() || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        console.error("[lead-nurture] RESEND_API_KEY not configured");
        return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const supabase = getServiceSupabase();
    const now = new Date();

    const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const day7Cutoff = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();   // 4 days after day-3 = day 7 from signup
    const day14Cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();  // 7 days after day-7 = day 14 from signup

    // Pull anyone in stages 1-3 whose last email is overdue. The DB index
    // (status, sequence_stage, last_email_at) WHERE status='active' covers this.
    const { data: subscribers, error: fetchErr } = await supabase
        .from("email_subscribers")
        .select("email, first_name, sequence_stage, last_email_at, unsubscribe_token")
        .eq("status", "active")
        .in("sequence_stage", [1, 2, 3])
        .or(
            `and(sequence_stage.eq.1,last_email_at.lt.${day3Cutoff}),` +
            `and(sequence_stage.eq.2,last_email_at.lt.${day7Cutoff}),` +
            `and(sequence_stage.eq.3,last_email_at.lt.${day14Cutoff})`
        )
        .limit(BATCH_LIMIT);

    if (fetchErr) {
        console.error("[lead-nurture] Fetch failed:", fetchErr.message);
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!subscribers?.length) {
        return NextResponse.json({ success: true, emails_sent: 0, message: "No subscribers due" });
    }

    let emailsSent = 0;
    const errors: string[] = [];
    const startTime = Date.now();

    for (const sub of subscribers) {
        if (Date.now() - startTime > TIMEOUT_MS) break;
        if (!sub.email) continue;

        const firstName = (sub.first_name || "").trim() || "there";
        const safeName = escapeHtml(firstName);
        const unsubUrl = `https://vedawellapp.com/unsubscribe?token=${encodeURIComponent(sub.unsubscribe_token || "")}`;

        let subject = "";
        let html = "";
        let nextStage = 0;

        if (sub.sequence_stage === 1) {
            subject = "Spotted any of these red flags yet?";
            html = buildDay3Email(safeName, unsubUrl);
            nextStage = 2;
        } else if (sub.sequence_stage === 2) {
            subject = "How real homeowners caught their builder out";
            html = buildDay7Email(safeName, unsubUrl);
            nextStage = 3;
        } else if (sub.sequence_stage === 3) {
            subject = "Your free trial of HomeGuardian — no credit card";
            html = buildDay14Email(safeName, unsubUrl);
            nextStage = STAGE_COMPLETE;
        } else {
            continue;
        }

        try {
            await resend.emails.send({
                from: "HomeGuardian <hello@vedawellapp.com>",
                to: sub.email,
                subject,
                html,
            });

            const { error: updateErr } = await supabase
                .from("email_subscribers")
                .update({
                    sequence_stage: nextStage,
                    last_email_at: now.toISOString(),
                })
                .eq("email", sub.email);

            if (updateErr) {
                // Email sent but state update failed — log so we don't double-send next run
                errors.push(`${sub.email}: state update failed (${updateErr.message})`);
            }

            emailsSent++;
        } catch (e) {
            errors.push(`${sub.email}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    return NextResponse.json({
        success: true,
        emails_sent: emailsSent,
        candidates: subscribers.length,
        errors,
        timestamp: now.toISOString(),
    });
}

// ── Email templates ───────────────────────────────────────────────────────

function shell(safeName: string, unsubUrl: string, headerLabel: string, headline: string, body: string): string {
    return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#0d6e6e 0%,#075959 100%);color:#ffffff;padding:28px 28px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5eead4;margin-bottom:8px;">${headerLabel}</div>
    <h1 style="margin:0;font-size:22px;font-weight:800;line-height:1.3;">${headline}</h1>
  </div>
  <div style="padding:28px;color:#0f172a;font-size:15px;line-height:1.7;">
    <p style="margin:0 0 16px;">Hi ${safeName},</p>
    ${body}
  </div>
  <div style="background:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.6;">
    <p style="margin:0 0 8px;">HomeGuardian by VedaWell &middot; Australia</p>
    <p style="margin:0;">Don't want these emails? <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe in one click</a></p>
  </div>
</div>
</body></html>`;
}

function buildDay3Email(safeName: string, unsubUrl: string): string {
    const body = `
<p>It's been a few days since you grabbed the 30 Red Flags PDF. Quick check-in: have you spotted any of them on your build yet?</p>

<p>The three most-reported red flags from homeowners in your situation:</p>

<div style="background:#f0fdfa;border-left:4px solid #14b8a6;padding:14px 18px;border-radius:6px;margin:18px 0;">
  <p style="margin:0 0 6px;font-weight:700;color:#0f766e;">#06 — Concrete poured before footing inspection</p>
  <p style="margin:0;color:#134e4a;font-size:14px;">Most common at slab stage. Once concrete sets, you'll never see what's underneath.</p>
</div>

<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:6px;margin:18px 0;">
  <p style="margin:0 0 6px;font-weight:700;color:#92400e;">#15 — Appliance brand substituted</p>
  <p style="margin:0;color:#78350f;font-size:14px;">Builder pockets the difference. Always inspect installed brand against your contract spec at fixing stage.</p>
</div>

<div style="background:#fee2e2;border-left:4px solid #dc2626;padding:14px 18px;border-radius:6px;margin:18px 0;">
  <p style="margin:0 0 6px;font-weight:700;color:#991b1b;">#23 — Variations you never signed</p>
  <p style="margin:0;color:#7f1d1d;font-size:14px;">Final invoices often include $5K-$15K of "agreed" variations with no signed paperwork. Under state law, these are invalid.</p>
</div>

<p>If any of these match what you're seeing, the action steps are in your PDF — pull it up and follow them today. Delay is the builder's friend.</p>

<p style="margin:24px 0 8px;">Stay sharp,</p>
<p style="margin:0;">— The HomeGuardian team</p>

<p style="margin:24px 0 0;font-size:13px;color:#64748b;">P.S. We're building tools to help homeowners catch these issues. <a href="https://vedawellapp.com/guardian" style="color:#0d9488;font-weight:600;">Have a look</a> if you want to see what we do.</p>
`;
    return shell(safeName, unsubUrl, "Day 3 · Field check", "Spotted any red flags yet?", body);
}

function buildDay7Email(safeName: string, unsubUrl: string): string {
    const body = `
<p>One week in. Hopefully your build is going smoothly — but if not, you're not alone.</p>

<p>Three real situations homeowners caught using the same red flags from your PDF:</p>

<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px 18px;border-radius:8px;margin:16px 0;">
  <p style="margin:0 0 6px;font-weight:700;color:#0f172a;">Sarah, NSW — caught a $14,000 contract discrepancy before signing</p>
  <p style="margin:0;color:#475569;font-size:14px;">Compared the construction drawings attached to her contract against her approved design plans. Found the master bedroom 200mm narrower and two windows missing entirely. Refused to sign until corrected.</p>
</div>

<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px 18px;border-radius:8px;margin:16px 0;">
  <p style="margin:0 0 6px;font-weight:700;color:#0f172a;">Michael, VIC — withheld lockup payment until EICC arrived</p>
  <p style="margin:0;color:#475569;font-size:14px;">Builder demanded $50K lockup payment without the electrical compliance certificate. Michael wrote it into the contract: "no EICC, no payment". Builder produced the cert within 48 hours.</p>
</div>

<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px 18px;border-radius:8px;margin:16px 0;">
  <p style="margin:0 0 6px;font-weight:700;color:#0f172a;">Emma, QLD — won her tribunal claim with a numbered defect log</p>
  <p style="margin:0;color:#475569;font-size:14px;">Kept every defect numbered and dated, every email referencing item numbers. When the builder tried to "lose" half her list, the audit trail proved otherwise. QCAT ruled in her favour.</p>
</div>

<p>The pattern across all three: documentation, in writing, in real time. That's the difference between winning and losing a builder dispute.</p>

<p>If you're keeping a defect log on paper or in your notes app, you're doing the right thing — keep it numbered and dated.</p>

<div style="margin:24px 0;padding:18px 20px;background:#f0fdfa;border-radius:8px;text-align:center;">
  <p style="margin:0 0 12px;color:#0f766e;font-weight:600;">Want a tool that handles the documentation for you?</p>
  <a href="https://vedawellapp.com/guardian/pricing" style="display:inline-block;padding:10px 24px;background:#0d6e6e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">See HomeGuardian &rarr;</a>
</div>

<p style="margin:24px 0 8px;">Talk soon,</p>
<p style="margin:0;">— The HomeGuardian team</p>
`;
    return shell(safeName, unsubUrl, "Day 7 · Case studies", "How real homeowners caught their builder out", body);
}

function buildDay14Email(safeName: string, unsubUrl: string): string {
    const body = `
<p>Two weeks since you grabbed the PDF. By now you've either had a smooth fortnight on site (lucky you) or you've spotted at least one of the red flags.</p>

<p>If it's the latter, here's the honest truth: dealing with builder disputes alone is exhausting. The paperwork, the photos, the back-and-forth emails, the certificates you're chasing, the variations you're disputing — it adds up to hours every week.</p>

<p>This is exactly why we built <strong>HomeGuardian</strong>. It's the operational backbone for protecting your build:</p>

<ul style="padding-left:20px;color:#374151;line-height:1.8;">
  <li><strong>Defect logs</strong> with timestamped photos that hold up at NCAT, VCAT, QCAT, Fair Trading</li>
  <li><strong>AI that reads your contract</strong> and flags dodgy clauses before you sign</li>
  <li><strong>One-click tribunal export</strong> — defects + variations + photos + timeline in one PDF</li>
  <li><strong>Progress claim AI</strong> that tells you whether to PAY, HOLD, or DISPUTE each invoice</li>
  <li><strong>State-specific escalation templates</strong> for all 8 Australian states</li>
</ul>

<div style="margin:28px 0;padding:24px;background:linear-gradient(135deg,#0d6e6e 0%,#075959 100%);border-radius:10px;text-align:center;color:#fff;">
  <h2 style="margin:0 0 8px;font-size:22px;">7 days free. No credit card.</h2>
  <p style="margin:0 0 16px;color:#5eead4;font-size:14px;">Full Pro access. Try every feature. If it's not for you, it costs you nothing.</p>
  <a href="https://vedawellapp.com/guardian/pricing" style="display:inline-block;padding:12px 28px;background:#fff;color:#0d6e6e;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;">Start your free trial &rarr;</a>
</div>

<p>If now's not the right time, no worries — keep the PDF on your phone, follow the action steps, and stay vigilant. We won't email you again unless you come back to us.</p>

<p style="margin:24px 0 8px;">All the best with your build,</p>
<p style="margin:0;">— The HomeGuardian team</p>

<p style="margin:24px 0 0;font-size:13px;color:#64748b;">P.S. Got questions about a specific build issue? Reply to this email — it goes straight to the team.</p>
`;
    return shell(safeName, unsubUrl, "Day 14 · Free trial", "Your free 7-day HomeGuardian trial", body);
}
