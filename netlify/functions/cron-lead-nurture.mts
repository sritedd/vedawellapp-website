import type { Config } from "@netlify/functions";

// Daily at 9am AEST (Australian primary market). 23:00 UTC = 9am AEST (UTC+10),
// 10am AEDT (UTC+11). Picking 9am-ish so emails land mid-morning, not 6am.
export default async () => {
    const siteUrl = process.env.URL || "https://vedawellapp.com";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Cron] CRON_SECRET not configured");
        return new Response("CRON_SECRET missing", { status: 500 });
    }

    const res = await fetch(`${siteUrl}/api/cron/lead-nurture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.text();
    console.log(`[Cron] lead-nurture: ${res.status}`, body);
    return new Response(body, { status: res.status });
};

export const config: Config = {
    schedule: "0 23 * * *", // Daily 23:00 UTC = ~9am AEST
};
