#!/usr/bin/env node
/**
 * Generate social media content for Twitter, Reddit, LinkedIn, and Hacker News.
 * Run: node scripts/generate-social-posts.mjs
 *
 * Output: scripts/social-posts.md — ready-to-copy posts for each platform.
 */

import { writeFileSync } from "fs";

const SITE = "https://vedawellapp.com";

const TOOLS_TO_PROMOTE = [
    { slug: "password-generator", name: "Password Generator", hook: "Generate unbreakable passwords", category: "security" },
    { slug: "json-formatter", name: "JSON Formatter", hook: "Format, validate & minify JSON instantly", category: "dev" },
    { slug: "pdf-merge", name: "PDF Merge", hook: "Merge PDFs in your browser — no upload", category: "productivity" },
    { slug: "image-compressor", name: "Image Compressor", hook: "Compress images 80% without quality loss", category: "design" },
    { slug: "qr-code-generator", name: "QR Code Generator", hook: "Create QR codes for URLs, WiFi, contacts", category: "marketing" },
    { slug: "regex-tester", name: "Regex Tester", hook: "Build & test regex with live matching", category: "dev" },
    { slug: "pomodoro-timer", name: "Pomodoro Timer", hook: "25-minute focus sprints for deep work", category: "productivity" },
    { slug: "meta-tag-generator", name: "Meta Tag Generator", hook: "Generate SEO meta tags in seconds", category: "seo" },
    { slug: "pdf-to-word", name: "PDF to Word", hook: "Convert PDFs to editable Word docs", category: "productivity" },
    { slug: "markdown-editor", name: "Markdown Editor", hook: "Write Markdown with live preview", category: "dev" },
];

const BLOG_POSTS_TO_PROMOTE = [
    { slug: "best-free-online-tools-2026", title: "25 Best Free Online Tools You Need in 2026" },
    { slug: "free-pdf-tools-online", title: "Best Free PDF Tools Online — No Upload Required" },
    { slug: "password-security-guide", title: "How to Create Unbreakable Passwords" },
    { slug: "free-browser-games-no-download", title: "19 Free Browser Games — No Download" },
    { slug: "regex-cheat-sheet", title: "The Only Regex Cheat Sheet You Need" },
];

let output = "# VedaWell Social Media Posts\n";
output += `Generated: ${new Date().toISOString().split("T")[0]}\n\n`;
output += "Copy-paste these posts to each platform. Rotate 2-3 posts per week.\n\n";

// === TWITTER / X ===
output += "---\n## Twitter / X\n\n";
for (const tool of TOOLS_TO_PROMOTE) {
    output += `### ${tool.name}\n`;
    output += `${tool.hook} — 100% free, runs in your browser, no signup.\n\n`;
    output += `Your data never leaves your device. 🔒\n\n`;
    output += `${SITE}/tools/${tool.slug}\n\n`;
    output += `#FreeTools #${tool.category === "dev" ? "WebDev" : tool.category === "seo" ? "SEO" : tool.category === "security" ? "CyberSecurity" : "Productivity"} #NoSignup\n\n`;
}
for (const post of BLOG_POSTS_TO_PROMOTE) {
    output += `### Blog: ${post.title}\n`;
    output += `${post.title}\n\n`;
    output += `${SITE}/blog/${post.slug}\n\n`;
}

// === REDDIT ===
output += "---\n## Reddit\n\n";
output += "Post to: r/webdev, r/programming, r/InternetIsBeautiful, r/SideProject, r/productivity, r/gamedev\n\n";

output += "### r/InternetIsBeautiful\n";
output += `**Title:** I built 90+ free browser tools (PDF, image, dev, SEO) — all run locally, no uploads\n\n`;
output += `**Body:**\nHey! I've been building a collection of free browser-based tools at ${SITE}\n\n`;
output += `Every tool runs 100% client-side — your files never leave your device. No accounts, no uploads, no tracking.\n\n`;
output += `Some popular ones:\n- PDF Merge/Split/Compress\n- Image Compressor (batch processing)\n- JSON Formatter & Validator\n- Password Generator\n- QR Code Generator\n- Regex Tester with cheat sheet\n\n`;
output += `Plus 19 free browser games (Chess, Sudoku, Tetris, etc.)\n\n`;
output += `Would love feedback on what tools to add next!\n\n`;

output += "### r/webdev\n";
output += `**Title:** Free dev toolkit — JSON formatter, regex tester, meta tag generator, and 90+ more tools (all client-side)\n\n`;
output += `**Body:**\nBuilt a collection of developer tools that run entirely in your browser:\n\n`;
output += `- JSON Formatter & Validator\n- Regex Tester with live matching\n- UUID Generator\n- Unix Timestamp Converter\n- Base64 Encoder/Decoder\n- Meta Tag & Open Graph Generator\n- Schema Markup Generator\n\n`;
output += `Everything is free, no signup, client-side processing. Built with Next.js + TypeScript.\n\n`;
output += `${SITE}/tools\n\n`;

output += "### r/SideProject\n";
output += `**Title:** VedaWell — 90+ free browser tools + 19 games, all running client-side\n\n`;
output += `**Body:**\nHey r/SideProject! I've been working on VedaWell (${SITE}) — a collection of 90+ free online tools and 19 browser games.\n\n`;
output += `Tech stack: Next.js 16, TypeScript, Tailwind CSS, Supabase, deployed on Netlify.\n\n`;
output += `The key differentiator: everything runs in your browser. PDFs, images, passwords — nothing gets uploaded to a server.\n\n`;
output += `Revenue model: Google AdSense + optional Pro subscription ($14.99/mo for ad-free).\n\n`;
output += `Feedback welcome!\n\n`;

// === LINKEDIN ===
output += "---\n## LinkedIn\n\n";
output += `I just shipped 90+ free browser-based tools at ${SITE}\n\n`;
output += `Every tool runs 100% in your browser — your data never touches a server.\n\n`;
output += `Some highlights:\n`;
output += `→ PDF Merge, Split, Compress — no file size limits\n`;
output += `→ Image Compressor — batch process 50+ images\n`;
output += `→ QR Code Generator — URLs, WiFi, contacts\n`;
output += `→ SEO tools — meta tags, schema markup, SERP preview\n`;
output += `→ Developer tools — JSON formatter, regex tester, UUID generator\n\n`;
output += `Plus 19 free browser games for productive breaks.\n\n`;
output += `All free. No signup. No downloads. Privacy-first.\n\n`;
output += `Check it out: ${SITE}\n\n`;
output += `#FreeTools #WebDev #Productivity #SideProject\n\n`;

// === HACKER NEWS ===
output += "---\n## Hacker News (Show HN)\n\n";
output += `**Title:** Show HN: VedaWell — 90+ free browser tools, all processing done client-side\n\n`;
output += `**URL:** ${SITE}\n\n`;
output += `**Comment:**\nHi HN! I built VedaWell — a collection of 90+ free tools that run entirely in your browser.\n\n`;
output += `The philosophy: your data should never leave your device. PDFs are processed with PDF.js/WebAssembly, images with Canvas API, passwords with crypto.getRandomValues().\n\n`;
output += `Tech: Next.js 16 (App Router), TypeScript, Tailwind CSS, deployed on Netlify.\n\n`;
output += `No accounts required. No tracking of file contents. Free forever with optional ad-free Pro tier.\n\n`;
output += `I'd love to hear what tools you'd find useful. What am I missing?\n\n`;

// === PRODUCT HUNT ===
output += "---\n## Product Hunt\n\n";
output += `**Tagline:** 90+ free browser tools — PDF, image, dev & SEO tools that never upload your data\n\n`;
output += `**Description:**\nVedaWell is a collection of 90+ free online tools that run 100% in your browser.\n\n`;
output += `Unlike most online tools that upload your files to their servers, VedaWell processes everything locally using WebAssembly and browser APIs. Your data never leaves your device.\n\n`;
output += `Categories: PDF tools, image tools, developer tools, SEO tools, calculators, text tools, and 19 browser games.\n\n`;
output += `Free forever. No signup required.\n\n`;

const outputPath = new URL("./social-posts.md", import.meta.url).pathname;
// Windows path fix
const cleanPath = outputPath.startsWith("/") && outputPath[2] === ":" ? outputPath.slice(1) : outputPath;
writeFileSync(cleanPath, output);
console.log(`Generated social posts at: ${cleanPath}`);
console.log("\nPlatforms covered:");
console.log("  - Twitter/X (10 tool posts + 5 blog posts)");
console.log("  - Reddit (r/InternetIsBeautiful, r/webdev, r/SideProject)");
console.log("  - LinkedIn (1 long post)");
console.log("  - Hacker News (Show HN)");
console.log("  - Product Hunt (launch copy)");
