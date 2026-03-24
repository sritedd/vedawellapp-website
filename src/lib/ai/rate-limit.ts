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

// ─── Per-User Daily AI Quotas ─────────────────────────────────────

const DAILY_QUOTAS: Record<string, { ai: number; chat: number }> = {
    free: { ai: 5, chat: 0 },
    trial: { ai: 20, chat: 10 },
    guardian_pro: { ai: 50, chat: 30 },
    admin: { ai: 9999, chat: 9999 },
};

/**
 * Check if a user has exceeded their daily AI quota.
 * Returns { allowed: true } or { allowed: false, limit, used }.
 * Requires the ai_usage_log table (schema_v36).
 */
export async function checkDailyQuota(
    supabase: { from: (table: string) => any },
    userId: string,
    tier: string,
    feature: string
): Promise<{ allowed: boolean; limit: number; used: number }> {
    const quotas = DAILY_QUOTAS[tier] || DAILY_QUOTAS.free;
    const limit = feature === "chat" ? quotas.chat : quotas.ai;

    // Admins have no real limit
    if (limit >= 9999) return { allowed: true, limit, used: 0 };

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from("ai_usage_log")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", startOfDay.toISOString());

        const used = count ?? 0;
        return { allowed: used < limit, limit, used };
    } catch {
        // If table doesn't exist or query fails, allow the request (fail-open for quotas)
        return { allowed: true, limit, used: 0 };
    }
}

/**
 * Check if a user has a Pro subscription.
 * Returns the subscription_tier string, or null if lookup fails.
 */
export async function checkProAccess(
    supabase: { from: (table: string) => any },
    userId: string
): Promise<{ allowed: boolean; tier: string }> {
    const { data } = await supabase
        .from("profiles")
        .select("subscription_tier, trial_ends_at, is_admin")
        .eq("id", userId)
        .single();

    const tier = data?.subscription_tier || "free";
    const isAdmin = data?.is_admin === true;
    const trialActive = tier === "trial" && data?.trial_ends_at && new Date(data.trial_ends_at) > new Date();
    const allowed = tier === "guardian_pro" || isAdmin || trialActive === true;
    return { allowed, tier };
}
