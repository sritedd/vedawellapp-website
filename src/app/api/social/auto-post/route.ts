import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
    );
}

const SITE = "https://vedawellapp.com";

interface SocialPost {
    id: string;
    label: string;
    blog: string;
    platforms: Record<string, string>;
}

// Inline post data — Netlify serverless can't read filesystem at runtime
// To update: copy from scripts/social-posts.json
import POSTS_DATA from "@/data/social-posts.json";

function loadPosts(): SocialPost[] {
    return POSTS_DATA as SocialPost[];
}

function buildLink(post: SocialPost, platform: string): string {
    const base = post.blog.startsWith("http") ? post.blog : `${SITE}${post.blog}`;
    return `${base}?utm_source=${platform}&utm_medium=social&utm_campaign=${post.id}`;
}

function renderPost(post: SocialPost, platform: string): string | null {
    const text = post.platforms[platform];
    if (!text) return null;
    const link = buildLink(post, platform);
    return text.replace(/\{\{link\}\}/g, link);
}

// ── Platform Posters ──────────────────────────────────────────────

async function postToBluesky(text: string, link: string): Promise<{ id: string } | null> {
    const handle = process.env.BLUESKY_HANDLE;
    const password = process.env.BLUESKY_APP_PASSWORD;
    if (!handle || !password) return null;

    // For custom domain handles, resolve DID first
    let identifier = handle;
    if (!handle.endsWith(".bsky.social")) {
        const resolveRes = await fetch(
            `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
        );
        if (resolveRes.ok) {
            const { did } = await resolveRes.json();
            identifier = did; // Use DID for auth instead of custom domain
        }
    }

    const authRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
    });
    if (!authRes.ok) {
        const errBody = await authRes.text();
        throw new Error(`Bluesky auth: ${authRes.status} — ${errBody}`);
    }
    const session = await authRes.json();

    const facets: any[] = [];
    const linkIndex = text.indexOf(link);
    if (linkIndex !== -1) {
        const encoder = new TextEncoder();
        const byteStart = encoder.encode(text.slice(0, linkIndex)).length;
        const byteEnd = byteStart + encoder.encode(link).length;
        facets.push({
            index: { byteStart, byteEnd },
            features: [{ $type: "app.bsky.richtext.facet#link", uri: link }],
        });
    }

    const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
        body: JSON.stringify({
            repo: session.did,
            collection: "app.bsky.feed.post",
            record: { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString(), ...(facets.length ? { facets } : {}) },
        }),
    });
    if (!res.ok) throw new Error(`Bluesky post: ${res.status}`);
    const result = await res.json();
    return { id: result.uri };
}

async function postToFacebook(text: string, link: string): Promise<{ id: string } | null> {
    const token = process.env.FACEBOOK_PAGE_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    if (!token || !pageId) return null;

    const params = new URLSearchParams({ message: text, access_token: token, link });
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, { method: "POST", body: params });
    if (!res.ok) throw new Error(`Facebook: ${res.status} ${await res.text()}`);
    return res.json();
}

// ── Main Handler ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret?.trim() || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const now = new Date();
    const results: Record<string, { postId: string; status: string; error?: string }> = {};
    const POSTS = loadPosts();

    if (POSTS.length === 0) {
        return NextResponse.json({ error: "No posts found in social-posts.json" }, { status: 500 });
    }

    const platforms = ["bluesky", "facebook"] as const;

    for (const platform of platforms) {
        // Get posting history from DB (gracefully handle missing table)
        let postedIds = new Set<string>();
        try {
            const { data: history } = await supabase
                .from("social_post_history")
                .select("post_id")
                .eq("platform", platform)
                .order("posted_at", { ascending: false })
                .limit(POSTS.length);

            postedIds = new Set((history || []).map((h: { post_id: string }) => h.post_id));
        } catch {
            // Table doesn't exist yet — post index 0
        }

        // Find next unposted
        let postIdx = POSTS.findIndex(p => !postedIds.has(p.id));
        if (postIdx === -1) {
            // All posted — clear history and restart
            try { await supabase.from("social_post_history").delete().eq("platform", platform); } catch {}
            postIdx = 0;
        }

        const post = POSTS[postIdx];
        const rendered = renderPost(post, platform);
        if (!rendered) {
            results[platform] = { postId: post.id, status: "skipped", error: "no content" };
            continue;
        }

        const link = buildLink(post, platform);

        try {
            let postResult: { id: string } | null = null;

            if (platform === "bluesky") postResult = await postToBluesky(rendered, link);
            else if (platform === "facebook") postResult = await postToFacebook(rendered, link);

            if (!postResult) {
                results[platform] = { postId: post.id, status: "skipped", error: "no credentials" };
                continue;
            }

            // Log to DB (best-effort — table may not exist yet)
            try {
                await supabase.from("social_post_history").insert({
                    platform,
                    post_id: post.id,
                    post_label: post.label,
                    external_id: postResult.id,
                    utm_campaign: post.id,
                    posted_at: now.toISOString(),
                });
            } catch {}


            results[platform] = { postId: post.id, status: "posted" };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[AutoPost] ${platform} failed:`, msg);
            results[platform] = { postId: post.id, status: "failed", error: msg };
        }
    }

    return NextResponse.json({ success: true, results, timestamp: now.toISOString() });
}
