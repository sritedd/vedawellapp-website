/**
 * Signed-URL helpers for the private storage buckets.
 *
 * The `evidence`, `documents` and `certificates` buckets were public until
 * schema_v49 — anyone with a URL could read a defect photo, a signed building
 * contract or a compliance certificate without authenticating. They are private
 * now, which means `getPublicUrl()` no longer resolves and every read has to be
 * signed.
 *
 * Two shapes exist in the database and both must keep working:
 *   1. Legacy full public URLs written before v49
 *      https://<ref>.supabase.co/storage/v1/object/public/evidence/<project>/photos/x.jpg
 *   2. Bare storage paths written after v49
 *      <project>/photos/x.jpg
 *
 * `toStoragePath()` normalises either into the bucket-relative path that the
 * storage API wants, so callers never care which era a row came from.
 */

export type GuardianBucket = "evidence" | "documents" | "certificates";

/** How long a signed URL stays valid. Long enough to view/print a page. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Normalise a stored value into a bucket-relative storage path.
 * Accepts a legacy public/sign URL or an already-bare path. Returns null when
 * the value is empty or doesn't belong to the given bucket.
 */
export function toStoragePath(stored: string | null | undefined, bucket: GuardianBucket): string | null {
    if (!stored) return null;
    const value = stored.trim();
    if (!value) return null;

    // Already a bare path (no scheme).
    if (!/^https?:\/\//i.test(value)) {
        return value.replace(/^\/+/, "") || null;
    }

    // Supabase serves objects under /storage/v1/object/{public|sign}/<bucket>/<path>
    const marker = new RegExp(`/storage/v1/object/(?:public/|sign/|authenticated/)?${bucket}/`, "i");
    const match = value.split("?")[0].match(marker);
    if (!match) return null;

    const idx = value.indexOf(match[0]);
    const path = value.slice(idx + match[0].length).split("?")[0];
    try {
        return decodeURIComponent(path) || null;
    } catch {
        return path || null;
    }
}

type SignCapableClient = {
    storage: {
        from: (bucket: string) => {
            createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
            createSignedUrls?: (paths: string[], expiresIn: number) => Promise<{ data: { path: string | null; signedUrl: string }[] | null; error: unknown }>;
        };
    };
};

/**
 * Resolve one stored value into a signed URL. Returns null when it can't be
 * signed (missing value, wrong bucket, or no permission) so callers can render
 * a placeholder instead of a broken image.
 */
export async function getSignedUrl(
    supabase: SignCapableClient,
    bucket: GuardianBucket,
    stored: string | null | undefined,
    expiresIn: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
    const path = toStoragePath(stored, bucket);
    if (!path) return null;

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) {
        console.error(`[storage] Could not sign ${bucket}/${path}:`, error);
        return null;
    }
    return data.signedUrl;
}

/**
 * Batch version — one round trip for a whole gallery instead of N.
 * Returns a map keyed by the ORIGINAL stored value, so callers can look up by
 * whatever they already hold on the row.
 */
export async function getSignedUrlMap(
    supabase: SignCapableClient,
    bucket: GuardianBucket,
    storedValues: (string | null | undefined)[],
    expiresIn: number = SIGNED_URL_TTL_SECONDS
): Promise<Record<string, string>> {
    const out: Record<string, string> = {};

    // Keep every stored value that maps to a path, deduped by path.
    const pathToStored = new Map<string, string>();
    for (const stored of storedValues) {
        const path = toStoragePath(stored, bucket);
        if (path && stored && !pathToStored.has(path)) pathToStored.set(path, stored);
    }
    const paths = [...pathToStored.keys()];
    if (paths.length === 0) return out;

    const api = supabase.storage.from(bucket);

    if (typeof api.createSignedUrls === "function") {
        const { data, error } = await api.createSignedUrls(paths, expiresIn);
        if (!error && data) {
            for (const row of data) {
                if (!row.path || !row.signedUrl) continue;
                const stored = pathToStored.get(row.path);
                if (stored) out[stored] = row.signedUrl;
            }
            return out;
        }
        console.error(`[storage] Batch signing failed for ${bucket}:`, error);
    }

    // Fall back to signing individually so one bad object can't blank a gallery.
    await Promise.all(paths.map(async (path) => {
        const { data, error } = await api.createSignedUrl(path, expiresIn);
        const stored = pathToStored.get(path);
        if (!error && data?.signedUrl && stored) out[stored] = data.signedUrl;
    }));
    return out;
}
