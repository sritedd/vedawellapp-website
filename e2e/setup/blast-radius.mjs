/** Map which authenticated reads are broken by the v47 RLS recursion, as a real user. */
import { createClient } from "@supabase/supabase-js";
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadEnv() {
    const f = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8"); const e = {};
    for (const l of f.split("\n")) { const t = l.trim(); if (!t || t.startsWith("#")) continue; const i = t.indexOf("="); if (i > 0) e[t.slice(0, i).trim()] = t.slice(i + 1).trim(); }
    return e;
}
const env = loadEnv();
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: se } = await anon.auth.signInWithPassword({ email: "e2e-test@vedawellapp.com", password: "E2eTestPass!2026" });
if (se) { console.log("sign-in failed:", se.message); process.exit(1); }

const tables = ["projects", "project_members", "stages", "defects", "variations", "certifications",
    "inspections", "payments", "documents", "communication_log", "progress_photos",
    "weekly_checkins", "site_visits", "pre_handover_items", "contract_review_items",
    "builder_reviews", "materials", "profiles", "activity_log", "escalations", "allowances"];

let broken = 0, ok = 0;
for (const t of tables) {
    const { error } = await anon.from(t).select("id").limit(1);
    const rec = error && /infinite recursion/i.test(error.message);
    if (rec) { broken++; console.log(`  BROKEN  ${t.padEnd(22)} ${error.message}`); }
    else if (error) console.log(`  other   ${t.padEnd(22)} ${error.message}`);
    else { ok++; console.log(`  ok      ${t}`); }
}
console.log(`\n${broken} table(s) unreadable due to RLS recursion; ${ok} fine.`);
