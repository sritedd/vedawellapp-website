#!/usr/bin/env node
/**
 * Auto-post to Facebook Page & Instagram via Meta Graph API — 100% FREE.
 * 
 * Setup (one-time):
 *   1. Go to developers.facebook.com → Create App → Business type
 *   2. Add "Pages" and "Instagram Basic Display" products
 *   3. Get a Page Access Token (with pages_manage_posts, pages_read_engagement)
 *   4. For Instagram: link your Instagram Business account to your Facebook Page
 * 
 * Usage:
 *   FACEBOOK_PAGE_TOKEN=your-token FACEBOOK_PAGE_ID=your-page-id node scripts/post-to-meta.mjs
 *   
 *   Or:
 *   node scripts/post-to-meta.mjs --page-token "token" --page-id "id" --post 0
 * 
 * Options:
 *   --platform facebook|instagram|both   (default: both)
 *   --post <index>                        Post a specific post by index
 *   --dry-run                             Preview without posting
 *   --list                                List all available posts
 */

const SITE = "https://vedawellapp.com";

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const isDryRun = args.includes("--dry-run");
const listOnly = args.includes("--list");
const platform = getArg("platform") || "both";

const PAGE_TOKEN = getArg("page-token") || process.env.FACEBOOK_PAGE_TOKEN;
const PAGE_ID = getArg("page-id") || process.env.FACEBOOK_PAGE_ID;
const IG_USER_ID = getArg("ig-user-id") || process.env.INSTAGRAM_USER_ID;

const GRAPH_API = "https://graph.facebook.com/v19.0";

// Guardian social media posts
const POSTS = [
    {
        facebook: `🚨 Your builder just sent an invoice. Should you pay it?

Most homeowners just... pay. Cross their fingers. Hope the work was done properly.

But what if:
❌ The required certificates weren't uploaded?
❌ The inspection didn't pass?
❌ Critical defects are still unresolved?

HomeOwner Guardian's "Should I Pay?" button checks ALL of this in one tap.

✅ Green = Safe to pay
🔴 Red = DO NOT PAY (with exactly what's missing)

Stop guessing. Start building with authority.

🔗 Try it free → ${SITE}/guardian

#HomeBuilding #AustralianHomes #ConstructionTips #HomeOwnerGuardian`,
        instagram: `🚨 YOUR BUILDER SENT AN INVOICE.

But is it actually safe to pay?

The "Should I Pay?" button runs a complete cross-check:
✅ Certificates uploaded?
✅ Inspections passed?
✅ Critical defects resolved?

One tap. One verdict.

Green light = pay with confidence
Red light = here's exactly what's missing

Link in bio → vedawellapp.com/guardian

#HomeBuilding #NewBuild #AustralianProperty #ConstructionDefects #HomeOwner #BuildingInspection #PropertyInvestment #FirstHomeBuyer`,
        link: `${SITE}/blog/financial-protection-should-i-pay`,
        label: "Should I Pay?",
    },
    {
        facebook: `🤖 What if you had a construction expert in your pocket 24/7?

Building a new home? You're dealing with NCC clauses, AS standards, and technical jargon.

Meet Guardian AI:
🧠 Knows the National Construction Code inside out
📝 Turns your rough notes into professional defect reports
🏗️ Tells you what to check at every stage
💬 Answers questions about YOUR specific build

Instead of "the wall looks funny" → "Non-compliant stud spacing observed relative to AS 1684."

🔗 ${SITE}/guardian

#AI #HomeBuilding #ConstructionAI #AustralianHomes`,
        instagram: `🤖 YOUR PERSONAL AI CONSTRUCTION EXPERT

Ever felt like your builder is speaking a different language?

Guardian AI translates builder jargon into plain English AND writes professional defect reports.

Ask it anything:
💬 "Is this crack normal?"
💬 "What should I check at frame stage?"
💬 "How do I write a waterproofing complaint?"

It knows the NCC 2025 better than most builders 😏

Link in bio → vedawellapp.com/guardian

#AI #ConstructionTech #HomeOwner #FirstHomeBuyer #AustralianHomes #BuildingInspection #PropTech`,
        link: `${SITE}/blog/ai-site-supervisor-value`,
        label: "AI Site Supervisor",
    },
    {
        facebook: `😱 85% of new apartment buildings in NSW have at least one SERIOUS defect.

Think houses are any better? They're not.

Top 5 defects and what they cost to fix AFTER handover:
1. 💧 Waterproofing failures — $8K-$50K
2. 🏗️ Structural cracking — $10K-$100K+
3. 🏠 Roof & flashing defects — $3K-$30K
4. 🔌 Electrical non-compliance — $1K-$10K
5. 🧱 External cladding issues — $5K-$40K

Most of these are only fixable DURING construction.

Once walls are closed up... it's too late.

🔗 ${SITE}/blog/10-construction-defects-australian-homes

#BuildingDefects #NewHome #AustralianHomes #HomeBuilding #PropertyProtection`,
        instagram: `😱 85% OF NEW BUILDINGS HAVE SERIOUS DEFECTS

Top 5 defects that cost homeowners the most:

1. Waterproofing failure → $8K-$50K
2. Structural cracking → $10K-$100K+
3. Roof/flashing defects → $3K-$30K
4. Drainage issues → $5K-$25K
5. Insulation gaps → $3K-$15K

The worst part? Most get hidden behind walls.

Your ONLY chance to catch them is during construction.

Link in bio → vedawellapp.com/guardian

#BuildingDefects #AustralianProperty #NewHome #ConstructionFail #HomeOwner #PropertyInvestor #FirstHomeBuyer`,
        link: `${SITE}/blog/10-construction-defects-australian-homes`,
        label: "85% Defects",
    },
    {
        facebook: `⚠️ 6 things your builder hopes you NEVER find out:

1. "Trust me, it's industry standard" → NOT a legal standard
2. "Concrete is booked, can't wait for inspector" → YOU have the RIGHT to inspect
3. "This product is equivalent" → Get written approval for ANY substitution
4. "Don't worry about paperwork" → Verbal agreements = unenforceable
5. "You can't visit — insurance" → You have contractual access rights
6. "Pay now or trades won't come" → Never pay for incomplete work

Not all builders do this. The good ones welcome informed homeowners.

Don't be ignorant. Be armed. 🛡️

🔗 ${SITE}/blog/why-builders-hate-informed-homeowners

#DodgyBuilder #HomeBuilding #AustralianHomes #YourRights`,
        instagram: `⚠️ 6 TACTICS DODGY BUILDERS USE

1️⃣ "Trust me, it's industry standard"
   → The NCC is the only standard

2️⃣ "Concrete is booked, skip inspection"
   → YOUR right to inspect is non-negotiable

3️⃣ "This product is equivalent"
   → Get WRITTEN approval for any substitution

4️⃣ "Don't worry about paperwork"
   → Verbal = unenforceable

5️⃣ "You can't visit the site"
   → You have contractual access rights

6️⃣ "Pay now or trades stop"
   → Never pay for incomplete work

Tag a friend who's building 🏗️

#DodgyBuilder #HomeBuilding #BuilderTactics #AustralianHomes #NewBuild #OwnerBuilder`,
        link: `${SITE}/blog/why-builders-hate-informed-homeowners`,
        label: "Dodgy Builder Tactics",
    },
    {
        facebook: `⚖️ What if your builder dispute went to tribunal tomorrow?

Could you produce:
📋 Complete defect register with photos?
📋 Inspection results?
📋 Certificate compliance status?
📋 Payment history?
📋 Communication timeline?

Most homeowners spend DAYS gathering this.

HomeOwner Guardian generates it in ONE TAP.

All 10 sections. Customised to your state (NCAT, VCAT, QCAT + all states).

3 seconds, not 3 days.

🔗 ${SITE}/guardian

#NCAT #VCAT #BuilderDispute #HomeOwnerRights #FairTrading`,
        instagram: `⚖️ TRIBUNAL-READY IN 3 SECONDS

If things go wrong with your builder, you need evidence.

HomeOwner Guardian generates a COMPLETE evidence pack:
📋 Defect register + photos
📋 Inspection history
📋 Certificate compliance
📋 Payment records
📋 Communication log

Customised for YOUR state (NCAT, VCAT, QCAT).

One tap. Done.

Link in bio → vedawellapp.com/guardian

#NCAT #VCAT #BuilderDispute #AustralianLaw #HomeOwnerRights #ConstructionDispute`,
        link: `${SITE}/guardian`,
        label: "Tribunal Evidence",
    },
];

// List mode
if (listOnly) {
    console.log("\n📋 Available posts:\n");
    POSTS.forEach((p, i) => console.log(`  [${i}] ${p.label}`));
    console.log(`\nUse --post <index> to post a specific one.`);
    process.exit(0);
}

// Validate credentials
if (!isDryRun && (!PAGE_TOKEN || !PAGE_ID)) {
    console.error("❌ Missing Facebook Page credentials.");
    console.error("Set FACEBOOK_PAGE_TOKEN and FACEBOOK_PAGE_ID environment variables.");
    console.error("Or use --page-token and --page-id flags.");
    console.error("\nUse --dry-run to preview posts without credentials.");
    console.error("Use --list to see available posts.");
    process.exit(1);
}

async function postToFacebook(message, link) {
    if (isDryRun) {
        console.log("\n🔍 DRY RUN — Facebook post:");
        console.log(`   ${message.slice(0, 120)}...`);
        return { id: "dry-run" };
    }

    const params = new URLSearchParams({
        message,
        access_token: PAGE_TOKEN,
        ...(link ? { link } : {}),
    });

    const res = await fetch(`${GRAPH_API}/${PAGE_ID}/feed`, {
        method: "POST",
        body: params,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Facebook post failed: ${JSON.stringify(err)}`);
    }
    return res.json();
}

async function postToInstagram(caption) {
    if (!IG_USER_ID) {
        console.log("   ⏭️ Skipping Instagram (no INSTAGRAM_USER_ID set)");
        return null;
    }

    if (isDryRun) {
        console.log("\n🔍 DRY RUN — Instagram post:");
        console.log(`   ${caption.slice(0, 120)}...`);
        return { id: "dry-run" };
    }

    // Note: Instagram Graph API requires an image_url for feed posts
    // For text-only posts, you'll need to provide an image
    console.log("   ⚠️ Instagram requires an image URL. Use Meta Business Suite for image posts.");
    return null;
}

async function main() {
    console.log("\n📘 Meta (Facebook/Instagram) Auto-Poster for VedaWell");
    console.log(`   Platform: ${platform}`);
    console.log(`   Mode: ${isDryRun ? "DRY RUN" : "LIVE"}\n`);

    const postIndex = getArg("post");

    if (postIndex !== null) {
        const idx = parseInt(postIndex, 10);
        if (idx < 0 || idx >= POSTS.length) {
            console.error(`❌ Invalid index. Use 0-${POSTS.length - 1}`);
            process.exit(1);
        }

        const post = POSTS[idx];
        console.log(`📨 Posting: "${post.label}"`);

        if (platform === "facebook" || platform === "both") {
            const result = await postToFacebook(post.facebook, post.link);
            console.log(`   ✅ Facebook: ${result.id}`);
        }

        if (platform === "instagram" || platform === "both") {
            await postToInstagram(post.instagram);
        }
    } else {
        // Auto-select based on day of year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const idx = dayOfYear % POSTS.length;

        const post = POSTS[idx];
        console.log(`📨 Auto-selected: "${post.label}" (post #${idx}, day ${dayOfYear})`);

        if (platform === "facebook" || platform === "both") {
            const result = await postToFacebook(post.facebook, post.link);
            console.log(`   ✅ Facebook: ${result.id}`);
        }

        if (platform === "instagram" || platform === "both") {
            await postToInstagram(post.instagram);
        }
    }

    console.log("\n🎉 Done!");
}

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
