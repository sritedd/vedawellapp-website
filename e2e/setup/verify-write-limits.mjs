/**
 * Post-v48 verification against PROD.
 *
 * Confirms, with real user sessions:
 *   1. defect + variation INSERT no longer recurse
 *   2. free-tier evidence capture is UNCAPPED (schema_v52 dropped the v41/v42
 *      triggers) while the 1-project cap (v51) still holds
 *   3. a user still cannot write into someone else's project
 *
 * Creates only `E2E …` rows and deletes everything it made.
 *   node e2e/setup/verify-write-limits.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const f = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8"); const e = {};
    for (const l of f.split("\n")) { const t = l.trim(); if (!t || t.startsWith("#")) continue; const i = t.indexOf("="); if (i > 0) e[t.slice(0, i).trim()] = t.slice(i + 1).trim(); }
    return e;
}
const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const { PRO, FREE } = await import("./credentials.mjs");

async function session(acct) {
    const c = createClient(URL, ANON);
    const { error } = await c.auth.signInWithPassword(acct);
    if (error) throw new Error(`${acct.email}: ${error.message}`);
    const { data: { user } } = await c.auth.getUser();
    return { c, uid: user.id };
}
const mkProject = (uid, name) => admin.from("projects").insert({
    user_id: uid, name, builder_name: "E2E Builder", contract_value: 500000,
    address: "1 Test St", start_date: "2026-04-01", status: "active",
    state: "NSW", build_category: "new_build",
}).select("id").single();

const defect = (pid, n) => ({ project_id: pid, title: `E2E defect ${n}`, description: "probe", severity: "minor", status: "open", stage: "Site Start" });
const variation = (pid, n) => ({ project_id: pid, title: `E2E variation ${n}`, description: "probe", additional_cost: 100, status: "draft" });

const tag = (e) => !e ? "OK" : (/infinite recursion/i.test(e.message) ? "RECURSION ❌" : (/FREE_TIER|row-level security/i.test(e.message) ? "blocked" : "ERR: " + e.message.slice(0, 60)));

console.log("── PRO user (no caps) ──");
const pro = await session(PRO);
const { data: pp } = await mkProject(pro.uid, "E2E WriteCheck Pro");
for (let i = 1; i <= 4; i++) {
    const { error } = await pro.c.from("defects").insert(defect(pp.id, i));
    console.log(`  defect ${i}: ${tag(error)}`);
}
const { error: pv } = await pro.c.from("variations").insert(variation(pp.id, 1));
console.log(`  variation 1: ${tag(pv)}`);

// schema_v52: evidence CAPTURE is free forever. An owner who could not log the
// defect has nothing to export later, so capping it cost the product the very
// moment that sells Pro. These inserts must now all succeed.
console.log("── FREE user (evidence capture is uncapped since v52) ──");
const free = await session(FREE);
await admin.from("projects").delete().eq("user_id", free.uid);
const { data: fp } = await mkProject(free.uid, "E2E WriteCheck Free");
for (let i = 1; i <= 5; i++) {
    const { error } = await free.c.from("defects").insert(defect(fp.id, i));
    console.log(`  defect ${i}: ${tag(error)}${error ? "   <- MUST NOT be blocked (v52)" : ""}`);
    if (error) process.exitCode = 1;
}
for (let i = 1; i <= 4; i++) {
    const { error } = await free.c.from("variations").insert(variation(fp.id, i));
    console.log(`  variation ${i}: ${tag(error)}${error ? "   <- MUST NOT be blocked (v52)" : ""}`);
    if (error) process.exitCode = 1;
}

console.log("── FREE user project cap (1) ──");
// Start from zero so the cap is exercised from a known state.
await admin.from("projects").delete().eq("user_id", free.uid);
const mkAsUser = (uid, name) => free.c.from("projects").insert({
    user_id: uid, name, builder_name: "E2E Builder", contract_value: 400000,
    address: "1 Test St", start_date: "2026-04-01", status: "active",
    state: "NSW", build_category: "new_build",
});
const { error: p1 } = await mkAsUser(free.uid, "E2E WriteCheck FreeProj 1");
console.log(`  project 1: ${tag(p1)}`);
const { error: p2 } = await mkAsUser(free.uid, "E2E WriteCheck FreeProj 2");
console.log(`  project 2: ${tag(p2)}   <- MUST be blocked (v51)`);
if (!p2) process.exitCode = 1;

console.log("── Cross-tenant isolation ──");
const { error: xt } = await free.c.from("defects").insert(defect(pp.id, "intruder"));
console.log(`  free user writes into PRO's project: ${xt ? "blocked ✅" : "ALLOWED ❌ SECURITY HOLE"}`);
// A user must not be able to create a project OWNED BY someone else.
const { error: xp } = await mkAsUser(pro.uid, "E2E WriteCheck Impersonated");
console.log(`  free user creates project owned by PRO: ${xp ? "blocked ✅" : "ALLOWED ❌ SECURITY HOLE"}`);

await admin.from("projects").delete().in("id", [pp.id, fp.id]);
await admin.from("projects").delete().like("name", "E2E WriteCheck%");
const { data: left } = await admin.from("projects").select("id").like("name", "E2E WriteCheck%");
console.log(`\ncleanup: ${left?.length ? "LEFTOVERS " + left.length : "clean ✅"}`);
