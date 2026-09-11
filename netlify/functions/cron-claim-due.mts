import type { Config } from "@netlify/functions";

// Daily at 8am AEST (10pm UTC previous day) — morning, when someone can act on
// it, rather than the small hours with the maintenance crons.
//
// The route matches claims that are EXACTLY 7 or EXACTLY 2 days out, so this
// schedule is part of the idempotency: once a day means at most two emails per
// claim. Do not move it to a sub-daily schedule without adding a
// payments.last_reminded_at column first (see the route's header).
export default async () => {
    const siteUrl = process.env.URL || "https://vedawellapp.com";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Cron] CRON_SECRET not configured");
        return new Response("CRON_SECRET missing", { status: 500 });
    }

    const res = await fetch(`${siteUrl}/api/cron/claim-due`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.text();
    console.log(`[Cron] claim-due: ${res.status}`, body);
    return new Response(body, { status: res.status });
};

export const config: Config = {
    schedule: "0 22 * * *", // 10pm UTC = 8am AEST
};
