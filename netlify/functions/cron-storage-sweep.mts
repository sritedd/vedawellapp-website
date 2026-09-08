import type { Config } from "@netlify/functions";

// Weekly, Sunday 2am AEST (4pm UTC Saturday).
//
// The sweep route existed for weeks without this file, so nothing ever invoked
// it and orphaned objects accumulated regardless. Adding an API route is not the
// same as shipping a cron — the schedule is the feature.
//
// Weekly rather than daily: orphans are hygiene, not exposure (the buckets are
// private as of schema_v49), and the route deletes real files, so a lower
// frequency limits the blast radius of a bug in its liveness check.
export default async () => {
    const siteUrl = process.env.URL || "https://vedawellapp.com";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Cron] CRON_SECRET not configured");
        return new Response("CRON_SECRET missing", { status: 500 });
    }

    const res = await fetch(`${siteUrl}/api/cron/storage-sweep`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.text();
    console.log(`[Cron] storage-sweep: ${res.status}`, body);
    return new Response(body, { status: res.status });
};

export const config: Config = {
    schedule: "0 16 * * 6", // 4pm UTC Saturday = 2am AEST Sunday
};
