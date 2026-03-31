#!/usr/bin/env node
/**
 * AI-Powered Social Post Generator
 *
 * Uses Google Gemini (free tier) to generate fresh, timely social media content
 * based on seasonal topics, trending construction issues, and app features.
 *
 * Usage:
 *   node scripts/generate-ai-posts.mjs                     # Generate and append to social-posts.json
 *   node scripts/generate-ai-posts.mjs --topic "summer"     # Generate for a specific topic
 *   node scripts/generate-ai-posts.mjs --preview            # Preview without saving
 *
 * Requires: GOOGLE_AI_API_KEY or GEMINI_API_KEY env var
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const POSTS_FILE = join(__dirname, "social-posts.json");
const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
    console.error("❌ No Gemini API key found. Set GOOGLE_AI_API_KEY in .env.local");
    process.exit(1);
}

const args = process.argv.slice(2);
const isPreview = args.includes("--preview");
const topicArg = (() => { const i = args.indexOf("--topic"); return i !== -1 ? args[i + 1] : null; })();

// ── Seasonal & Topical Content Ideas ──────────────────────────────
const SEASONAL_TOPICS = {
    // Australian seasons (opposite to Northern Hemisphere)
    summer: [
        "Concrete curing in extreme heat — risks of cracking and how to check",
        "Bushfire-rated construction — BAL ratings explained for homeowners",
        "Summer storms and waterproofing — what to inspect before the wet season",
    ],
    autumn: [
        "Pre-winter checklist — what to inspect before the cold months",
        "Drainage and guttering — common defects that cause flooding",
        "End of year builder handovers — rushed work before Christmas",
    ],
    winter: [
        "Wet weather construction delays — your rights and what to document",
        "Mould risks in new builds — what causes it and how to prevent it",
        "Insulation compliance — how to check your builder isn't cutting corners",
    ],
    spring: [
        "Building season is starting — what new homeowners need to know",
        "Foundation inspection checklist for the spring build rush",
        "Choosing a builder in peak season — red flags to watch for",
    ],
};

// Evergreen topics that work any time
const EVERGREEN_TOPICS = [
    "Progress payments — when to pay and when to hold",
    "The difference between cosmetic and structural defects",
    "How to read your building contract like a lawyer",
    "What happens when your builder goes bankrupt mid-build",
    "Home warranty insurance — what it actually covers (and doesn't)",
    "The top 3 mistakes first-time builders make",
    "Why you need an independent building inspector (not the council one)",
    "Practical completion vs final completion — know the difference",
    "How to negotiate variations without destroying the builder relationship",
    "What the NCC says about minimum ceiling heights, ventilation, and wet areas",
];

function getCurrentSeason() {
    const month = new Date().getMonth(); // 0-11
    // Australian seasons
    if (month >= 11 || month <= 1) return "summer";
    if (month >= 2 && month <= 4) return "autumn";
    if (month >= 5 && month <= 7) return "winter";
    return "spring";
}

// ── Gemini API ────────────────────────────────────────────────────
async function generateWithGemini(prompt) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 4000 },
            }),
        }
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── Generate Posts ────────────────────────────────────────────────
async function generatePosts() {
    const season = topicArg || getCurrentSeason();
    const seasonTopics = SEASONAL_TOPICS[season] || [];
    const topics = [...seasonTopics, ...EVERGREEN_TOPICS.sort(() => Math.random() - 0.5).slice(0, 2)];

    // Pick 2 topics to generate posts for
    const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 2);

    console.log(`\n🤖 AI Content Generator (Gemini)`);
    console.log(`   Season: ${season}`);
    console.log(`   Topics: ${selectedTopics.join(", ")}\n`);

    const newPosts = [];

    for (const topic of selectedTopics) {
        console.log(`📝 Generating: "${topic}"...`);

        const prompt = `You are a social media copywriter for HomeOwner Guardian (vedawellapp.com/guardian), an Australian construction monitoring app for homeowners building new homes ($14.99/mo).

Topic: "${topic}"

Generate social media posts for 4 platforms. Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
    "id": "kebab-case-topic-id",
    "label": "Short Label (3-5 words)",
    "blog": "/guardian",
    "platforms": {
        "bluesky": "Post text (max 300 chars). Include {{link}} where the URL should go. Use 1-2 emojis. Punchy, direct.",
        "facebook": "Longer post (300-600 chars). Hook + value + CTA. Include {{link}}. Use emojis, hashtags. Australian spelling.",
        "instagram": "CAPS HEADLINE first line. Then body with emoji bullets. End with 'Link in bio → vedawellapp.com/guardian' and 8 hashtags. Include #HomeBuilding #AustralianProperty.",
        "linkedin": "Professional tone. Problem → insight → solution. Include {{link}}. 4 hashtags max. Include #PropTech #HomeBuilding."
    }
}

Rules:
- Australian English (colour, defence, licence)
- Reference real standards: NCC 2025, AS 2870, AS 1684, AS 3740
- Specific dollar amounts for defect costs (realistic AU ranges)
- Never use "click here" — use action CTAs like "Try it free", "Protect your build"
- Make it emotionally compelling — homeowners are stressed and spending $400K-$1M+
- Facebook and Bluesky must include {{link}} placeholder
- Instagram should say "Link in bio → vedawellapp.com/guardian" instead of {{link}}`;

        try {
            const raw = await generateWithGemini(prompt);
            // Clean any markdown code fences
            const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            const post = JSON.parse(cleaned);

            // Validate structure
            if (post.id && post.platforms?.bluesky && post.platforms?.facebook) {
                // Prefix with "ai-" to distinguish from manual posts
                post.id = `ai-${post.id}`;
                newPosts.push(post);
                console.log(`   ✅ Generated: "${post.label}"`);
            } else {
                console.log(`   ⚠️  Invalid structure, skipping`);
            }
        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    if (newPosts.length === 0) {
        console.log("\n⚠️  No posts generated.");
        return;
    }

    if (isPreview) {
        console.log("\n🔍 Preview (not saved):\n");
        for (const p of newPosts) {
            console.log(`--- ${p.label} (${p.id}) ---`);
            for (const [platform, text] of Object.entries(p.platforms)) {
                console.log(`\n[${platform}]`);
                console.log(text);
            }
            console.log();
        }
        return;
    }

    // Append to social-posts.json
    const existing = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
    // Deduplicate by ID
    const existingIds = new Set(existing.map(p => p.id));
    const toAdd = newPosts.filter(p => !existingIds.has(p.id));

    if (toAdd.length === 0) {
        console.log("\n⚠️  All generated posts already exist in library.");
        return;
    }

    existing.push(...toAdd);
    writeFileSync(POSTS_FILE, JSON.stringify(existing, null, 4));
    console.log(`\n✅ Added ${toAdd.length} new posts to social-posts.json (total: ${existing.length})`);
}

generatePosts().catch(err => { console.error("❌ Fatal:", err.message); process.exit(1); });
