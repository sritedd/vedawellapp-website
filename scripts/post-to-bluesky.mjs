#!/usr/bin/env node
/**
 * Auto-post to Bluesky (AT Protocol) — 100% FREE, no API costs.
 * 
 * Reads posts from scripts/social-posts.json and posts bluesky content.
 * Tracks already-posted content in scripts/.bluesky-posted.json to avoid duplicates.
 * 
 * Usage:
 *   node scripts/post-to-bluesky.mjs                  # Auto-select next unposted
 *   node scripts/post-to-bluesky.mjs --dry-run         # Preview without posting
 *   node scripts/post-to-bluesky.mjs --post 5          # Post specific index
 *   node scripts/post-to-bluesky.mjs --all             # Post all unposted (60s delay)
 *   node scripts/post-to-bluesky.mjs --status           # Show posting status
 *   node scripts/post-to-bluesky.mjs --reset            # Reset posted history
 * 
 * Environment variables:
 *   BLUESKY_HANDLE=yourhandle.bsky.social
 *   BLUESKY_APP_PASSWORD=your-app-password
 * 
 * To get an app password:
 *   1. Go to bsky.app → Settings → Privacy and Security → App Passwords
 *   2. Create a new app password
 *   3. Use it here (NOT your main account password)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE = "https://vedawellapp.com";
const POSTS_FILE = join(__dirname, "social-posts.json");
const HISTORY_FILE = join(__dirname, ".bluesky-posted.json");

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const isDryRun = args.includes("--dry-run");
const showStatus = args.includes("--status");
const resetHistory = args.includes("--reset");
const postAll = args.includes("--all");

const HANDLE = getArg("handle") || process.env.BLUESKY_HANDLE;
const APP_PASSWORD = getArg("password") || process.env.BLUESKY_APP_PASSWORD;

// ─── Load posts from social-posts.json ───────────────────────────────
function loadPosts() {
    if (!existsSync(POSTS_FILE)) {
        console.error(`❌ Posts file not found: ${POSTS_FILE}`);
        process.exit(1);
    }
    const raw = readFileSync(POSTS_FILE, "utf-8");
    const allPosts = JSON.parse(raw);
    
    // Extract bluesky content and resolve {{link}} placeholders
    return allPosts
        .filter(p => p.platforms?.bluesky)
        .map(p => {
            const blogUrl = p.blog.startsWith("http") ? p.blog : `${SITE}${p.blog}`;
            const text = p.platforms.bluesky.replace(/\{\{link\}\}/g, blogUrl);
            return {
                id: p.id,
                label: p.label,
                text,
                link: blogUrl,
            };
        });
}

// ─── Posted history tracking ─────────────────────────────────────────
function loadHistory() {
    if (!existsSync(HISTORY_FILE)) return { posted: [], lastRun: null };
    try {
        return JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
    } catch {
        return { posted: [], lastRun: null };
    }
}

function saveHistory(history) {
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// ─── Bluesky AT Protocol API ─────────────────────────────────────────
const ATP_SERVICE = "https://bsky.social";

async function createSession() {
    const res = await fetch(`${ATP_SERVICE}/xrpc/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: HANDLE, password: APP_PASSWORD }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Auth failed: ${res.status} — ${err}`);
    }
    return res.json();
}

async function createPost(session, text, link = null) {
    const now = new Date().toISOString();

    // Build facets for links
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

    const record = {
        $type: "app.bsky.feed.post",
        text,
        createdAt: now,
        ...(facets.length > 0 ? { facets } : {}),
    };

    if (isDryRun) {
        console.log(`\n🔍 DRY RUN — Would post:`);
        console.log(`   Text: ${text.slice(0, 120)}...`);
        console.log(`   Link: ${link || "none"}`);
        console.log(`   Length: ${text.length} chars`);
        return { uri: "dry-run", cid: "dry-run" };
    }

    const res = await fetch(`${ATP_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessJwt}`,
        },
        body: JSON.stringify({
            repo: session.did,
            collection: "app.bsky.feed.post",
            record,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Post failed: ${res.status} — ${err}`);
    }
    return res.json();
}

// ─── Post a single item and update history ───────────────────────────
async function postItem(session, post, history) {
    console.log(`\n📨 Posting: "${post.label}" (${post.id})`);
    
    // Check character limit (300 for Bluesky)
    if (post.text.length > 300) {
        console.warn(`   ⚠️  Text is ${post.text.length} chars (limit 300). Truncating...`);
        post.text = post.text.slice(0, 297) + "...";
    }
    
    const result = await createPost(session, post.text, post.link);
    
    if (!isDryRun) {
        history.posted.push({
            id: post.id,
            postedAt: new Date().toISOString(),
            uri: result.uri,
        });
        history.lastRun = new Date().toISOString();
        saveHistory(history);
    }
    
    console.log(`   ✅ Posted! URI: ${result.uri}`);
    return result;
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
    const posts = loadPosts();
    const history = loadHistory();
    const postedIds = new Set(history.posted.map(p => p.id));
    
    console.log(`\n🦋 Bluesky Auto-Poster for HomeOwner Guardian`);
    console.log(`   Posts available: ${posts.length}`);
    console.log(`   Already posted: ${postedIds.size}`);
    console.log(`   Remaining: ${posts.length - postedIds.size}`);
    
    // ── Status mode ──
    if (showStatus) {
        console.log(`\n📊 Posting Status:`);
        console.log(`   Last run: ${history.lastRun || "never"}`);
        console.log(`\n   ✅ Posted:`);
        history.posted.forEach(p => {
            console.log(`      ${p.id} — ${p.postedAt}`);
        });
        console.log(`\n   🔲 Not yet posted:`);
        posts.filter(p => !postedIds.has(p.id)).forEach(p => {
            console.log(`      ${p.id} — ${p.label}`);
        });
        return;
    }
    
    // ── Reset mode ──
    if (resetHistory) {
        saveHistory({ posted: [], lastRun: null });
        console.log(`\n🔄 History reset. All ${posts.length} posts are now available.`);
        return;
    }
    
    // ── Credential check ──
    if (!isDryRun && (!HANDLE || !APP_PASSWORD)) {
        console.error("\n❌ Missing credentials.");
        console.error("Set these environment variables:");
        console.error("   BLUESKY_HANDLE=yourhandle.bsky.social");
        console.error("   BLUESKY_APP_PASSWORD=your-app-password");
        console.error("\nOr use --dry-run to preview posts without credentials.");
        process.exit(1);
    }
    
    console.log(`   Handle: ${HANDLE || "(dry-run)"}`);
    console.log(`   Mode: ${isDryRun ? "DRY RUN 🔍" : "LIVE 🔴"}`);
    
    // ── Get unposted items ──
    const unposted = posts.filter(p => !postedIds.has(p.id));
    
    if (unposted.length === 0) {
        console.log("\n🎉 All posts have been published! Use --reset to start over.");
        return;
    }
    
    // ── Authenticate ──
    let session = null;
    if (!isDryRun) {
        console.log("\n🔐 Authenticating with Bluesky...");
        session = await createSession();
        console.log(`   ✅ Authenticated as ${session.handle}`);
    }
    
    const postIndex = getArg("post");
    
    if (postIndex !== null) {
        // ── Post specific index ──
        const idx = parseInt(postIndex, 10);
        if (idx < 0 || idx >= posts.length) {
            console.error(`❌ Invalid post index. Use 0-${posts.length - 1}`);
            process.exit(1);
        }
        await postItem(session, posts[idx], history);
        
    } else if (postAll) {
        // ── Post all unposted with delays ──
        console.log(`\n📨 Posting ${unposted.length} unposted items with 60-second delays...`);
        
        for (let i = 0; i < unposted.length; i++) {
            await postItem(session, unposted[i], history);
            
            if (i < unposted.length - 1) {
                console.log("   ⏳ Waiting 60 seconds...");
                await new Promise(r => setTimeout(r, 60000));
            }
        }
        console.log(`\n🎉 Batch complete! ${unposted.length} posts published.`);
        
    } else {
        // ── Auto-select next unposted (default) ──
        const next = unposted[0];
        console.log(`\n📨 Auto-selecting next unposted: "${next.label}"`);
        await postItem(session, next, history);
        console.log(`\n📊 Progress: ${postedIds.size + 1}/${posts.length} posts published`);
    }
}

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
