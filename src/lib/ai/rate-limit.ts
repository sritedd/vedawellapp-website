/**
 * Simple in-memory rate limiter for AI routes.
 * Best-effort protection in serverless — prevents rapid-fire abuse within a single instance.
 */

const rateLimitMap = new Map<string, number>();

/** Returns true if the user should be rate-limited. */
export function checkRateLimit(userId: string, windowMs: number = 5000): boolean {
    const last = rateLimitMap.get(userId);
    const now = Date.now();
    if (last && now - last < windowMs) return true;
    rateLimitMap.set(userId, now);
    return false;
}

// Cleanup stale entries every 10 minutes
if (typeof setInterval !== "undefined") {
    const interval = setInterval(() => {
        const cutoff = Date.now() - 60_000;
        for (const [key, ts] of rateLimitMap) {
            if (ts < cutoff) rateLimitMap.delete(key);
        }
    }, 600_000);
    interval.unref?.();
}

export const VALID_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
export type AustralianState = (typeof VALID_STATES)[number];
