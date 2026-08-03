/** Probe prod AI routes with real sessions and print actual status codes. */
import { createClient } from "@supabase/supabase-js";
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadEnv() {
    const f = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8"); const e = {};
    for (const l of f.split("\n")) { const t = l.trim(); if (!t || t.startsWith("#")) continue; const i = t.indexOf("="); if (i > 0) e[t.slice(0, i).trim()] = t.slice(i + 1).trim(); }
    return e;
}
const env = loadEnv();
const BASE = "https://vedawellapp.com";
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ref = SUPA_URL.replace("https://", "").split(".")[0];

async function sessionCookie(email, password) {
    const c = createClient(SUPA_URL, ANON);
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`${email}: ${error.message}`);
    // Supabase SSR cookie format used by @supabase/ssr
    const payload = { access_token: data.session.access_token, refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at, expires_in: data.session.expires_in,
        token_type: "bearer", user: data.session.user };
    const val = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64");
    return { cookie: `sb-${ref}-auth-token=${val}`, token: data.session.access_token };
}

async function hit(label, route, body, cookie) {
    try {
        const res = await fetch(`${BASE}${route}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
            body: JSON.stringify(body),
        });
        let txt = await res.text();
        let short = txt.slice(0, 110).replace(/\s+/g, " ");
        console.log(`  ${String(res.status).padEnd(4)} ${label.padEnd(46)} ${short}`);
        return res.status;
    } catch (e) {
        console.log(`  ERR  ${label.padEnd(46)} ${e.message}`);
    }
}

console.log("── Unauthenticated (expect 401) ──");
await hit("describe-defect", "/api/guardian/ai/describe-defect", { description: "crack in slab" }, null);

console.log("── PRO user ──");
const pro = await sessionCookie(process.env.E2E_PRO_EMAIL || "e2e-test@vedawellapp.com",
                               process.env.E2E_PRO_PASSWORD || "E2eTestPass!2026");
await hit("describe-defect (valid)", "/api/guardian/ai/describe-defect", { description: "Hairline crack approx 0.3mm in ground floor slab near the north wall" }, pro.cookie);
await hit("describe-defect (empty → expect 400)", "/api/guardian/ai/describe-defect", { description: "" }, pro.cookie);
await hit("stage-advice (bad state → expect 400)", "/api/guardian/ai/stage-advice", { stage: "slab", state: "XX" }, pro.cookie);
await hit("builder-check (expect 503 comingSoon)", "/api/guardian/ai/builder-check", { builderName: "Test Builder Pty Ltd", state: "NSW" }, pro.cookie);
await hit("chat (no projectId → expect 400)", "/api/guardian/ai/chat", { messages: [{ role: "user", content: "hi" }] }, pro.cookie);

console.log("── FREE user ──");
const free = await sessionCookie(process.env.E2E_FREE_EMAIL || "e2e-free@vedawellapp.com",
                                 process.env.E2E_FREE_PASSWORD || "E2eFreePass!2026");
await hit("describe-defect (free, allowed)", "/api/guardian/ai/describe-defect", { description: "Water stain spreading on bedroom ceiling below the ensuite" }, free.cookie);
await hit("stage-advice (free → expect 403)", "/api/guardian/ai/stage-advice", { stage: "slab", state: "NSW" }, free.cookie);
await hit("chat (free, bogus project)", "/api/guardian/ai/chat", { projectId: "00000000-0000-0000-0000-000000000000", messages: [{ role: "user", content: "hi" }] }, free.cookie);
