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
 * Automated notification endpoint.
 * Sends email reminders for:
 * 1. Subscriptions expiring within 3 days
 * 2. Open defects older than 7 days without update
 * 3. Trial ending within 2 days
 *
 * Protected by CRON_SECRET. Call daily via cron or Netlify scheduled function.
 * Requires RESEND_API_KEY env var.
 */
export async function GET(req: NextRequest) {
    // SECURITY: Secret in Authorization header, not query string
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const supabase = getServiceSupabase();
    const now = new Date();
    const results = { trial_warnings: 0, defect_reminders: 0, errors: [] as string[] };

    // 1. Trial expiring within 2 days
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiringTrials } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("subscription_tier", "trial")
        .gt("trial_ends_at", now.toISOString())
        .lt("trial_ends_at", twoDaysFromNow);

    if (expiringTrials?.length) {
        for (const user of expiringTrials) {
            if (!user.email) continue;
            try {
                await resend.emails.send({
                    from: "VedaWell Guardian <notifications@vedawellapp.com>",
                    to: user.email,
                    subject: "Your Guardian trial ends soon",
                    html: `
                        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
                            <h2 style="color: #0D6E6E;">Your Guardian Trial Is Ending</h2>
                            <p>Your free trial of HomeOwner Guardian Pro is expiring in less than 2 days.</p>
                            <p>Upgrade now to keep unlimited projects, defect tracking, and PDF exports:</p>
                            <a href="https://vedawellapp.com/guardian/pricing"
                               style="display: inline-block; padding: 12px 24px; background: #0D6E6E; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Upgrade to Pro — $14.99/mo
                            </a>
                            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                                You're receiving this because you signed up for a Guardian trial.
                                <br/>VedaWell · support@vedawellapp.com
                            </p>
                        </div>
                    `,
                });
                results.trial_warnings++;
            } catch (err: any) {
                results.errors.push(`trial-email-${user.id}: ${err.message}`);
            }
        }
    }

    // 2. Open defects older than 7 days without update
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleDefects } = await supabase
        .from("defects")
        .select("id, title, project_id, projects(user_id, name)")
        .in("status", ["open", "reported"])
        .lt("updated_at", sevenDaysAgo);

    if (staleDefects?.length) {
        // Group by user
        const byUser = new Map<string, { projectName: string; defects: string[] }>();
        for (const d of staleDefects) {
            const project = d.projects as any;
            if (!project?.user_id) continue;
            const key = project.user_id;
            if (!byUser.has(key)) byUser.set(key, { projectName: project.name, defects: [] });
            byUser.get(key)!.defects.push(d.title || `Defect #${d.id.slice(0, 8)}`);
        }

        for (const [userId, info] of byUser) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .single();
            if (!profile?.email) continue;

            try {
                const defectList = info.defects.map(d => `<li>${d}</li>`).join("");
                await resend.emails.send({
                    from: "VedaWell Guardian <notifications@vedawellapp.com>",
                    to: profile.email,
                    subject: `${info.defects.length} defect(s) need attention — ${info.projectName}`,
                    html: `
                        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
                            <h2 style="color: #DC2626;">Defects Need Your Attention</h2>
                            <p>The following defects in <strong>${info.projectName}</strong> haven't been updated in over 7 days:</p>
                            <ul>${defectList}</ul>
                            <p>Follow up with your builder to ensure these are being addressed.</p>
                            <a href="https://vedawellapp.com/guardian/dashboard"
                               style="display: inline-block; padding: 12px 24px; background: #0D6E6E; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                View Dashboard
                            </a>
                            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                                VedaWell HomeOwner Guardian · support@vedawellapp.com
                            </p>
                        </div>
                    `,
                });
                results.defect_reminders++;
            } catch (err: any) {
                results.errors.push(`defect-email-${userId}: ${err.message}`);
            }
        }
    }

    return NextResponse.json({
        success: true,
        ...results,
        timestamp: now.toISOString(),
    });
}
