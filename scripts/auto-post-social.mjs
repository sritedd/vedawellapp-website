#!/usr/bin/env node
/**
 * Unified Social Media Auto-Poster
 *
 * Posts one message per platform per day, rotating through the post library.
 * Tracks what's been posted to avoid repeats. All links have UTM params.
 *
 * Usage:
 *   node scripts/auto-post-social.mjs                    # Auto-post to all configured platforms
 *   node scripts/auto-post-social.mjs --dry-run           # Preview without posting
 *   node scripts/auto-post-social.mjs --platform bluesky  # Post to one platform
 *   node scripts/auto-post-social.mjs --status             # Show posting history
 *
 * Environment variables:
 *   BLUESKY_HANDLE, BLUESKY_APP_PASSWORD    — Bluesky credentials
 *   FACEBOOK_PAGE_TOKEN, FACEBOOK_PAGE_ID   — Facebook Page credentials
 *   LINKEDIN_ACCESS_TOKEN                   — LinkedIn OAuth token
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = "https://vedawellapp.com";
const POSTS = JSON.parse(readFileSync(join(__dirname, "social-posts.json"), "utf8"));
const HISTORY_FILE = join(__dirname, ".social-post-history.json");

// ── CLI Args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const isDryRun = args.includes("--dry-run");
const showStatus = args.includes("--status");
const platformFilter = getArg("platform"); // null = all

// ── Post History ──────────────────────────────────────────────────
function loadHistory() {
    if (!existsSync(HISTORY_FILE)) return {};
    return JSON.parse(readFileSync(HISTORY_FILE, "utf8"));
}

function saveHistory(history) {
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function getNextPostIndex(platform, history) {
    const posted = history[platform] || [];
    // Find first post not yet posted
    for (let i = 0; i < POSTS.length; i++) {
        if (!posted.includes(POSTS[i].id)) return i;
    }
    // All posted — reset and start over
    history[platform] = [];
    return 0;
}

// ── UTM Link Builder ──────────────────────────────────────────────
function buildLink(post, platform) {
    const base = post.blog.startsWith("http") ? post.blog : `${SITE}${post.blog}`;
    const utm = new URLSearchParams({
        utm_source: platform,
        utm_medium: "social",
        utm_campaign: post.id,
    });
    return `${base}?${utm}`;
}

function renderPost(post, platform) {
    const text = post.platforms[platform];
    if (!text) return null;
    const link = buildLink(post, platform);
    return text.replace(/\{\{link\}\}/g, link);
}

// ── Platform Posters ──────────────────────────────────────────────
async function postToBluesky(text, link) {
    const handle = process.env.BLUESKY_HANDLE;
    const password = process.env.BLUESKY_APP_PASSWORD;
    if (!handle || !password) { console.log("   ⏭️  Bluesky: no credentials"); return null; }

    const authRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle, password }),
    });
    if (!authRes.ok) throw new Error(`Bluesky auth failed: ${authRes.status}`);
    const session = await authRes.json();

    // Build link facets
    const facets = [];
    if (link) {
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
    if (!res.ok) throw new Error(`Bluesky post failed: ${res.status}`);
    return res.json();
}

async function postToFacebook(text, link) {
    const token = process.env.FACEBOOK_PAGE_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    if (!token || !pageId) { console.log("   ⏭️  Facebook: no credentials"); return null; }

    const params = new URLSearchParams({ message: text, access_token: token, ...(link ? { link } : {}) });
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, { method: "POST", body: params });
    if (!res.ok) throw new Error(`Facebook post failed: ${res.status} ${await res.text()}`);
    return res.json();
}

async function postToLinkedin(text) {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) { console.log("   ⏭️  LinkedIn: no credentials"); return null; }

    // Get user URN
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) throw new Error(`LinkedIn auth failed: ${meRes.status}`);
    const me = await meRes.json();

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            author: `urn:li:person:${me.sub}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text },
                    shareMediaCategory: "NONE",
                },
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
    });
    if (!res.ok) throw new Error(`LinkedIn post failed: ${res.status} ${await res.text()}`);
    return res.json();
}

const POSTERS = {
    bluesky: (text, link) => postToBluesky(text, link),
    facebook: (text, link) => postToFacebook(text, link),
    linkedin: (text) => postToLinkedin(text),
};

// ── Main ──────────────────────────────────────────────────────────
async function main() {
    const history = loadHistory();

    if (showStatus) {
        console.log("\n📊 Social Posting Status\n");
        console.log(`Total posts in library: ${POSTS.length}`);
        for (const platform of Object.keys(POSTERS)) {
            const posted = history[platform] || [];
            console.log(`\n${platform}: ${posted.length}/${POSTS.length} posted`);
            if (posted.length > 0) {
                console.log(`   Last: ${posted[posted.length - 1]} at ${history[`${platform}_last_at`] || "unknown"}`);
            }
            const nextIdx = getNextPostIndex(platform, { ...history });
            console.log(`   Next: "${POSTS[nextIdx].label}"`);
        }
        return;
    }

    console.log(`\n🚀 VedaWell Social Auto-Poster`);
    console.log(`   Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`   Posts in library: ${POSTS.length}`);
    console.log(`   Platform: ${platformFilter || "all configured"}\n`);

    const platforms = platformFilter ? [platformFilter] : Object.keys(POSTERS);
    let totalPosted = 0;

    for (const platform of platforms) {
        if (!POSTERS[platform]) {
            console.log(`❌ Unknown platform: ${platform}`);
            continue;
        }

        const idx = getNextPostIndex(platform, history);
        const post = POSTS[idx];
        const rendered = renderPost(post, platform);

        if (!rendered) {
            console.log(`   ⏭️  ${platform}: no content for "${post.label}"`);
            continue;
        }

        const link = buildLink(post, platform);
        console.log(`📨 ${platform}: "${post.label}" (#${idx})`);

        if (isDryRun) {
            console.log(`   Preview: ${rendered.slice(0, 120)}...`);
            console.log(`   UTM link: ${link}`);
        } else {
            try {
                const result = await POSTERS[platform](rendered, link);
                if (result) {
                    console.log(`   ✅ Posted! ${JSON.stringify(result).slice(0, 100)}`);
                    if (!history[platform]) history[platform] = [];
                    history[platform].push(post.id);
                    history[`${platform}_last_at`] = new Date().toISOString();
                    totalPosted++;
                }
            } catch (err) {
                console.error(`   ❌ Failed: ${err.message}`);
            }
        }
    }

    if (!isDryRun) {
        saveHistory(history);
        console.log(`\n🎉 Done! ${totalPosted} posts published.`);
    } else {
        console.log(`\n🔍 Dry run complete. ${platforms.length} platforms previewed.`);
    }
}

main().catch(err => { console.error("❌ Fatal:", err.message); process.exit(1); });
