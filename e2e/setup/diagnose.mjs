/** Diagnose why the seeded project isn't visible to the logged-in test user. */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const f = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
    const e = {};
    for (const line of f.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i > 0) e[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return e;
}
const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// 1. How many auth users? (ensureTestUser uses a NON-paginated listUsers)
const { data: page1 } = await admin.auth.admin.listUsers();
console.log("1. listUsers() default page size returned:", page1.users.length, "users");
const foundDefault = page1.users.find(u => u.email === "e2e-test@vedawellapp.com");
console.log("   e2e-test@ found in default page?", !!foundDefault);

let total = 0, foundPaged = null;
for (let p = 1; p <= 20; p++) {
    const { data } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
    total += data.users.length;
    const hit = data.users.find(u => u.email === "e2e-test@vedawellapp.com");
    if (hit) foundPaged = hit;
    if (data.users.length < 200) break;
}
console.log("   total users (paged):", total, "| e2e-test@ found when paging?", !!foundPaged);
const proId = foundPaged?.id;
console.log("   pro user id:", proId);

// 2. Create a project exactly like createTestProject does
const { data: proj, error: projErr } = await admin.from("projects").insert({
    user_id: proId, name: "E2E DIAG Probe", builder_name: "Diag Builders",
    contract_value: 550000, address: "1 Diag St", start_date: "2026-04-01", status: "active",
}).select("id, user_id, name, state, build_category").single();
console.log("2. insert project:", projErr ? "ERROR " + projErr.message : JSON.stringify(proj));

if (proj) {
    // 3. Read it back as the USER (anon key + real session), which is what the browser does
    const anon = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
        email: "e2e-test@vedawellapp.com", password: "E2eTestPass!2026",
    });
    console.log("3. signIn as pro user:", signErr ? "ERROR " + signErr.message : "ok, uid=" + signIn.user.id);
    console.log("   uid matches project.user_id?", signIn?.user?.id === proj.user_id);

    const { data: asUser, error: readErr } = await anon.from("projects").select("id, name");
    console.log("4. projects visible to that session:", readErr ? "ERROR " + readErr.message : JSON.stringify(asUser));

    // 5. Clean up the probe
    await admin.from("projects").delete().eq("id", proj.id);
    console.log("5. probe project deleted");
}
