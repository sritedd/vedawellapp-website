import type { Config } from "@netlify/functions";

// Runs every Monday at 8am AEST (Sunday 10pm UTC)
export default async () => {
    const siteUrl = process.env.URL || "https://vedawellapp.com";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Cron] CRON_SECRET not configured");
        return new Response("CRON_SECRET missing", { status: 500 });
    }

    const res = await fetch(`${siteUrl}/api/cron/weekly-digest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.text();
    console.log(`[Cron] weekly-digest: ${res.status}`, body);
    return new Response(body, { status: res.status });
};

export const config: Config = {
    schedule: "0 22 * * 0", // Sunday 10pm UTC = Monday 8am AEST
};
