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

/**
 * Progress-claim reminder cron (guide/19 §2.5).
 *
 * The whole product is used at the moments that cost money, and the one number
 * the beta turns on is whether owners come back at claim time. This is the
 * nudge that gets them there: seven days and two days before a claim's
 * due_date, email the owner what they should have in hand before paying it.
 *
 * The checks are the SAME rules as ShouldIPay — required certificates not yet
 * uploaded, failed inspections, open critical/major defects — so the email and
 * the app can never disagree. No AI: this must work when the model is busy.
 *
 * IDEMPOTENCY, deliberately without a schema change: a claim is matched only on
 * the days it is EXACTLY 7 or EXACTLY 2 days out, so each claim can produce at
 * most two emails over its life. That holds as long as the cron runs once a day
 * (Netlify scheduled functions do). Two runs in one day would double-send; if
 * that ever matters, add payments.last_reminded_at rather than widening the
 * window.
 *
 * POST /api/cron/claim-due     Authorization: Bearer $CRON_SECRET
 * Add `?dryRun=1` to report who would be emailed without sending.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vedawellapp.com";

interface PaymentRow {
    id: string;
    project_id: string;
    stage_name: string;
    percentage: number;
    amount: number;
    due_date: string;
    certificates_required: string[] | null;
}

function isoDay(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function money(n: number): string {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n || 0);
}

function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
    // SECURITY: fail-closed — reject if CRON_SECRET is not configured.
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret?.trim() || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey && !dryRun) {
        return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const supabase = getServiceSupabase();
    const now = new Date();
    const targets = new Map<string, number>();
    for (const days of [7, 2]) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() + days);
        targets.set(isoDay(d), days);
    }

    const { data: payments, error: payErr } = await supabase
        .from("payments")
        .select("id, project_id, stage_name, percentage, amount, due_date, certificates_required")
        .neq("status", "paid")
        .in("due_date", [...targets.keys()]);

    if (payErr) {
        console.error("[ClaimDue] payments fetch failed:", payErr.message);
        return NextResponse.json({ error: payErr.message }, { status: 500 });
    }

    if (!payments?.length) {
        return NextResponse.json({ success: true, dryRun, reminders_sent: 0, claims: [], timestamp: now.toISOString() });
    }

    const projectIds = [...new Set((payments as PaymentRow[]).map((p) => p.project_id))];

    const { data: projects, error: projErr } = await supabase
        .from("projects")
        .select("id, name, user_id, state")
        .in("id", projectIds);
    if (projErr) {
        console.error("[ClaimDue] projects fetch failed:", projErr.message);
        return NextResponse.json({ error: projErr.message }, { status: 500 });
    }
    const projectMap = new Map((projects || []).map((p) => [p.id, p]));

    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", [...new Set((projects || []).map((p) => p.user_id))]);
    const emailMap = new Map((profiles || []).map((p) => [p.id, p.email]));

    // Blocker inputs, fetched once for all projects in play.
    const [{ data: certs }, { data: inspections }, { data: defects }] = await Promise.all([
        supabase.from("certifications").select("project_id, type, status").in("project_id", projectIds),
        supabase.from("inspections").select("project_id, stage, result").in("project_id", projectIds).eq("result", "failed"),
        supabase.from("defects").select("project_id, title, severity, status").in("project_id", projectIds)
            .in("severity", ["critical", "major"]).not("status", "in", "(verified,rectified)"),
    ]);

    const resend = resendKey ? new Resend(resendKey) : null;
    const report: Array<{ project: string; stage: string; dueInDays: number; outstanding: string[]; emailed: boolean }> = [];
    let sent = 0;
    const errors: string[] = [];

    for (const p of payments as PaymentRow[]) {
        const project = projectMap.get(p.project_id);
        if (!project) continue;
        const ownerEmail = emailMap.get(project.user_id);
        const dueInDays = targets.get(p.due_date) ?? 0;

        // Same three checks as ShouldIPay, in the same order.
        const outstanding: string[] = [];
        for (const req of p.certificates_required || []) {
            const norm = req.toLowerCase().replace(/[^a-z]/g, "_");
            const held = (certs || []).some(
                (c) => c.project_id === p.project_id
                    && c.type.toLowerCase().replace(/[^a-z]/g, "_") === norm
                    && (c.status === "uploaded" || c.status === "verified")
            );
            if (!held) outstanding.push(`Certificate not yet uploaded: ${req}`);
        }
        for (const i of (inspections || []).filter((r) => r.project_id === p.project_id)) {
            outstanding.push(`Failed inspection: ${i.stage}`);
        }
        for (const d of (defects || []).filter((r) => r.project_id === p.project_id)) {
            outstanding.push(`Open ${d.severity} defect: ${d.title}`);
        }

        report.push({ project: project.name, stage: p.stage_name, dueInDays, outstanding, emailed: false });

        if (dryRun || !ownerEmail || !resend) continue;

        try {
            await resend.emails.send({
                from: "VedaWell Guardian <notifications@vedawellapp.com>",
                to: ownerEmail,
                subject: outstanding.length
                    ? `${p.stage_name} claim due in ${dueInDays} days — ${outstanding.length} thing${outstanding.length === 1 ? "" : "s"} to check`
                    : `${p.stage_name} claim due in ${dueInDays} days — you're covered`,
                html: buildClaimHtml({
                    projectName: project.name,
                    projectId: project.id,
                    stage: p.stage_name,
                    amount: p.amount,
                    percentage: p.percentage,
                    dueInDays,
                    dueDate: p.due_date,
                    outstanding,
                }),
            });
            sent++;
            report[report.length - 1].emailed = true;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[ClaimDue] send failed for ${project.name}:`, msg);
            errors.push(`${project.name}: ${msg}`);
        }
    }

    console.log(`[ClaimDue] ${dryRun ? "DRY RUN — " : ""}${report.length} claim(s) due, ${sent} email(s) sent`);
    return NextResponse.json({ success: true, dryRun, reminders_sent: sent, claims: report, errors, timestamp: now.toISOString() });
}

function buildClaimHtml(o: {
    projectName: string; projectId: string; stage: string; amount: number;
    percentage: number; dueInDays: number; dueDate: string; outstanding: string[];
}): string {
    const list = o.outstanding.length
        ? `<ul style="margin:0 0 16px;padding-left:20px;color:#7c2d12">${o.outstanding.map((x) => `<li style="margin-bottom:6px">${esc(x)}</li>`).join("")}</ul>`
        : `<p style="margin:0 0 16px;color:#166534">Everything this claim requires is already in your records. Worth a last look before you pay.</p>`;

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a">Progress claim coming up</p>
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25">${esc(o.stage)} — ${money(o.amount)} (${o.percentage}%)</h1>
    <p style="margin:0 0 20px;color:#52525b">Due in ${o.dueInDays} days (${esc(o.dueDate)}) on ${esc(o.projectName)}.</p>
    <h2 style="margin:0 0 8px;font-size:15px">Before you pay it, you should have:</h2>
    ${list}
    <a href="${SITE}/guardian/projects/${o.projectId}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600">Open the claim in Guardian</a>
    <p style="margin:20px 0 0;font-size:12px;color:#71717a">
      General information for Australian homeowners, not legal advice. Your contract sets the payment stages and what each one requires.
    </p>
  </div>
</body></html>`;
}
