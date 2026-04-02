#!/usr/bin/env node
/**
 * Auto-post to Bluesky (AT Protocol) — 100% FREE, no API costs.
 * 
 * Usage:
 *   node scripts/post-to-bluesky.mjs --handle "yourhandle.bsky.social" --password "your-app-password"
 * 
 * Or set environment variables:
 *   BLUESKY_HANDLE=yourhandle.bsky.social
 *   BLUESKY_APP_PASSWORD=your-app-password
 *   node scripts/post-to-bluesky.mjs
 * 
 * To get an app password:
 *   1. Go to bsky.app → Settings → Privacy and Security → App Passwords
 *   2. Create a new app password
 *   3. Use it here (NOT your main account password)
 * 
 * Features:
 *   - Auto-post text with links
 *   - Upload and attach images
 *   - Rich text with link cards
 *   - Dry-run mode (--dry-run)
 */

const SITE = "https://vedawellapp.com";

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const isDryRun = args.includes("--dry-run");

const HANDLE = getArg("handle") || process.env.BLUESKY_HANDLE;
const APP_PASSWORD = getArg("password") || process.env.BLUESKY_APP_PASSWORD;

if (!isDryRun && (!HANDLE || !APP_PASSWORD)) {
    console.error("❌ Missing credentials.");
    console.error("Usage: node scripts/post-to-bluesky.mjs --handle your.bsky.social --password your-app-password");
    console.error("Or set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD environment variables.");
    console.error("Or use --dry-run to preview posts without credentials.");
    process.exit(1);
}

// Bluesky AT Protocol API
const ATP_SERVICE = "https://bsky.social";

async function createSession() {
    // Custom domain handles need DID resolution first
    let identifier = HANDLE;
    if (!HANDLE.endsWith(".bsky.social")) {
        const resolveRes = await fetch(
            `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(HANDLE)}`
        );
        if (resolveRes.ok) {
            const { did } = await resolveRes.json();
            identifier = did;
            console.log(`   Resolved ${HANDLE} → ${did}`);
        }
    }

    const res = await fetch(`${ATP_SERVICE}/xrpc/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: APP_PASSWORD }),
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
        console.log("\n🔍 DRY RUN — Would post:");
        console.log(`   Text: ${text.slice(0, 100)}...`);
        console.log(`   Link: ${link || "none"}`);
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

// Queue of posts to send — one at a time with delays
const GUARDIAN_POSTS = [
    {
        text: `🚨 Your builder sent an invoice. Should you pay it?\n\nHomeOwner Guardian's "Should I Pay?" button checks certificates, inspections, and defects in one tap.\n\n✅ Green = Safe to pay\n🔴 Red = DO NOT PAY\n\nStop guessing. Start building with authority.\n\n${SITE}/guardian`,
        link: `${SITE}/guardian`,
    },
    {
        text: `🤖 What if you had a construction expert in your pocket 24/7?\n\nGuardian AI is trained on the NCC 2025 + Australian Standards. It turns "the wall looks funny" into professional, code-referenced defect reports.\n\nNo building degree required.\n\n${SITE}/guardian`,
        link: `${SITE}/guardian`,
    },
    {
        text: `😱 85% of new apartment buildings in NSW have at least one SERIOUS defect.\n\nThe top 5 defects cost homeowners $8K-$100K+ to fix AFTER handover.\n\nYour only chance to catch them? During construction.\n\nHomeOwner Guardian = your construction watchdog 🐕\n\n${SITE}/blog/10-construction-defects-australian-homes`,
        link: `${SITE}/blog/10-construction-defects-australian-homes`,
    },
    {
        text: `⚠️ 6 tactics dodgy builders use:\n\n1. "Trust me, it's industry standard"\n2. "Concrete is booked, skip inspection"\n3. "This product is equivalent"\n4. "Don't worry about paperwork"\n5. "You can't visit the site"\n6. "Pay now or trades stop"\n\nKnow your rights 👇\n${SITE}/blog/why-builders-hate-informed-homeowners`,
        link: `${SITE}/blog/why-builders-hate-informed-homeowners`,
    },
    {
        text: `⚖️ If your builder dispute went to tribunal tomorrow, could you produce evidence?\n\nHomeOwner Guardian generates a complete tribunal-ready evidence pack in ONE TAP.\n\nAll 10 sections. Customised to your state (NCAT, VCAT, QCAT).\n\n3 seconds, not 3 days.\n\n${SITE}/guardian`,
        link: `${SITE}/guardian`,
    },
];

async function main() {
    console.log(`\n🦋 Bluesky Auto-Poster for VedaWell`);
    console.log(`   Handle: ${HANDLE}`);
    console.log(`   Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`   Posts queued: ${GUARDIAN_POSTS.length}\n`);

    // Select which post to send (round-robin based on day of year)
    const postIndex = getArg("post");
    
    if (postIndex !== null) {
        // Post a specific one
        const idx = parseInt(postIndex, 10);
        if (idx < 0 || idx >= GUARDIAN_POSTS.length) {
            console.error(`❌ Invalid post index. Use 0-${GUARDIAN_POSTS.length - 1}`);
            process.exit(1);
        }
        
        console.log(`📨 Posting #${idx}...`);
        if (!isDryRun) {
            const session = await createSession();
            const result = await createPost(session, GUARDIAN_POSTS[idx].text, GUARDIAN_POSTS[idx].link);
            console.log(`✅ Posted! URI: ${result.uri}`);
        } else {
            await createPost(null, GUARDIAN_POSTS[idx].text, GUARDIAN_POSTS[idx].link);
        }
    } else if (args.includes("--all")) {
        // Post all with 60-second delays
        console.log("📨 Posting ALL with 60-second delays...");
        const session = await createSession();
        
        for (let i = 0; i < GUARDIAN_POSTS.length; i++) {
            console.log(`\n📨 Posting ${i + 1}/${GUARDIAN_POSTS.length}...`);
            const result = await createPost(session, GUARDIAN_POSTS[i].text, GUARDIAN_POSTS[i].link);
            console.log(`✅ Posted! URI: ${result.uri}`);
            
            if (i < GUARDIAN_POSTS.length - 1) {
                console.log("⏳ Waiting 60 seconds...");
                await new Promise(r => setTimeout(r, 60000));
            }
        }
        console.log("\n🎉 All posts published!");
    } else {
        // Auto-select based on day of year (round-robin)
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const idx = dayOfYear % GUARDIAN_POSTS.length;
        
        console.log(`📨 Auto-selected post #${idx} (day ${dayOfYear} of year)...`);
        if (!isDryRun) {
            const session = await createSession();
            const result = await createPost(session, GUARDIAN_POSTS[idx].text, GUARDIAN_POSTS[idx].link);
            console.log(`✅ Posted! URI: ${result.uri}`);
        } else {
            await createPost(null, GUARDIAN_POSTS[idx].text, GUARDIAN_POSTS[idx].link);
        }
    }
}

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
