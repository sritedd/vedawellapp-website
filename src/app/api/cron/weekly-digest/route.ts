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
 * Weekly digest email for Pro/trial users.
 *
 * Summarises each project's defects, stages, inspections,
 * communications, and payments for the past 7 days.
 *
 * Protected by CRON_SECRET. Call weekly via cron or Netlify scheduled function.
 * Requires RESEND_API_KEY env var.
 */
export async function POST(req: NextRequest) {
    // SECURITY: Secret in Authorization header, not query string
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    // Fail-closed: if CRON_SECRET is not configured, reject all requests
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
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let emailsSent = 0;
    const errors: string[] = [];

    // 1. Fetch all Pro/trial users
    const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, subscription_tier")
        .in("subscription_tier", ["guardian_pro", "trial"]);

    if (usersError) {
        console.error("[WeeklyDigest] Failed to fetch users:", usersError);
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users?.length) {
        return NextResponse.json({
            success: true,
            emails_sent: 0,
            errors: [],
            timestamp: now.toISOString(),
        });
    }

    // 2. Process each user (batch limit to avoid Netlify 26s timeout)
    const BATCH_LIMIT = 50;
    const startTime = Date.now();
    const usersToProcess = users.slice(0, BATCH_LIMIT);
    for (const user of usersToProcess) {
        if (!user.email) continue;
        // Safety: bail if approaching Netlify's 26s timeout
        if (Date.now() - startTime > 20_000) {
            errors.push(`Timeout: processed ${emailsSent} of ${usersToProcess.length} users`);
            break;
        }

        try {
            // Fetch user's projects
            const { data: projects } = await supabase
                .from("projects")
                .select("id, name, status")
                .eq("user_id", user.id);

            if (!projects?.length) continue; // no projects, skip

            const projectIds = projects.map((p: any) => p.id);

            // Fetch all related data in parallel
            const [
                { data: defects },
                { data: stages },
                { data: inspections },
                { data: commsCount },
                { data: payments },
            ] = await Promise.all([
                supabase
                    .from("defects")
                    .select("id, project_id, status, created_at, updated_at, title")
                    .in("project_id", projectIds),
                supabase
                    .from("stages")
                    .select("id, project_id, name, status")
                    .in("project_id", projectIds),
                supabase
                    .from("inspections")
                    .select("id, project_id, scheduled_date, status")
                    .in("project_id", projectIds)
                    .gte("scheduled_date", now.toISOString())
                    .lte("scheduled_date", sevenDaysFromNow),
                supabase
                    .from("communication_log")
                    .select("id, project_id")
                    .in("project_id", projectIds)
                    .gte("date", sevenDaysAgo),
                supabase
                    .from("payments")
                    .select("id, project_id, status")
                    .in("project_id", projectIds)
                    .eq("status", "overdue"),
            ]);

            // 3. Build per-project summaries
            const projectSections: string[] = [];

            for (const project of projects) {
                const pid = project.id;

                // Defects
                const projectDefects = defects?.filter((d: any) => d.project_id === pid) ?? [];
                const openDefects = projectDefects.filter((d: any) =>
                    ["open", "reported"].includes(d.status)
                );
                const resolvedThisWeek = projectDefects.filter(
                    (d: any) => d.status === "resolved" && d.updated_at >= sevenDaysAgo
                );

                // Current stage (latest non-completed, or last stage)
                const projectStages = stages?.filter((s: any) => s.project_id === pid) ?? [];
                const currentStage =
                    projectStages.find((s: any) => s.status === "in_progress") ??
                    projectStages.find((s: any) => s.status !== "completed") ??
                    projectStages[projectStages.length - 1];

                // Upcoming inspections
                const upcomingInspections =
                    inspections?.filter((i: any) => i.project_id === pid) ?? [];

                // Comms count
                const recentComms =
                    commsCount?.filter((c: any) => c.project_id === pid)?.length ?? 0;

                // Overdue payments
                const overduePayments =
                    payments?.filter((p: any) => p.project_id === pid) ?? [];

                // Action items
                const actionItems: string[] = [];
                if (overduePayments.length > 0) {
                    actionItems.push(
                        `<span style="color:#DC2626;">${overduePayments.length} overdue payment(s)</span>`
                    );
                }
                const staleDefects = openDefects.filter(
                    (d: any) => d.updated_at < sevenDaysAgo
                );
                if (staleDefects.length > 0) {
                    actionItems.push(
                        `<span style="color:#DC2626;">${staleDefects.length} stale defect(s) (no update in 7+ days)</span>`
                    );
                }

                // Build inspection rows
                const inspectionRows = upcomingInspections
                    .map((i: any) => {
                        const date = new Date(i.scheduled_date).toLocaleDateString("en-AU", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                        });
                        return `<li>${date} — ${i.status ?? "scheduled"}</li>`;
                    })
                    .join("");

                projectSections.push(`
                    <div style="background:#F8FAFA; border-radius:8px; padding:20px; margin-bottom:16px;">
                        <h3 style="margin:0 0 4px; color:#1E293B;">${escapeHtml(project.name)}</h3>
                        <p style="margin:0 0 12px; color:#64748b; font-size:13px;">
                            Stage: <strong>${currentStage ? escapeHtml(currentStage.name) : "Not set"}</strong>
                            ${project.status ? ` · ${escapeHtml(project.status)}` : ""}
                        </p>

                        <table style="width:100%; border-collapse:collapse; font-size:14px;">
                            <tr>
                                <td style="padding:6px 12px; border-bottom:1px solid #E2E8F0;">Open defects</td>
                                <td style="padding:6px 12px; border-bottom:1px solid #E2E8F0; text-align:right; font-weight:600; color:${openDefects.length > 0 ? "#DC2626" : "#16A34A"};">
                                    ${openDefects.length}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:6px 12px; border-bottom:1px solid #E2E8F0;">Resolved this week</td>
                                <td style="padding:6px 12px; border-bottom:1px solid #E2E8F0; text-align:right; font-weight:600; color:#16A34A;">
                                    ${resolvedThisWeek.length}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:6px 12px; border-bottom:1px solid #E2E8F0;">Communications (7d)</td>
                                <td style="padding:6px 12px; border-bottom:1px solid #E2E8F0; text-align:right;">${recentComms}</td>
                            </tr>
                        </table>

                        ${upcomingInspections.length > 0
                        ? `<div style="margin-top:12px;">
                                <strong style="font-size:13px; color:#0D6E6E;">Upcoming Inspections</strong>
                                <ul style="margin:4px 0 0; padding-left:20px; font-size:13px;">${inspectionRows}</ul>
                            </div>`
                        : ""
                    }

                        ${actionItems.length > 0
                        ? `<div style="margin-top:12px; padding:10px; background:#FEF2F2; border-radius:6px; font-size:13px;">
                                <strong>Action needed:</strong>
                                <ul style="margin:4px 0 0; padding-left:20px;">${actionItems.map(a => `<li>${a}</li>`).join("")}</ul>
                            </div>`
                        : ""
                    }
                    </div>
                `);
            }

            // 4. Compose full email
            const html = buildEmailHtml(projectSections, now);

            await resend.emails.send({
                from: "VedaWell Guardian <notifications@vedawellapp.com>",
                to: user.email,
                subject: `Your Weekly Guardian Digest — ${now.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}`,
                html,
            });

            emailsSent++;
        } catch (err: any) {
            console.error(`[WeeklyDigest] Failed for user ${user.id}:`, err);
            errors.push(`${user.id}: ${err.message}`);
        }
    }

    return NextResponse.json({
        success: true,
        emails_sent: emailsSent,
        errors,
        timestamp: now.toISOString(),
    });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildEmailHtml(projectSections: string[], now: Date): string {
    const weekOf = now.toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:600px; margin:0 auto; padding:24px 16px;">

    <!-- Header -->
    <div style="background:#0D6E6E; border-radius:12px 12px 0 0; padding:28px 24px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:-0.3px;">
            🏠 HomeOwner Guardian
        </h1>
        <p style="margin:6px 0 0; color:#A7F3D0; font-size:14px;">Weekly Digest — ${weekOf}</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff; padding:24px; border-radius:0 0 12px 12px;">
        <p style="color:#334155; font-size:15px; margin-top:0;">
            Here's what happened across your projects this week:
        </p>

        ${projectSections.join("")}

        <!-- CTA -->
        <div style="text-align:center; margin:28px 0 8px;">
            <a href="https://vedawellapp.com/guardian/dashboard"
               style="display:inline-block; padding:14px 32px; background:#0D6E6E; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
                View Dashboard
            </a>
        </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:20px 0; color:#94A3B8; font-size:12px; line-height:1.5;">
        <p style="margin:0;">
            VedaWell HomeOwner Guardian · <a href="mailto:support@vedawellapp.com" style="color:#94A3B8;">support@vedawellapp.com</a>
        </p>
        <p style="margin:4px 0 0;">
            Don't want weekly digests?
            <a href="https://vedawellapp.com/guardian/settings" style="color:#0D6E6E;">Update notification preferences</a>
        </p>
    </div>

</div>
</body>
</html>`;
}
