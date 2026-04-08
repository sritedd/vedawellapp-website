#!/usr/bin/env node
/**
 * Generate HomeOwner Guardian social media content from blog posts.
 * Run: node scripts/generate-guardian-social.mjs
 *
 * Output: scripts/guardian-social-posts.md — ready-to-post content for each platform.
 * 
 * This script reads your blog post data and generates platform-specific
 * social media posts optimized for engagement on Facebook, Instagram, 
 * LinkedIn, and Bluesky.
 */

import { writeFileSync } from "fs";

const SITE = "https://vedawellapp.com";

// Guardian blog posts to promote — ordered by date (newest first)
const GUARDIAN_POSTS = [
    {
        slug: "financial-protection-should-i-pay",
        title: "The 'Should I Pay?' Button: Your Financial Shield Against Construction Risks",
        hook: "Your builder sent an invoice. Should you actually pay it?",
        emoji: "🚨",
        feature: "Should I Pay?",
        pain: "Paying for incomplete or non-compliant construction work",
        cta: "Stop guessing. Start building with authority.",
        keywords: ["payment protection", "builder invoice", "construction payment"],
    },
    {
        slug: "ai-site-supervisor-value",
        title: "How Guardian AI Becomes Your Personal 24/7 Site Supervisor",
        hook: "What if you had a construction expert in your pocket 24/7?",
        emoji: "🤖",
        feature: "Guardian AI Chat",
        pain: "Not understanding builder jargon and NCC requirements",
        cta: "Get the knowledge of a building consultant without the $800 price tag.",
        keywords: ["AI construction", "building advisor", "NCC expert"],
    },
    {
        slug: "guardian-essential-features-roundup",
        title: "HomeOwner Guardian: 5 Essential Features to Protect Your Biggest Investment",
        hook: "Building a home? These 5 features could save you $50,000+",
        emoji: "🛡️",
        feature: "Feature Roundup",
        pain: "No visibility into construction quality during the build",
        cta: "Protect your biggest investment from day one.",
        keywords: ["construction tracking", "building app", "defect detection"],
    },
    {
        slug: "homeowner-guardian-vs-private-inspector",
        title: "HomeOwner Guardian vs. Private Building Inspector: Which Do You Actually Need?",
        hook: "Private inspectors cost $500-$800 per visit. But they only see your site for an hour.",
        emoji: "⚖️",
        feature: "Continuous Monitoring",
        pain: "Spending $3,000+ on inspectors who miss issues between visits",
        cta: "Continuous monitoring beats a one-off snapshot every time.",
        keywords: ["building inspector", "inspection cost", "construction monitoring"],
    },
    {
        slug: "10-construction-defects-australian-homes",
        title: "10 Most Common Construction Defects in Australian New Homes",
        hook: "85% of new buildings have at least one SERIOUS defect. Here are the top 10.",
        emoji: "😱",
        feature: "Defect Tracking",
        pain: "Discovering $50,000+ defects after it's too late to fix",
        cta: "Catch defects during construction, not after handover.",
        keywords: ["construction defects", "building quality", "home defects"],
    },
    {
        slug: "why-builders-hate-informed-homeowners",
        title: "Why Some Builders Don't Want You to Know Your Rights",
        hook: "6 tactics dodgy builders use — and how to fight back",
        emoji: "⚠️",
        feature: "Red Flag Alerts",
        pain: "Being manipulated by builders who exploit homeowner ignorance",
        cta: "Don't be ignorant. Be armed.",
        keywords: ["dodgy builder", "builder tactics", "homeowner rights"],
    },
    {
        slug: "homeowner-rights-building-disputes-australia",
        title: "Your Rights as a Homeowner: Navigating Building Disputes in Australia",
        hook: "Your builder ignored your defect notice. Now what?",
        emoji: "⚖️",
        feature: "Tribunal Evidence Export",
        pain: "Feeling powerless in building disputes without proper documentation",
        cta: "Australian law protects you — you just need to know how to use it.",
        keywords: ["building dispute", "NCAT", "homeowner rights"],
    },
    {
        slug: "what-to-check-before-concrete-slab-poured",
        title: "What to Check Before Your Concrete Slab Is Poured",
        hook: "Once concrete is poured, there's NO going back. Here's your checklist.",
        emoji: "🏗️",
        feature: "Stage Checklists",
        pain: "Missing critical pre-slab issues that are locked in forever",
        cta: "Your slab sets the tone for the entire build. Get it right.",
        keywords: ["pre-slab inspection", "concrete slab", "foundation check"],
    },
];

function generateFacebookPost(post) {
    return `### ${post.title}
${post.emoji} ${post.hook}

Most homeowners don't know about this until it's too late.

${post.pain} is one of the biggest risks when building a new home in Australia.

HomeOwner Guardian's "${post.feature}" feature gives you the power to protect yourself — no building degree required.

${post.cta}

🔗 Read more → ${SITE}/blog/${post.slug}
🛡️ Try Guardian free → ${SITE}/guardian

#HomeBuilding #AustralianHomes #ConstructionTips #HomeOwnerGuardian #NewHome #BuildingDefects #PropertyProtection #FirstHomeBuyer
`;
}

function generateInstagramPost(post) {
    return `### ${post.title}
${post.emoji} ${post.hook.toUpperCase()}

${post.pain}? Not on our watch.

HomeOwner Guardian gives you the tools to fight back:
✅ ${post.feature}
✅ NCC 2025 compliant checklists
✅ AI-powered defect descriptions
✅ Tribunal-ready evidence export

${post.cta}

Link in bio → vedawellapp.com/guardian

#HomeBuilding #NewBuild #AustralianProperty #ConstructionDefects #HomeOwner #BuildingInspection #PropertyInvestment #FirstHomeBuyer #OwnerBuilder #BuilderDispute #NCC2025 #HomeRenovation #${post.keywords[0].replace(/\s+/g, "")}
`;
}

function generateLinkedInPost(post) {
    return `### ${post.title}
${post.hook}

Here's the problem most Australian homeowners face:
→ ${post.pain}

We built HomeOwner Guardian to solve this.

Our "${post.feature}" feature uses AI and the National Construction Code (NCC 2025) to empower homeowners with professional-grade construction monitoring.

The result: homeowners who catch defects during construction, not after handover — saving thousands in rectification costs.

Read the full breakdown: ${SITE}/blog/${post.slug}

Try it free: ${SITE}/guardian

#PropTech #ConstructionTech #HomeBuilding #Australia #StartupLife #AI
`;
}

function generateBlueskyPost(post) {
    return `### ${post.title}
${post.emoji} ${post.hook}

${post.cta}

${SITE}/blog/${post.slug}
`;
}

let output = "# HomeOwner Guardian — Social Media Campaign Posts\n";
output += `Generated: ${new Date().toISOString().split("T")[0]}\n\n`;
output += "Copy-paste these posts to each platform. Schedule 1 post per day.\n";
output += "Pair each post with a clickbait image from the /scripts/social-images/ folder.\n\n";

// Facebook
output += "---\n## 📘 Facebook Posts\n\n";
for (const post of GUARDIAN_POSTS) {
    output += generateFacebookPost(post) + "\n";
}

// Instagram
output += "---\n## 📸 Instagram Posts\n\n";
for (const post of GUARDIAN_POSTS) {
    output += generateInstagramPost(post) + "\n";
}

// LinkedIn
output += "---\n## 🔵 LinkedIn Posts\n\n";
for (const post of GUARDIAN_POSTS) {
    output += generateLinkedInPost(post) + "\n";
}

// Bluesky
output += "---\n## 🦋 Bluesky Posts\n\n";
for (const post of GUARDIAN_POSTS) {
    output += generateBlueskyPost(post) + "\n";
}

// Reddit — special format
output += "---\n## 🟠 Reddit Posts\n\n";
output += "Post to: r/AusProperty, r/AusFinance, r/homebuilding, r/SideProject, r/AustralianMakeItYourself\n\n";

output += `### r/AusProperty
**Title:** I built an app that tells homeowners when it's safe to pay their builder — and when it's NOT

**Body:**
Building a new home in Australia? The #1 question every homeowner asks is: "Should I pay this invoice?"

I built HomeOwner Guardian (${SITE}/guardian) — it cross-checks your builder's certificates, inspections, and defect register and gives you a Green/Red verdict on every progress payment.

Also includes:
- AI construction advisor (trained on NCC 2025)
- Defect tracking with timestamped photo evidence
- Builder speed benchmarking against industry averages
- One-tap tribunal evidence export (NCAT, VCAT, QCAT)

Would love feedback from anyone who's been through a build!

`;

output += `### r/AusFinance
**Title:** PSA: You have the legal right to withhold builder payments until certificates are provided. Here's how to enforce it.

**Body:**
When building a new home, your statutory rights allow you to withhold progress payments until:
- Required certificates are uploaded
- Inspections have passed
- Critical defects are resolved

Most homeowners don't know this — and builders count on that ignorance.

I built a tool that automates this check: ${SITE}/guardian

The "Should I Pay?" button cross-references everything and gives you a clear Green/Red verdict. If it's Red, it tells you exactly what's missing.

Warranty periods by state:
- NSW: 6 years structural, 2 years non-structural
- VIC: 10 years structural, 6 years non-structural
- QLD: 6.5 years structural, 6 months non-structural

Full breakdown on our blog: ${SITE}/blog/homeowner-rights-building-disputes-australia

`;

// Posting schedule
output += "---\n## 📅 Recommended Posting Schedule\n\n";
output += "| Week | Day | Platform | Post Topic |\n";
output += "|------|-----|----------|------------|\n";

const schedule = [
    ["1", "Mon", "Facebook, Instagram, Bluesky", "Should I Pay?"],
    ["1", "Tue", "LinkedIn", "Should I Pay? (professional angle)"],
    ["1", "Wed", "Facebook, Instagram", "AI Site Supervisor"],
    ["1", "Thu", "LinkedIn, Bluesky", "AI Advisor (tech angle)"],
    ["1", "Fri", "Facebook, Instagram", "85% Defects Statistic"],
    ["1", "Sat", "Facebook, Instagram", "Dodgy Builder Tactics"],
    ["1", "Sun", "LinkedIn", "Tribunal Evidence Export"],
    ["2", "Mon", "Reddit (r/AusProperty)", "Should I Pay? feature"],
    ["2", "Tue", "Facebook, Instagram", "Pre-Slab Checklist"],
    ["2", "Wed", "Reddit (r/AusFinance)", "Payment rights PSA"],
    ["2", "Thu", "LinkedIn, Bluesky", "Guardian vs Inspector"],
    ["2", "Fri", "Facebook, Instagram", "Homeowner Rights"],
    ["2", "Sat", "Facebook, Instagram", "Feature Roundup"],
    ["2", "Sun", "LinkedIn", "Building Stages Guide"],
];

for (const [week, day, platform, topic] of schedule) {
    output += `| ${week} | ${day} | ${platform} | ${topic} |\n`;
}

output += "\n\n## 🕐 Best Posting Times (AEST)\n\n";
output += "| Platform | Best Time | Why |\n";
output += "|----------|-----------|-----|\n";
output += "| Facebook | 9:00 AM | Morning commute / coffee scroll |\n";
output += "| Instagram | 12:00 PM | Lunch break scroll |\n";
output += "| LinkedIn | 8:30 AM | Pre-work professional browsing |\n";
output += "| Bluesky | 5:00 PM | After-work tech crowd |\n";
output += "| Reddit | 7:00 PM | Evening browsing peak |\n";

const outputPath = new URL("./guardian-social-posts.md", import.meta.url).pathname;
const cleanPath = outputPath.startsWith("/") && outputPath[2] === ":" ? outputPath.slice(1) : outputPath;
writeFileSync(cleanPath, output);
console.log(`✅ Generated Guardian social posts at: ${cleanPath}`);
console.log("\nPlatforms covered:");
console.log("  📘 Facebook — 8 posts");
console.log("  📸 Instagram — 8 posts");
console.log("  🔵 LinkedIn — 8 posts");
console.log("  🦋 Bluesky — 8 posts");
console.log("  🟠 Reddit — 2 posts (r/AusProperty, r/AusFinance)");
console.log(`\n📅 2-week posting schedule included`);
console.log(`\n🎯 Total: 34 unique posts ready to go!`);
