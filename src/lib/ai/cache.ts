import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * AI Response Cache.
 * Stores AI responses in Supabase to avoid redundant API calls.
 * Falls back gracefully if the ai_cache table doesn't exist yet.
 */

function getSupabaseAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        // Fail-closed: cache writes require service-role key
        return null;
    }
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

/** Generate a deterministic cache key from feature name + params + optional user scope */
export function makeCacheKey(feature: string, params: Record<string, unknown>, userId?: string): string {
    const sorted = JSON.stringify(params, Object.keys(params).sort());
    const scope = userId ? `${userId}:` : "";
    return crypto.createHash("sha256").update(`${scope}${feature}:${sorted}`).digest("hex");
}

/** Get a cached AI response. Returns null if not found or expired.
 *  Uses service-role client — ai_cache is server-side infra, not user-facing. */
export async function getCached<T>(key: string): Promise<T | null> {
    try {
        const supabase = getSupabaseAdmin();
        if (!supabase) return null; // Service key not configured — skip cache

        const { data } = await supabase
            .from("ai_cache")
            .select("response, expires_at")
            .eq("cache_key", key)
            .single();

        if (!data) return null;
        if (new Date(data.expires_at) < new Date()) return null;

        return data.response as T;
    } catch {
        // Table might not exist yet — graceful fallback
        return null;
    }
}

/** Store an AI response in the cache. */
export async function setCache(key: string, response: unknown, ttlSeconds: number = 86400, model: string = "gemini-2.5-flash-lite"): Promise<void> {
    try {
        const supabase = getSupabaseAdmin();
        if (!supabase) return; // Service key not configured — skip caching silently

        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

        await supabase
            .from("ai_cache")
            .upsert({
                cache_key: key,
                response,
                expires_at: expiresAt,
                model,
            }, { onConflict: "cache_key" });
    } catch {
        // Non-critical — just skip caching
    }
}

/** Get cached or generate. If cache miss, calls generator and caches result. */
export async function cachedAI<T>(
    feature: string,
    params: Record<string, unknown>,
    generator: () => Promise<T>,
    ttlSeconds: number = 86400,
    userId?: string
): Promise<T> {
    const key = makeCacheKey(feature, params, userId);

    const cached = await getCached<T>(key);
    if (cached) {
        // Log cache hit (fire-and-forget)
        logAIUsage({ userId, feature, model: "cached", cacheHit: true, success: true }).catch(() => {});
        return cached;
    }

    const start = Date.now();
    const result = await generator();
    const latencyMs = Date.now() - start;

    await setCache(key, result, ttlSeconds);

    // Log cache miss (fire-and-forget)
    logAIUsage({ userId, feature, model: "gemini-2.5-flash-lite", cacheHit: false, latencyMs, success: true }).catch(() => {});

    return result;
}

/** Retrieve relevant knowledge base entries to ground AI prompts in real data. */
export async function retrieveKnowledge(opts: {
    state?: string;
    stage?: string;
    category?: string;
    limit?: number;
}): Promise<string[]> {
    try {
        const supabase = getSupabaseAdmin();
        if (!supabase) return [];

        let query = supabase
            .from("knowledge_base")
            .select("content")
            .limit(opts.limit ?? 5);

        // Filter by state (include entries with null state = general/national)
        if (opts.state) {
            query = query.or(`state.eq.${opts.state},state.is.null`);
        }

        // Filter by stage if provided
        if (opts.stage) {
            query = query.or(`stage.ilike.%${opts.stage}%,stage.is.null`);
        }

        // Filter by category if provided
        if (opts.category) {
            query = query.or(`category.eq.${opts.category},category.eq.general`);
        }

        const { data } = await query;
        return (data || []).map((row: { content: string }) => row.content);
    } catch {
        return [];
    }
}

/** Log an AI request to ai_usage_log for cost monitoring and quotas. */
export async function logAIUsage(opts: {
    userId?: string;
    feature: string;
    model: string;
    cacheHit?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    success?: boolean;
    errorCode?: string;
}): Promise<void> {
    try {
        const supabase = getSupabaseAdmin();
        if (!supabase) return;

        await supabase.from("ai_usage_log").insert({
            user_id: opts.userId || null,
            feature: opts.feature,
            model: opts.model,
            cache_hit: opts.cacheHit ?? false,
            input_tokens: opts.inputTokens ?? null,
            output_tokens: opts.outputTokens ?? null,
            latency_ms: opts.latencyMs ?? null,
            success: opts.success ?? true,
            error_code: opts.errorCode ?? null,
        });
    } catch {
        // Non-critical — don't break AI features if telemetry fails
    }
}
