#!/usr/bin/env node
/**
 * Government-link checker (guide/19 §4.5, B-14).
 *
 * Every state rule Guardian shows links to a government page, and those pages
 * move: on 2026-09-09 every licence-register link in the product was dead or
 * wrong, and nothing had noticed for months. This script pulls every gov.au URL
 * out of the workflow JSON and the guardian source, fetches each with a browser
 * user-agent, and reports:
 *
 *   FAIL  404 / DNS / connection errors — the link is dead for a real user too
 *   WARN  403 — the site blocks scripts; verify in a real browser
 *   NOTE  a redirect to a different path — usually a restructure in progress
 *
 * Exit code 1 on any FAIL, so the monthly workflow turns red. Run locally:
 *   node scripts/check-gov-links.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const TIMEOUT_MS = 15_000;

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== ".next") walk(p, out); }
        else if (/\.(ts|tsx|json)$/.test(e.name)) out.push(p);
    }
    return out;
}

const files = [
    ...walk(path.join(ROOT, "src", "components", "guardian")),
    ...walk(path.join(ROOT, "src", "lib", "guardian")),
    ...walk(path.join(ROOT, "src", "app", "guardian")),
    ...walk(path.join(ROOT, "src", "data")),
];

const urls = new Map(); // url -> first file seen
for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    for (const m of text.matchAll(/https?:\/\/[a-zA-Z0-9.-]*\.gov\.au[a-zA-Z0-9./_%#?=&-]*/g)) {
        const u = m[0].replace(/[.,)'"`]+$/, "");
        if (!urls.has(u)) urls.set(u, path.relative(ROOT, f));
    }
}

async function check(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: ctrl.signal });
        const finalUrl = res.url || url;
        const samePath = finalUrl.replace(/\/$/, "") === url.replace(/\/$/, "");
        if (res.status === 404 || res.status === 410) return { level: "FAIL", status: res.status, finalUrl };
        if (res.status === 403) return { level: "WARN", status: res.status, finalUrl };
        if (res.status >= 500) return { level: "FAIL", status: res.status, finalUrl };
        if (!samePath) return { level: "NOTE", status: res.status, finalUrl };
        return { level: "OK", status: res.status, finalUrl };
    } catch (e) {
        return { level: "FAIL", status: 0, finalUrl: url, error: e.name === "AbortError" ? "timeout" : (e.cause?.code || e.message) };
    } finally {
        clearTimeout(t);
    }
}

const results = [];
const list = [...urls.keys()];
// Modest concurrency: government sites rate-limit, and we want honest answers.
const CONCURRENCY = 4;
let i = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < list.length) {
        const url = list[i++];
        const r = await check(url);
        results.push({ url, file: urls.get(url), ...r });
    }
}));

results.sort((a, b) => a.level.localeCompare(b.level) || a.url.localeCompare(b.url));
const counts = { FAIL: 0, WARN: 0, NOTE: 0, OK: 0 };
for (const r of results) {
    counts[r.level]++;
    if (r.level === "OK") continue;
    const extra = r.level === "NOTE" ? `-> ${r.finalUrl}` : (r.error ? `(${r.error})` : "");
    console.log(`${r.level.padEnd(4)} ${String(r.status).padStart(3)}  ${r.url}  ${extra}\n      in ${r.file}`);
}
console.log(`\n${list.length} gov.au links: ${counts.OK} ok · ${counts.NOTE} redirected · ${counts.WARN} need a browser · ${counts.FAIL} dead`);
if (counts.FAIL > 0) {
    console.log("\nDead links reach real homeowners. Fix them in the single map (calculations.ts) or the workflow JSON, and re-run.");
    process.exit(1);
}
