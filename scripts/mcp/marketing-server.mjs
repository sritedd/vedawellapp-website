#!/usr/bin/env node
/**
 * VedaWell Marketing MCP Server
 *
 * Exposes HomeGuardian's marketing operations as MCP tools so any MCP client
 * (Claude Code, Claude Desktop, custom agents) can run the marketing engine
 * conversationally:
 *
 *   - marketing_stats        → funnel + revenue + engagement numbers (Supabase)
 *   - social_queue_status    → what's posted / unposted per platform
 *   - post_social            → post next item (or a specific one) to a platform
 *   - generate_post          → AI-draft a new social post for a topic (Gemini)
 *   - add_post_to_library    → append a post to the rotation library
 *   - ping_search_engines    → IndexNow + sitemap pings (SEO reach)
 *   - lead_attribution       → /red-flags signups by utm_source / campaign
 *
 * Design: thin wrapper. Posting shells out to the existing battle-tested
 * scripts (auto-post-social.mjs) so there is exactly ONE posting code path.
 * Stats query Supabase REST directly with the service-role key.
 *
 * Env (read from process.env — set in .env or the MCP client config):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   — stats
 *   BLUESKY_HANDLE, BLUESKY_APP_PASSWORD                  — Bluesky posting
 *   FACEBOOK_PAGE_TOKEN, FACEBOOK_PAGE_ID                 — Facebook posting
 *   GOOGLE_AI_API_KEY (or GEMINI_API_KEY)                 — content generation
 *
 * Run standalone:  node scripts/mcp/marketing-server.mjs
 * Wire into Claude Code via .mcp.json (see "vedawell-marketing" entry).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, "..");
const POSTS_FILE = join(SCRIPTS_DIR, "social-posts.json");
const HISTORY_FILE = join(SCRIPTS_DIR, ".social-post-history.json");
const SITE = "https://vedawellapp.com";

// ── Supabase REST helpers ─────────────────────────────────────────────

function supabaseHeaders() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
    return {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
    };
}

function supabaseUrl(path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
    return `${base.replace(/\/$/, "")}/rest/v1/${path}`;
}

/** Exact count of rows matching a PostgREST filter string. */
async function countRows(table, filter = "") {
    const url = supabaseUrl(`${table}?select=*${filter ? `&${filter}` : ""}`);
    const res = await fetch(url, {
        method: "HEAD",
        headers: { ...supabaseHeaders(), Prefer: "count=exact" },
    });
    if (!res.ok) throw new Error(`${table} count failed: HTTP ${res.status}`);
    const range = res.headers.get("content-range") || "";
    const total = range.split("/")[1];
    return total === "*" ? 0 : parseInt(total || "0", 10);
}

async function selectRows(table, query) {
    const res = await fetch(supabaseUrl(`${table}?${query}`), { headers: supabaseHeaders() });
    if (!res.ok) throw new Error(`${table} select failed: HTTP ${res.status}`);
    return res.json();
}

// ── Gemini helper ─────────────────────────────────────────────────────

async function geminiGenerate(prompt) {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key set (GOOGLE_AI_API_KEY / GEMINI_API_KEY)");
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── Shell-out helper (single posting code path) ───────────────────────

async function runScript(scriptName, args = []) {
    const scriptPath = join(SCRIPTS_DIR, scriptName);
    if (!existsSync(scriptPath)) throw new Error(`Script not found: ${scriptName}`);
    try {
        const { stdout, stderr } = await execFileAsync("node", [scriptPath, ...args], {
            env: process.env,
            timeout: 120_000,
            cwd: join(SCRIPTS_DIR, ".."),
        });
        return `${stdout}${stderr ? `\n[stderr] ${stderr}` : ""}`.trim();
    } catch (e) {
        // execFile throws on non-zero exit — surface the output, it has the reason
        const out = `${e.stdout || ""}${e.stderr || ""}`.trim();
        throw new Error(out || e.message);
    }
}

// ── Server + tools ────────────────────────────────────────────────────

const server = new McpServer({
    name: "vedawell-marketing",
    version: "1.0.0",
});

server.registerTool(
    "marketing_stats",
    {
        title: "Marketing & business stats",
        description:
            "Funnel + revenue + engagement numbers from the production database: tier counts (free/trial/pro), MRR estimate, signups last 7/30 days, PDF lead-magnet totals, project/defect counts. The same data as /api/admin/business-stats but fetched directly.",
        inputSchema: {},
    },
    async () => {
        const now = Date.now();
        const day7 = new Date(now - 7 * 86400e3).toISOString();
        const day30 = new Date(now - 30 * 86400e3).toISOString();
        const nowIso = new Date(now).toISOString();

        const [free, trial, pro, total, new7, new30, trialActive,
            pdfTotal, pdf30, projects, defects] = await Promise.all([
            countRows("profiles", "subscription_tier=eq.free"),
            countRows("profiles", "subscription_tier=eq.trial"),
            countRows("profiles", "subscription_tier=eq.guardian_pro"),
            countRows("profiles"),
            countRows("profiles", `created_at=gte.${day7}`),
            countRows("profiles", `created_at=gte.${day30}`),
            countRows("profiles", `subscription_tier=eq.trial&trial_ends_at=gte.${nowIso}`),
            countRows("email_subscribers", "source=eq.red-flags-pdf"),
            countRows("email_subscribers", `source=eq.red-flags-pdf&created_at=gte.${day30}`),
            countRows("projects"),
            countRows("defects"),
        ]);

        const stats = {
            revenue: { pro_count: pro, mrr_estimate_aud: +(pro * 14.99).toFixed(2) },
            tiers: { free, trial_total: trial, trial_active: trialActive, guardian_pro: pro },
            users: { total, new_signups_last_7d: new7, new_signups_last_30d: new30 },
            lead_magnet: { pdf_signups_total: pdfTotal, pdf_signups_last_30d: pdf30 },
            engagement: { projects, defects },
            note: "Stripe is the ledger of truth for revenue; this reflects the app DB.",
        };
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }
);

server.registerTool(
    "lead_attribution",
    {
        title: "Lead attribution by channel",
        description:
            "PDF lead-magnet signups grouped by utm_source and utm_campaign over the last N days. Tells you which marketing channel is actually delivering signups so you can double down on winners.",
        inputSchema: { days: z.number().int().min(1).max(365).default(30).describe("Lookback window in days") },
    },
    async ({ days }) => {
        const cutoff = new Date(Date.now() - days * 86400e3).toISOString();
        const rows = await selectRows(
            "email_subscribers",
            `select=utm_source,utm_campaign,created_at&source=eq.red-flags-pdf&created_at=gte.${cutoff}`
        );
        const bySource = {};
        const byCampaign = {};
        for (const r of rows) {
            const s = r.utm_source || "(direct/organic)";
            bySource[s] = (bySource[s] || 0) + 1;
            if (r.utm_campaign) byCampaign[r.utm_campaign] = (byCampaign[r.utm_campaign] || 0) + 1;
        }
        return {
            content: [{
                type: "text",
                text: JSON.stringify({ window_days: days, total: rows.length, by_source: bySource, by_campaign: byCampaign }, null, 2),
            }],
        };
    }
);

server.registerTool(
    "social_queue_status",
    {
        title: "Social posting queue status",
        description:
            "Shows the post library size and which posts have already gone out per platform (bluesky / facebook / linkedin). Use before posting to see what's next in rotation.",
        inputSchema: {},
    },
    async () => {
        const posts = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
        const history = existsSync(HISTORY_FILE) ? JSON.parse(readFileSync(HISTORY_FILE, "utf8")) : {};
        const platforms = ["bluesky", "facebook", "linkedin"];
        const status = {
            library_size: posts.length,
            posts: posts.map((p, i) => ({ index: i, id: p.id })),
            per_platform: Object.fromEntries(platforms.map((pl) => {
                const posted = history[pl] || [];
                return [pl, { posted_count: posted.length, posted_indexes: posted, next_index: posts.findIndex((_, i) => !posted.includes(i)) }];
            })),
        };
        return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
    }
);

server.registerTool(
    "post_social",
    {
        title: "Post to a social platform",
        description:
            "Posts the next unposted item from the library to the given platform via the unified auto-poster (Bluesky free API, Facebook Graph API). Use dry_run=true to preview what would be posted without sending. Requires platform credentials in env.",
        inputSchema: {
            platform: z.enum(["bluesky", "facebook", "linkedin", "all"]).describe("Target platform"),
            dry_run: z.boolean().default(false).describe("Preview without posting"),
        },
    },
    async ({ platform, dry_run }) => {
        const args = [];
        if (platform !== "all") args.push("--platform", platform);
        if (dry_run) args.push("--dry-run");
        const output = await runScript("auto-post-social.mjs", args);
        return { content: [{ type: "text", text: output || "(no output)" }] };
    }
);

server.registerTool(
    "generate_post",
    {
        title: "AI-generate a social post",
        description:
            "Drafts a new social post (Bluesky ≤300 chars + Facebook longer variant) for a given topic using Gemini, in HomeGuardian's voice: helpful-first, dodgy-builder-awareness, Australian homeowner audience. Returns JSON ready for add_post_to_library. Does NOT post or save anything.",
        inputSchema: {
            topic: z.string().min(5).max(300).describe("Topic, e.g. 'red flag #6: concrete poured before footing inspection'"),
            cta_path: z.string().default("/red-flags").describe("Site path the post should link to, e.g. /red-flags or /guardian"),
        },
    },
    async ({ topic, cta_path }) => {
        const prompt = `You write social posts for HomeGuardian (vedawellapp.com), an Australian homeowner construction-monitoring app. Voice: calm, helpful-first, protective; never insult builders broadly — only the dodgy minority. Audience: Australians currently building a home.

Topic: ${topic}
Link to include: ${SITE}${cta_path}

Return STRICT JSON only (no markdown fences) with this shape:
{
  "id": "kebab-case-slug",
  "bluesky": "post text ≤290 chars including the link",
  "facebook": "longer post 3-6 short paragraphs, ends with the link",
  "hashtags": ["#NewBuildAustralia", "..."]
}`;
        const raw = await geminiGenerate(prompt);
        const cleaned = raw.replace(/^```(json)?/m, "").replace(/```\s*$/m, "").trim();
        // Validate it parses; return prettified
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            return { content: [{ type: "text", text: `Gemini returned non-JSON; raw output:\n${raw}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }] };
    }
);

server.registerTool(
    "add_post_to_library",
    {
        title: "Add a post to the rotation library",
        description:
            "Appends a post object to scripts/social-posts.json so the daily auto-posters pick it up. Pass the JSON from generate_post (optionally edited). The id must be unique.",
        inputSchema: {
            id: z.string().min(3).describe("Unique kebab-case id"),
            bluesky: z.string().min(10).max(300).describe("Bluesky text (≤300 chars)"),
            facebook: z.string().min(10).describe("Facebook text"),
            link_path: z.string().default("/red-flags").describe("Site path for UTM-tagged link"),
        },
    },
    async ({ id, bluesky, facebook, link_path }) => {
        const posts = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
        if (posts.some((p) => p.id === id)) {
            return { content: [{ type: "text", text: `A post with id "${id}" already exists. Choose a different id.` }], isError: true };
        }
        // Mirror the shape of existing entries (best-effort: keep core keys)
        posts.push({ id, link: link_path, bluesky, facebook });
        writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 4) + "\n", "utf8");
        return { content: [{ type: "text", text: `Added "${id}". Library now has ${posts.length} posts. Commit scripts/social-posts.json to persist for CI posters.` }] };
    }
);

server.registerTool(
    "ping_search_engines",
    {
        title: "Ping search engines (SEO reach)",
        description:
            "Runs the reach-submission script: IndexNow (Bing/Yandex/Naver/Seznam), Google + Bing sitemap pings, Wayback Machine archiving of priority pages. Run after publishing new content.",
        inputSchema: {},
    },
    async () => {
        const output = await runScript("submit-reach.mjs");
        return { content: [{ type: "text", text: output || "(no output)" }] };
    }
);

// ── Boot ──────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[vedawell-marketing] MCP server running on stdio");
