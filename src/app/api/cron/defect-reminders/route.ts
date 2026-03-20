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
 * Defect SLA reminder cron.
 *
 * Finds all open defects that have exceeded their SLA days and haven't been
 * escalated recently (last_escalation_at is NULL or > 7 days ago).
 * Sends a reminder email to the project owner and updates escalation tracking.
 *
 * Protected by CRON_SECRET. Call daily via cron or Netlify scheduled function.
 * Requires RESEND_API_KEY env var.
 */
export async function POST(req: NextRequest) {
    // SECURITY: fail-closed — reject if CRON_SECRET is not configured
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const supabase = getServiceSupabase();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let remindersSent = 0;
    const errors: string[] = [];

    // 1. Fetch all open defects (not verified/rectified)
    const { data: defects, error: defectsError } = await supabase
        .from("defects")
        .select("id, project_id, title, severity, status, reported_at, created_at, sla_days, escalation_level, last_escalation_at")
        .not("status", "in", '("verified","rectified")');

    if (defectsError) {
        console.error("[DefectReminders] Failed to fetch defects:", defectsError);
        return NextResponse.json({ error: defectsError.message }, { status: 500 });
    }

    if (!defects?.length) {
        return NextResponse.json({
            success: true,
            reminders_sent: 0,
            errors: [],
            timestamp: now.toISOString(),
        });
    }

    // 2. Filter to overdue defects that haven't been escalated recently
    const overdueDefects = defects.filter((d: any) => {
        const reportedAt = d.reported_at || d.created_at;
        if (!reportedAt) return false;

        const slaDays = d.sla_days ?? 14;
        const reported = new Date(reportedAt);
        const daysOpen = Math.floor((now.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOpen <= slaDays) return false;

        // Skip if escalated within the last 7 days
        if (d.last_escalation_at && d.last_escalation_at > sevenDaysAgo) return false;

        return true;
    });

    if (!overdueDefects.length) {
        return NextResponse.json({
            success: true,
            reminders_sent: 0,
            errors: [],
            timestamp: now.toISOString(),
        });
    }

    // 3. Group by project_id so we can fetch owners
    const projectIds = [...new Set(overdueDefects.map((d: any) => d.project_id))];

    const { data: projects } = await supabase
        .from("projects")
        .select("id, name, user_id")
        .in("id", projectIds);

    if (!projects?.length) {
        return NextResponse.json({
            success: true,
            reminders_sent: 0,
            errors: [],
            timestamp: now.toISOString(),
        });
    }

    // 4. Fetch owner emails
    const userIds = [...new Set(projects.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

    const emailMap = new Map((profiles || []).map((p: any) => [p.id, p.email]));
    const projectMap = new Map((projects || []).map((p: any) => [p.id, p]));

    // 5. Send reminder for each overdue defect
    for (const defect of overdueDefects) {
        const project = projectMap.get(defect.project_id);
        if (!project) continue;

        const ownerEmail = emailMap.get(project.user_id);
        if (!ownerEmail) continue;

        const reportedAt = defect.reported_at || defect.created_at;
        const daysOpen = Math.floor((now.getTime() - new Date(reportedAt).getTime()) / (1000 * 60 * 60 * 24));

        try {
            await resend.emails.send({
                from: "VedaWell Guardian <notifications@vedawellapp.com>",
                to: ownerEmail,
                subject: `Overdue Defect: ${defect.title} (${daysOpen} days)`,
                html: buildReminderHtml({
                    defectTitle: defect.title,
                    severity: defect.severity || "minor",
                    daysOpen,
                    projectName: project.name,
                    slaDays: defect.sla_days ?? 14,
                }),
            });

            // Update escalation tracking
            await supabase
                .from("defects")
                .update({
                    escalation_level: "reminder_sent",
                    last_escalation_at: now.toISOString(),
                })
                .eq("id", defect.id);

            remindersSent++;
        } catch (err: any) {
            console.error(`[DefectReminders] Failed for defect ${defect.id}:`, err);
            errors.push(`${defect.id}: ${err.message}`);
        }
    }

    console.log(`[DefectReminders] Sent ${remindersSent} reminders, ${errors.length} errors`);

    return NextResponse.json({
        success: true,
        reminders_sent: remindersSent,
        errors,
        timestamp: now.toISOString(),
    });
}

/* ------------------------------------------------------------------ */
/*  Email template                                                     */
/* ------------------------------------------------------------------ */

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildReminderHtml(opts: {
    defectTitle: string;
    severity: string;
    daysOpen: number;
    projectName: string;
    slaDays: number;
}): string {
    const severityColor =
        opts.severity === "critical" ? "#DC2626" :
        opts.severity === "major" ? "#EA580C" :
        opts.severity === "minor" ? "#CA8A04" : "#2563EB";

    const overdueDays = opts.daysOpen - opts.slaDays;

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:600px; margin:0 auto; padding:24px 16px;">

    <!-- Header -->
    <div style="background:#DC2626; border-radius:12px 12px 0 0; padding:24px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:20px;">
            Overdue Defect Reminder
        </h1>
        <p style="margin:6px 0 0; color:#FCA5A5; font-size:14px;">
            ${overdueDays} day${overdueDays !== 1 ? "s" : ""} past SLA
        </p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff; padding:24px; border-radius:0 0 12px 12px;">
        <p style="color:#334155; font-size:15px; margin-top:0;">
            The following defect on <strong>${escapeHtml(opts.projectName)}</strong> has been open for
            <strong>${opts.daysOpen} days</strong>, exceeding the ${opts.slaDays}-day SLA:
        </p>

        <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:16px; margin:16px 0;">
            <h3 style="margin:0 0 8px; color:#1E293B; font-size:16px;">
                ${escapeHtml(opts.defectTitle)}
            </h3>
            <table style="font-size:14px; color:#475569;">
                <tr>
                    <td style="padding:2px 12px 2px 0; font-weight:600;">Severity:</td>
                    <td style="color:${severityColor}; font-weight:600; text-transform:uppercase;">${escapeHtml(opts.severity)}</td>
                </tr>
                <tr>
                    <td style="padding:2px 12px 2px 0; font-weight:600;">Days Open:</td>
                    <td>${opts.daysOpen}</td>
                </tr>
                <tr>
                    <td style="padding:2px 12px 2px 0; font-weight:600;">SLA:</td>
                    <td>${opts.slaDays} days</td>
                </tr>
            </table>
        </div>

        <p style="color:#475569; font-size:14px;">
            Consider following up with your builder. If the defect remains unresolved,
            you may escalate to your state's Fair Trading or Building authority.
        </p>

        <!-- CTA -->
        <div style="text-align:center; margin:24px 0 8px;">
            <a href="https://vedawellapp.com/guardian/dashboard"
               style="display:inline-block; padding:14px 32px; background:#0D6E6E; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
                View Defect Details
            </a>
        </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:20px 0; color:#94A3B8; font-size:12px; line-height:1.5;">
        <p style="margin:0;">
            VedaWell HomeOwner Guardian &middot; <a href="mailto:support@vedawellapp.com" style="color:#94A3B8;">support@vedawellapp.com</a>
        </p>
        <p style="margin:4px 0 0;">
            <a href="https://vedawellapp.com/guardian/settings" style="color:#0D6E6E;">Manage notifications</a>
        </p>
    </div>

</div>
</body>
</html>`;
}
