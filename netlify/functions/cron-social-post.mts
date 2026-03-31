import type { Config } from "@netlify/functions";

/**
 * Daily social media auto-poster.
 * Runs at 12pm AEST (2am UTC) — peak engagement time for Australian audience.
 *
 * Posts one message per configured platform, rotating through the post library.
 * Requires social platform credentials in env vars.
 */
export default async () => {
    const siteUrl = process.env.URL || "https://vedawellapp.com";

    const res = await fetch(`${siteUrl}/api/social/auto-post`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
            "Content-Type": "application/json",
        },
    });

    const body = await res.text();
    console.log(`[Cron] social-post: ${res.status}`, body);
    return new Response(body, { status: res.status });
};

export const config: Config = {
    schedule: "0 2 * * *", // 2am UTC = 12pm AEST
};
