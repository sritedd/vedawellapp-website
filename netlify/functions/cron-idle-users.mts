import type { Config } from "@netlify/functions";

// Runs daily at 8am AEST (10pm UTC previous day)
export default async () => {
    const siteUrl = process.env.URL || "https://vedawellapp.com";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Cron] CRON_SECRET not configured");
        return new Response("CRON_SECRET missing", { status: 500 });
    }

    const res = await fetch(`${siteUrl}/api/cron/idle-users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.text();
    console.log(`[Cron] idle-users: ${res.status}`, body);
    return new Response(body, { status: res.status });
};

export const config: Config = {
    schedule: "0 22 * * *", // 10pm UTC = 8am AEST
};
