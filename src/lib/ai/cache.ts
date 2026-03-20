import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

/**
 * AI Response Cache.
 * Stores AI responses in Supabase to avoid redundant API calls.
 * Falls back gracefully if the ai_cache table doesn't exist yet.
 */

function getSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

function getSupabaseAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        // AI cache is non-critical — fall back to anon client (reads may fail due to RLS, that's OK)
        console.warn("[AI Cache] SUPABASE_SERVICE_ROLE_KEY not set, cache writes may fail");
        return getSupabase();
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

/** Get a cached AI response. Returns null if not found or expired. */
export async function getCached<T>(key: string): Promise<T | null> {
    try {
        const supabase = getSupabase();
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
    if (cached) return cached;

    const result = await generator();
    await setCache(key, result, ttlSeconds);
    return result;
}
