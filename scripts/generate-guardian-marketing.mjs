#!/usr/bin/env node
/**
 * Guardian Marketing Content Generator
 * Generates: social media posts, directory listing copy, email templates,
 * forum answer templates, and Google My Business posts.
 *
 * Run: node scripts/generate-guardian-marketing.mjs
 * Output: scripts/guardian-marketing.md
 */

import { writeFileSync } from "fs";

const SITE = "https://vedawellapp.com";
const PRODUCT = "HomeOwner Guardian";
const TAGLINE = "Track building defects, variations & costs — free for Australian homeowners";

// ── Landing page URLs ──────────────────────────────────────────────
const LANDING_PAGES = [
    { slug: "nsw-building-defects", title: "NSW Building Defect Tracker" },
    { slug: "construction-variation-tracker", title: "Construction Variation Tracker" },
    { slug: "home-building-checklist-australia", title: "Australian Home Building Checklist" },
    { slug: "hbcf-insurance-guide", title: "HBCF Insurance Guide" },
    { slug: "builder-dispute-evidence", title: "Builder Dispute Evidence" },
    { slug: "new-home-construction-costs", title: "Construction Cost Tracker" },
];

// ── Social Media Posts ─────────────────────────────────────────────
const twitterPosts = [
    `🏗️ Building a new home in Australia? Stop tracking defects in a Notes app.\n\n${PRODUCT} gives you:\n• Timestamped photo evidence\n• Variation cost tracking\n• Fair Trading-ready reports\n\nFree to start. No credit card.\n\n${SITE}/guardian`,
    `The average Aussie new build goes 20% over budget from variations alone.\n\nWhat if you could see the running total in real-time?\n\n${PRODUCT} tracks every variation, every cost change, every approval.\n\nFree → ${SITE}/guardian`,
    `80% of building disputes fail due to lack of evidence.\n\nDon't be part of that statistic.\n\n${PRODUCT} creates timestamped, tamper-proof documentation for NCAT, VCAT, or Fair Trading.\n\nStart free: ${SITE}/guardian`,
    `Pre-drywall is the MOST critical inspection in your entire build.\n\nOnce plasterboard goes up, you'll NEVER see inside your walls again.\n\nOur free checklist covers everything: ${SITE}/guardian/learn/home-building-checklist-australia`,
    `NSW homeowners: your builder must fix structural defects for 6 years.\n\nBut only if you can PROVE they existed.\n\n${PRODUCT} creates the evidence trail. Free.\n\n${SITE}/guardian/learn/nsw-building-defects`,
    `🔥 Just launched: ${PRODUCT}\n\nA free tool for Aussie homeowners building or renovating.\n\n✅ Defect tracker with photo evidence\n✅ Variation & cost tracking\n✅ Stage-by-stage checklists\n✅ Tribunal-ready reports\n\n${SITE}/guardian`,
];

const linkedinPosts = [
    `I built a free tool for Australian homeowners after hearing too many horror stories about building disputes.\n\n${PRODUCT} helps homeowners:\n→ Document defects with timestamped photos\n→ Track variations and cost blowouts\n→ Generate evidence packs for Fair Trading/NCAT/VCAT\n→ Follow stage-by-stage construction checklists\n\nThe average new home build goes 20% over budget. Most homeowners don't realise until handover.\n\nIf you know someone building or renovating, share this — it could save them thousands.\n\nFree: ${SITE}/guardian`,
    `The home building process in Australia is broken.\n\nHomeowners sign contracts they don't fully understand, accept verbal variations without written records, and discover defects only after their builder has moved to the next job.\n\n${PRODUCT} gives homeowners the tools to protect themselves:\n\n1. Pre-drywall checklist — your last chance to see inside walls\n2. Variation lockbox — digital signatures, cost tracking\n3. Defect evidence — timestamped photos, severity ratings\n4. Tribunal reports — formatted for NCAT, VCAT, QCAT\n\nFree to start. No catch.\n\n${SITE}/guardian`,
];

const redditTemplates = [
    {
        subreddit: "r/AusProperty, r/AusFinance, r/sydney, r/melbourne",
        title: "Free tool for tracking building defects and variations during construction",
        body: `Hey all,\n\nI built a free web app for Aussie homeowners who are building or renovating. It's called ${PRODUCT} and it helps you:\n\n- Track defects with photo evidence and severity ratings\n- Log variations with cost impact and digital signatures\n- Follow stage-by-stage construction checklists\n- Generate reports formatted for Fair Trading/NCAT/VCAT\n\nI built it because I kept hearing stories of homeowners losing disputes due to lack of documentation. The free tier gives you 1 project with 3 defects and 2 variations — enough to try it out.\n\nHappy to answer any questions. Link: ${SITE}/guardian`,
    },
    {
        subreddit: "r/AusRenovation, r/HomeImprovement",
        title: "PSA: Take photos of EVERYTHING before drywall goes up",
        body: `The pre-drywall stage is your last chance to inspect what's inside your walls — plumbing, electrical, insulation, waterproofing.\n\nOnce plasterboard is up, it's gone forever.\n\nI made a free construction checklist tool that covers every stage from slab to handover, based on NCC and Australian Standards. You can attach photos to each checkpoint.\n\nLink: ${SITE}/guardian/learn/home-building-checklist-australia\n\nHope it helps someone avoid the mistakes I've seen others make.`,
    },
];

// ── Free Directory Listings ────────────────────────────────────────
const directoryListings = [
    {
        name: "Product Hunt",
        tagline: `${PRODUCT} — Free building defect & variation tracker for Australian homeowners`,
        description: `Track construction defects with timestamped photo evidence, monitor builder variations and cost blowouts in real-time, and generate tribunal-ready reports for Fair Trading, NCAT, or VCAT. Free to start, no credit card required. Built for Australian homeowners building or renovating.`,
        url: `${SITE}/guardian`,
    },
    {
        name: "AlternativeTo",
        tagline: `Free alternative to spreadsheets for tracking home construction defects`,
        description: `${PRODUCT} is a free web app that replaces spreadsheets, email threads, and notes apps for tracking building defects, variations, and construction progress. Designed specifically for Australian homeowners with support for Fair Trading, NCAT, VCAT, and QCAT reporting.`,
        url: `${SITE}/guardian`,
    },
    {
        name: "BetaList / SaaSHub / SideProjectors / Indie Hackers",
        tagline: TAGLINE,
        description: `${PRODUCT} helps Australian homeowners protect their biggest investment during construction. Features include: defect tracking with photo evidence, variation & cost monitoring, stage-by-stage NCC-based checklists, and tribunal-ready evidence packs. Free tier available. Pro at $14.99 AUD/month.`,
        url: `${SITE}/guardian`,
    },
];

// ── Email Templates ────────────────────────────────────────────────
const emailTemplates = [
    {
        name: "Cold outreach to building inspectors",
        subject: "Free tool your clients will love — HomeOwner Guardian",
        body: `Hi [Name],\n\nI built a free tool called ${PRODUCT} that helps homeowners document building defects and track variations during construction.\n\nI think your clients would find it useful because:\n- They can photograph defects at each inspection stage\n- Evidence is timestamped and organised by stage\n- Reports can be shared directly with inspectors like yourself\n\nWould you be open to recommending it to your clients? Happy to set up a walkthrough.\n\n${SITE}/guardian\n\nCheers,\nSridhar`,
    },
    {
        name: "Building forum signature",
        body: `---\n🏗️ Building a new home? Track defects, variations & costs free: ${SITE}/guardian`,
    },
    {
        name: "Facebook group post template",
        body: `Hi everyone 👋\n\nIf you're building or renovating, I wanted to share a free tool I built called ${PRODUCT}.\n\nIt helps you:\n✅ Track building defects with photos\n✅ Monitor variation costs in real-time\n✅ Follow construction checklists stage by stage\n✅ Generate evidence for Fair Trading if things go wrong\n\nFree to use, works on phone and desktop.\n\n${SITE}/guardian\n\nHappy to answer any questions!`,
    },
];

// ── Google Business Profile Posts ──────────────────────────────────
const gbpPosts = [
    `🏗️ New Free Tool: ${PRODUCT}\n\nTrack building defects, construction variations, and costs during your home build. Free for Australian homeowners.\n\nTimestamped photo evidence, stage-by-stage checklists, and tribunal-ready reports.\n\nTry it free: ${SITE}/guardian`,
    `Building a new home? The average Aussie build goes 20% over budget from variations.\n\n${PRODUCT} tracks every variation and shows your running total in real-time.\n\nFree: ${SITE}/guardian`,
];

// ── Backlink Opportunities ─────────────────────────────────────────
const backlinkTargets = [
    "Submit to Australian PropTech directories",
    "Pitch guest post to Domain.com.au or Realestate.com.au blogs",
    "Answer questions on Whirlpool.net.au forums (Home > Building & Renovating)",
    "List on G2.com and Capterra (free listing for SaaS)",
    "Submit to StartupResources.io, LaunchingNext.com, StartupStash.com",
    "Create a free Crunchbase profile",
    "Pitch to podcasts: Australian Property Podcast, My Millennial Money",
    "Submit press release to StartupDaily.net, SmartCompany.com.au",
    "Answer questions on Quora about Australian building disputes",
    "Create YouTube Shorts: 'What to check before drywall goes up' (60 seconds)",
];

// ── Build the markdown output ──────────────────────────────────────
let md = `# HomeOwner Guardian — Marketing Campaign Content\n`;
md += `Generated: ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `---\n\n`;

md += `## Twitter/X Posts (copy-paste ready)\n\n`;
twitterPosts.forEach((post, i) => {
    md += `### Tweet ${i + 1}\n\`\`\`\n${post}\n\`\`\`\n\n`;
});

md += `## LinkedIn Posts\n\n`;
linkedinPosts.forEach((post, i) => {
    md += `### LinkedIn ${i + 1}\n\`\`\`\n${post}\n\`\`\`\n\n`;
});

md += `## Reddit Post Templates\n\n`;
redditTemplates.forEach((post, i) => {
    md += `### Reddit ${i + 1} — ${post.subreddit}\n`;
    md += `**Title:** ${post.title}\n\n`;
    md += `\`\`\`\n${post.body}\n\`\`\`\n\n`;
});

md += `## Free Directory Listings\n\n`;
directoryListings.forEach((d) => {
    md += `### ${d.name}\n`;
    md += `**Tagline:** ${d.tagline}\n\n`;
    md += `**Description:**\n${d.description}\n\n`;
    md += `**URL:** ${d.url}\n\n---\n\n`;
});

md += `## Email Templates\n\n`;
emailTemplates.forEach((e) => {
    md += `### ${e.name}\n`;
    if (e.subject) md += `**Subject:** ${e.subject}\n\n`;
    md += `\`\`\`\n${e.body}\n\`\`\`\n\n`;
});

md += `## Google Business Profile Posts\n\n`;
gbpPosts.forEach((post, i) => {
    md += `### GBP Post ${i + 1}\n\`\`\`\n${post}\n\`\`\`\n\n`;
});

md += `## SEO Landing Pages (auto-generated)\n\n`;
LANDING_PAGES.forEach((p) => {
    md += `- [${p.title}](${SITE}/guardian/learn/${p.slug})\n`;
});

md += `\n## Backlink & Distribution Checklist\n\n`;
backlinkTargets.forEach((t, i) => {
    md += `- [ ] ${t}\n`;
});

md += `\n## Auto-Ping Search Engines\n\n`;
md += `Run after deployment:\n\`\`\`bash\nnode scripts/ping-search-engines.mjs\n\`\`\`\n`;

writeFileSync("scripts/guardian-marketing.md", md, "utf-8");
console.log("✅ Generated: scripts/guardian-marketing.md");
console.log(`   ${twitterPosts.length} Twitter posts`);
console.log(`   ${linkedinPosts.length} LinkedIn posts`);
console.log(`   ${redditTemplates.length} Reddit templates`);
console.log(`   ${directoryListings.length} directory listings`);
console.log(`   ${emailTemplates.length} email templates`);
console.log(`   ${gbpPosts.length} Google Business posts`);
console.log(`   ${LANDING_PAGES.length} SEO landing pages`);
console.log(`   ${backlinkTargets.length} backlink targets`);
