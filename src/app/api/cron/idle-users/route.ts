import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
    );
}

/**
 * POST /api/cron/idle-users
 *
 * Finds users who haven't visited in 7+ days and sends a re-engagement email.
 * Won't email the same user more than once per 14 days.
 *
 * Protected by CRON_SECRET. Run daily via cron.
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret?.trim() || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const supabase = getServiceSupabase();
    const now = new Date();

    // Users idle for 7+ days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // Don't re-email within 14 days
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Find idle users: last seen 7+ days ago, not emailed in 14 days
    const { data: idleUsers, error: fetchError } = await supabase
        .from("profiles")
        .select("id, email, full_name, last_seen_at, last_page_view_at, subscription_tier, last_engagement_email_at")
        .lt("last_seen_at", sevenDaysAgo)
        .or(`last_engagement_email_at.is.null,last_engagement_email_at.lt.${fourteenDaysAgo}`)
        .not("email", "is", null)
        .limit(50); // Batch limit for Netlify timeout

    if (fetchError) {
        console.error("[IdleUsers] Failed to fetch:", fetchError);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!idleUsers?.length) {
        return NextResponse.json({ success: true, emails_sent: 0, message: "No idle users found" });
    }

    let emailsSent = 0;
    const errors: string[] = [];
    const startTime = Date.now();

    for (const user of idleUsers) {
        // Timeout safety — bail at 20s
        if (Date.now() - startTime > 20_000) break;

        if (!user.email) continue;

        const firstName = user.full_name?.split(" ")[0] || "there";
        const daysSinceSeen = Math.floor((now.getTime() - new Date(user.last_seen_at).getTime()) / 86400000);

        const tierLabel = user.subscription_tier === "guardian_pro" ? "Pro"
            : user.subscription_tier === "trial" ? "Trial"
            : "Free";

        try {
            await resend.emails.send({
                from: "HomeOwner Guardian <notifications@vedawellapp.com>",
                to: user.email,
                subject: `We miss you, ${firstName}! Your build project needs attention`,
                html: buildReEngagementEmail(firstName, daysSinceSeen, tierLabel),
            });

            // Mark as emailed
            await supabase
                .from("profiles")
                .update({ last_engagement_email_at: now.toISOString() })
                .eq("id", user.id);

            emailsSent++;
        } catch (e) {
            errors.push(`${user.email}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    return NextResponse.json({
        success: true,
        emails_sent: emailsSent,
        idle_users_found: idleUsers.length,
        errors,
        timestamp: now.toISOString(),
    });
}

function buildReEngagementEmail(firstName: string, daysSinceSeen: number, tier: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">

<div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">

<!-- Header -->
<div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:24px;color:#111;margin:0;">🏠 HomeOwner Guardian</h1>
    <p style="color:#6b7280;margin:8px 0 0;">by VedaWell</p>
</div>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

<!-- Body -->
<p style="font-size:16px;color:#374151;line-height:1.6;">
    Hi ${firstName},
</p>

<p style="font-size:16px;color:#374151;line-height:1.6;">
    It's been <strong>${daysSinceSeen} days</strong> since you last checked in on your build project.
    Construction doesn't stop while you're away — here's what you might be missing:
</p>

<div style="background:#fef3c7;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #f59e0b;">
    <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">⚠️ Things to check:</p>
    <ul style="margin:8px 0 0;padding-left:20px;color:#92400e;font-size:14px;line-height:1.8;">
        <li>Any new defects or quality issues on site?</li>
        <li>Are your progress payments up to date?</li>
        <li>Have any inspections been scheduled?</li>
        <li>Is your builder on track with the timeline?</li>
    </ul>
</div>

<p style="font-size:16px;color:#374151;line-height:1.6;">
    Staying on top of your build is the best way to protect your investment.
    Jump back in and make sure everything is on track:
</p>

<!-- CTA Button -->
<div style="text-align:center;margin:28px 0;">
    <a href="https://vedawellapp.com/guardian/dashboard"
       style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        Check My Project →
    </a>
</div>

${tier === "Free" ? `
<div style="background:#eff6ff;border-radius:8px;padding:16px;margin:20px 0;">
    <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">💎 Upgrade to Pro — $14.99/mo</p>
    <p style="margin:8px 0 0;font-size:14px;color:#1e40af;">
        Unlimited projects, AI-powered advice, PDF exports, and priority support.
        <a href="https://vedawellapp.com/guardian/pricing" style="color:#2563eb;font-weight:600;">View plans →</a>
    </p>
</div>
` : ""}

<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

<p style="font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
    You're receiving this because you have a HomeOwner Guardian account (${tier} plan).<br>
    <a href="https://vedawellapp.com/guardian/settings" style="color:#9ca3af;">Manage email preferences</a>
</p>

</div>
</div>
</body>
</html>`;
}
