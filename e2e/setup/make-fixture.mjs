/**
 * Create a seeded E2E project for a given state, exactly like the UI wizard does
 * (stages + checklist items + certifications + payment milestones), and print its id.
 *
 *   node e2e/setup/make-fixture.mjs NSW "E2E NSW WriteTest"
 *   node e2e/setup/make-fixture.mjs --delete <projectId>
 *   node e2e/setup/make-fixture.mjs --purge          # delete all "E2E " projects
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
const { PRO } = await import("./credentials.mjs");
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

async function findUser(email) {
    for (let p = 1; p <= 20; p++) {
        const { data } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
        const h = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (h) return h;
        if (data.users.length < 200) return null;
    }
    return null;
}

const args = process.argv.slice(2);

// NOTE on naming: the Playwright suite's cleanupE2EProjects() deletes EVERY project
// matching `E2E %` in its beforeAll. A browser-driven fixture named "E2E ..." will be
// deleted out from under you if a spec run starts concurrently — which looks exactly
// like a write bug (RLS denies writes to a project that no longer exists). Browser
// fixtures therefore use the `UITEST ` prefix, which that pattern cannot match.
if (args[0] === "--purge") {
    let total = 0;
    for (const pattern of ["E2E %", "UITEST %"]) {
        const { data } = await admin.from("projects").select("id,name").like("name", pattern);
        for (const p of data || []) await admin.from("projects").delete().eq("id", p.id);
        total += data?.length ?? 0;
    }
    console.log(`purged ${total} test project(s)`);
    process.exit(0);
}
if (args[0] === "--delete") {
    await admin.from("projects").delete().eq("id", args[1]);
    console.log("deleted", args[1]);
    process.exit(0);
}

const state = args[0] || "NSW";
const name = args[1] || `E2E ${state} Fixture`;
// Owner defaults to the E2E pro account, but browser-driven runs need the project
// to belong to whoever is logged into the browser — pass E2E_FIXTURE_OWNER=<email>.
const ownerEmail = process.env.E2E_FIXTURE_OWNER || PRO.email;
const user = await findUser(ownerEmail);
if (!user) { console.error(`owner not found: ${ownerEmail}`); process.exit(1); }

const { data: project, error } = await admin.from("projects").insert({
    user_id: user.id, name,
    builder_name: `${state} Test Builders Pty Ltd`,
    builder_license_number: `${state}12345C`,
    hbcf_policy_number: `POL-${state}-2026-001`,
    insurance_expiry_date: "2027-12-31",
    contract_value: 650000,
    address: `42 Test Street, ${state}`,
    start_date: "2026-04-01",
    contract_signed_date: "2026-03-15",
    status: "active",
    state, build_category: "new_build",
}).select("id").single();
if (error) { console.error("create failed:", error.message); process.exit(1); }

const workflows = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/data/australian-build-workflows.json"), "utf-8"));
const stages = workflows.workflows?.new_build?.[state]?.stages || [];

for (let i = 0; i < stages.length; i++) {
    const st = stages[i];
    const { data: stageRow } = await admin.from("stages").insert({
        project_id: project.id, name: st.name, status: i === 0 ? "in_progress" : "pending", order_index: i,
    }).select("id").single();
    if (!stageRow) continue;
    const items = st.checklist || [];
    if (items.length) {
        await admin.from("checklist_items").insert(items.map(it => ({
            stage_id: stageRow.id, description: it.item || String(it),
            is_completed: false, is_critical: !!it.critical, requires_photo: !!it.requiresPhoto,
        })));
    }
    for (const cert of (st.certificates || [])) {
        await admin.from("certifications").insert({
            project_id: project.id, type: cert, status: "pending", required_for_stage: stageRow.id,
        });
    }
}
console.log(project.id);
