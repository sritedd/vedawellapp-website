/**
 * Verify the storage privacy migration (schema_v49) end to end against PROD.
 *
 *   1. buckets report public = false
 *   2. an unauthenticated public URL does NOT resolve
 *   3. the OWNER can still mint a signed URL and fetch the bytes
 *   4. a STRANGER cannot mint a signed URL for someone else's object
 *
 * Uploads one small object, checks all four, then deletes everything it made.
 *   node e2e/setup/verify-bucket-privacy.mjs
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
const { PRO, FREE } = await import("./credentials.mjs");
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL_, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const pass = (m) => console.log(`  PASS  ${m}`);
const fail = (m) => { console.log(`  FAIL  ${m}`); process.exitCode = 1; };

// ── 1. bucket flags ───────────────────────────────────────────────
console.log("1. Bucket privacy flags");
const { data: buckets } = await admin.storage.listBuckets();
for (const name of ["evidence", "documents", "certificates"]) {
    const b = (buckets || []).find(x => x.name === name);
    if (!b) { fail(`${name}: bucket missing`); continue; }
    b.public === false ? pass(`${name}: public = false`) : fail(`${name}: STILL PUBLIC`);
}

// ── set up an owned project + object ──────────────────────────────
async function findUser(email) {
    for (let p = 1; p <= 20; p++) {
        const { data } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
        const hit = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (hit) return hit;
        if (data.users.length < 200) return null;
    }
    return null;
}
const owner = await findUser(PRO.email);
const { data: project } = await admin.from("projects").insert({
    user_id: owner.id, name: "UITEST BucketPrivacy", builder_name: "B", contract_value: 1000,
    address: "1 St", start_date: "2026-04-01", status: "active", state: "NSW", build_category: "new_build",
}).select("id").single();

const objectPath = `${project.id}/photos/privacy-probe.txt`;
await admin.storage.from("evidence").upload(objectPath, Buffer.from("privacy probe"), {
    contentType: "text/plain", upsert: true,
});

// ── 2. unauthenticated public URL must NOT resolve ────────────────
console.log("2. Unauthenticated access");
const publicUrl = `${URL_}/storage/v1/object/public/evidence/${objectPath}`;
const anonRes = await fetch(publicUrl);
anonRes.status === 200
    ? fail(`public URL still returns 200 — bucket is readable without auth`)
    : pass(`public URL blocked (HTTP ${anonRes.status})`);

// ── 3. owner can sign and fetch ───────────────────────────────────
console.log("3. Owner access via signed URL");
const ownerClient = createClient(URL_, ANON);
await ownerClient.auth.signInWithPassword({ email: PRO.email, password: PRO.password });
const { data: signed, error: signErr } = await ownerClient.storage
    .from("evidence").createSignedUrl(objectPath, 300);
if (signErr || !signed?.signedUrl) {
    fail(`owner could not sign: ${signErr?.message || "no url"}`);
} else {
    pass("owner minted a signed URL");
    const got = await fetch(signed.signedUrl);
    const body = got.status === 200 ? await got.text() : "";
    got.status === 200 && body === "privacy probe"
        ? pass("signed URL returns the real bytes")
        : fail(`signed URL fetch failed (HTTP ${got.status})`);
}

// ── 4. stranger must NOT be able to sign ──────────────────────────
console.log("4. Cross-tenant isolation");
const stranger = createClient(URL_, ANON);
await stranger.auth.signInWithPassword({ email: FREE.email, password: FREE.password });
const { data: badSign, error: badErr } = await stranger.storage
    .from("evidence").createSignedUrl(objectPath, 300);
if (badSign?.signedUrl) {
    // Signing "succeeded" — only a real fetch proves whether it's usable.
    const probe = await fetch(badSign.signedUrl);
    probe.status === 200
        ? fail("stranger signed AND fetched another user's object")
        : pass(`stranger's signed URL does not resolve (HTTP ${probe.status})`);
} else {
    pass(`stranger cannot sign someone else's object (${badErr?.message?.slice(0, 40) || "denied"})`);
}

// ── teardown ──────────────────────────────────────────────────────
await admin.storage.from("evidence").remove([objectPath]);
await admin.from("projects").delete().eq("id", project.id);
const { data: left } = await admin.from("projects").select("id").like("name", "UITEST BucketPrivacy%");
console.log(`\ncleanup: ${left?.length ? "LEFTOVERS" : "clean"}`);
