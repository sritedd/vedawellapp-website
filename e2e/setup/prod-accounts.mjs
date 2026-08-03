/**
 * Prod E2E account provisioning (playbook 17 §2).
 *
 * Ensures the three accounts the prod run needs, then prints a status table.
 * Idempotent — safe to re-run.
 *
 *   node e2e/setup/prod-accounts.mjs           # provision + status
 *   node e2e/setup/prod-accounts.mjs --admin   # also set is_admin=true on the pro user
 *   node e2e/setup/prod-accounts.mjs --revoke  # revert is_admin (teardown)
 *   node e2e/setup/prod-accounts.mjs --status  # read-only
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envFile = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
    const env = {};
    for (const line of envFile.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return env;
}

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// SECURITY: these accounts live on PRODUCTION and this repo is PUBLIC.
// The defaults below match the long-committed value in supabase-seed.ts, so
// existing runs keep working — but they are effectively public credentials.
// Override via env (and rotate the real passwords) before relying on these:
//   E2E_PRO_PASSWORD=... E2E_FREE_PASSWORD=... node e2e/setup/prod-accounts.mjs
// See playbook 17 §8.5 (P1-2).
export const PRO = {
    email: process.env.E2E_PRO_EMAIL || "e2e-test@vedawellapp.com",
    password: process.env.E2E_PRO_PASSWORD || "E2eTestPass!2026",
    tier: "guardian_pro",
};
export const FREE = {
    email: process.env.E2E_FREE_EMAIL || "e2e-free@vedawellapp.com",
    password: process.env.E2E_FREE_PASSWORD || "E2eFreePass!2026",
    tier: "free",
};

async function findUser(email) {
    // listUsers is paginated; page through until found
    for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(`listUsers failed: ${error.message}`);
        const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (hit) return hit;
        if (data.users.length < 200) return null;
    }
    return null;
}

async function ensureAccount({ email, password, tier }) {
    let user = await findUser(email);
    if (!user) {
        const { data, error } = await admin.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name: `E2E ${tier} User` },
        });
        if (error) throw new Error(`createUser ${email}: ${error.message}`);
        user = data.user;
    } else {
        // Force the known password so the browser login can't drift
        const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
        if (error) throw new Error(`updateUser ${email}: ${error.message}`);
    }

    const { error: profErr } = await admin.from("profiles").upsert({
        id: user.id, email, full_name: `E2E ${tier} User`, role: "homeowner", subscription_tier: tier,
    }, { onConflict: "id" });
    if (profErr) throw new Error(`profile upsert ${email}: ${profErr.message}`);

    return user.id;
}

async function setAdmin(userId, value) {
    const { error } = await admin.from("profiles").update({ is_admin: value }).eq("id", userId);
    if (error) throw new Error(`is_admin=${value}: ${error.message}`);
}

async function status(label, email) {
    const user = await findUser(email);
    if (!user) return console.log(`  ${label.padEnd(6)} ${email.padEnd(30)} MISSING`);
    const { data: p } = await admin.from("profiles")
        .select("subscription_tier, is_admin, trial_ends_at").eq("id", user.id).maybeSingle();
    const { count } = await admin.from("ai_usage_log")
        .select("id", { count: "exact", head: true }).eq("user_id", user.id);
    console.log(`  ${label.padEnd(6)} ${email.padEnd(30)} tier=${String(p?.subscription_tier).padEnd(13)} admin=${String(p?.is_admin ?? false).padEnd(5)} ai_usage_rows=${count ?? "?"}  id=${user.id}`);
    return user.id;
}

const args = process.argv.slice(2);
const readOnly = args.includes("--status");

if (!readOnly) {
    const proId = await ensureAccount(PRO);
    await ensureAccount(FREE);
    if (args.includes("--admin")) await setAdmin(proId, true);
    if (args.includes("--revoke")) await setAdmin(proId, false);
}

console.log("Prod E2E accounts:");
await status("PRO", PRO.email);
await status("FREE", FREE.email);

const { data: leftovers } = await admin.from("projects").select("id, name").like("name", "E2E %");
console.log(`Leftover E2E projects: ${leftovers?.length ?? 0}${leftovers?.length ? " -> " + leftovers.map(p => p.name).join(", ") : ""}`);
