#!/usr/bin/env node
/**
 * Ask the LIVE database what is actually applied (guide/19 §6.2).
 *
 * The rule this enforces, from 2026-04-21: a migration is "applied" only when
 * the running database says so — never because a session wrote "please run
 * this" and someone replied "done". That exact mistake left the free-tier
 * defect cap unenforced for weeks while the notes claimed otherwise.
 *
 * Two modes, and it tells you which one it used:
 *
 *   FULL      a postgres connection string is available (DATABASE_URL, or
 *             NEXT_PUBLIC_SUPABASE_DATABASE_URL when Netlify's Supabase
 *             extension has set it to a postgres:// URL). Probes pg_catalog
 *             directly: functions, triggers, policies, tables, columns.
 *
 *   PARTIAL   only the HTTP API is reachable (the usual local case). Checks
 *             what PostgREST and the storage API can see — tables, columns,
 *             bucket privacy — and says plainly which checks it could NOT run,
 *             rather than reporting a pass it did not earn.
 *
 * Functions, triggers and policies are invisible over HTTP, so in PARTIAL mode
 * the behavioural probes are the answer:
 *   node e2e/setup/verify-write-limits.mjs     (v51 project cap, v52 uncapped evidence)
 *   node e2e/setup/verify-bucket-privacy.mjs   (v49 private buckets, end to end)
 *
 * Usage: node scripts/verify-migrations.mjs
 * Exit:  1 if anything expected is missing, or anything that should have been
 *        removed is still there. 0 in PARTIAL mode means "nothing I could check
 *        is wrong" — read the skipped list.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of fs.readFileSync(path.join(rootDir, ".env.local"), "utf-8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const pick = (k) => process.env[k] || env[k] || "";

const pgUrl = [pick("DATABASE_URL"), pick("SUPABASE_DB_URL"), pick("NEXT_PUBLIC_SUPABASE_DATABASE_URL")]
    .find((u) => u.startsWith("postgres"));

/** absent:true inverts the check — for migrations whose purpose is removal. */
const CHECKS = [
    { migration: "v40_member_access", kind: "table", name: "project_members" },
    { migration: "v41_variation_limit", kind: "trigger", name: "trg_enforce_free_variation_limit", absent: true, why: "dropped by v52 — the free tier no longer caps variations" },
    { migration: "v42_defect_limit", kind: "trigger", name: "trg_enforce_free_defect_limit", absent: true, why: "dropped by v52 — the free tier no longer caps defects" },
    // v44 adds "sequence_stage", not "nurture_stage" — the first draft of this check
    // guessed the name and reported v44 missing when it had been applied since July.
    // A probe is only as good as the object names in it: read the migration file,
    // do not recall it.
    { migration: "v44_lead_nurture", kind: "column", name: "email_subscribers.sequence_stage" },
    { migration: "v44_lead_nurture", kind: "column", name: "email_subscribers.unsubscribe_token" },
    { migration: "v45_lead_utm", kind: "column", name: "email_subscribers.utm_source" },
    { migration: "v46_migraine_logs", kind: "table", name: "migraine_logs", why: "backs cross-device sync for the migraine tracker; the tool works on localStorage without it" },
    { migration: "v47_rls_recursion_fix", kind: "function", name: "is_project_member" },
    { migration: "v47_rls_recursion_fix", kind: "function", name: "is_project_owner" },
    { migration: "v47_rls_recursion_fix", kind: "policy", name: "Members can view shared projects", table: "projects" },
    { migration: "v48_insert_policy_fix", kind: "policy", name: "Users can insert own project defects", table: "defects" },
    { migration: "v48_insert_policy_fix", kind: "policy", name: "Users can insert own project variations", table: "variations" },
    { migration: "v49_private_buckets", kind: "bucket_private", name: "evidence" },
    { migration: "v49_private_buckets", kind: "bucket_private", name: "documents" },
    { migration: "v49_private_buckets", kind: "bucket_private", name: "certificates" },
    { migration: "v51_project_limit_trigger", kind: "function", name: "enforce_free_project_limit" },
    { migration: "v51_project_limit_trigger", kind: "trigger", name: "trg_enforce_free_project_limit" },
];

const rows = [];
let missing = 0, lingering = 0, skipped = 0;
const record = (c, found) => {
    let status;
    if (c.absent) { status = found ? "STILL THERE" : "gone"; if (found) lingering++; }
    else { status = found ? "ok" : "MISSING"; if (!found) missing++; }
    rows.push({ ...c, status });
};

let mode;
if (pgUrl) {
    mode = "FULL";
    const pg = (await import("pg")).default;
    const client = new pg.Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const SQL = {
        table: "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname=$1 AND n.nspname='public' AND c.relkind='r'",
        function: "SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname=$1 AND n.nspname='public'",
        trigger: "SELECT 1 FROM pg_trigger WHERE tgname=$1 AND NOT tgisinternal",
        policy: "SELECT 1 FROM pg_policies WHERE policyname=$1 AND tablename=$2",
        bucket_private: "SELECT 1 FROM storage.buckets WHERE id=$1 AND public=false",
    };
    for (const c of CHECKS) {
        let found;
        if (c.kind === "column") {
            const [tbl, col] = c.name.split(".");
            found = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2", [tbl, col])).rowCount > 0;
        } else {
            found = (await client.query(SQL[c.kind], c.kind === "policy" ? [c.name, c.table] : [c.name])).rowCount > 0;
        }
        record(c, found);
    }
    await client.end();
} else {
    mode = "PARTIAL";
    const url = pick("NEXT_PUBLIC_SUPABASE_URL");
    const key = pick("SUPABASE_SECRET_KEY") || pick("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
        console.error("ERROR: need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local (or a postgres DATABASE_URL for the full probe).");
        process.exit(2);
    }
    const db = createClient(url, key, { auth: { persistSession: false } });

    for (const c of CHECKS) {
        if (c.kind === "table") {
            const { error } = await db.from(c.name).select("*", { head: true, count: "exact" }).limit(1);
            record(c, !error);
        } else if (c.kind === "column") {
            const [tbl, col] = c.name.split(".");
            const { error } = await db.from(tbl).select(col, { head: true }).limit(1);
            record(c, !error);
        } else if (c.kind === "bucket_private") {
            const { data, error } = await db.storage.getBucket(c.name);
            record(c, !error && data?.public === false);
        } else {
            skipped++;
            rows.push({ ...c, status: "not visible over HTTP" });
        }
    }
}

const width = Math.max(...rows.map((r) => r.migration.length));
let last = "";
for (const r of rows) {
    const mig = r.migration === last ? "".padEnd(width) : r.migration.padEnd(width);
    last = r.migration;
    const bad = r.status === "MISSING" || r.status === "STILL THERE";
    console.log(`${bad ? "!" : " "} ${mig}  ${r.status.padEnd(21)} ${r.kind} ${r.name}${r.table ? ` on ${r.table}` : ""}`);
    if (r.why && bad) console.log(`${" ".repeat(width + 4)}↳ ${r.why}`);
}

console.log(`\nmode ${mode} · ${rows.length} checks · ${missing} missing · ${lingering} should have been removed${skipped ? ` · ${skipped} not checkable over HTTP` : ""}`);
if (mode === "PARTIAL") {
    console.log("Functions, triggers and policies need a postgres connection. For those, run the behavioural probes:");
    console.log("  node e2e/setup/verify-write-limits.mjs     (v51 project cap, v52 uncapped evidence)");
    console.log("  node e2e/setup/verify-bucket-privacy.mjs   (v49 private buckets)");
}
if (missing || lingering) {
    console.log("\nRun the SQL files in supabase/ in the Supabase SQL editor, then re-run this.");
    console.log("Never mark a migration applied on the strength of an instruction — only on this output.");
    process.exit(1);
}
