/**
 * Reproduce the prod RLS recursion locally, then prove the v47 fix clears it.
 * Runs against the local guardian_test DB — never touches prod.
 */
import pg from "pg";

const pool = new pg.Pool({
    host: "localhost", port: 5432, database: "guardian_test",
    user: "postgres", password: "postgres",
});

const q = (sql, params) => pool.query(sql, params);

async function main() {
    // ── Fresh sandbox schema ───────────────────────────────────────
    await q(`DROP SCHEMA IF EXISTS rlstest CASCADE; CREATE SCHEMA rlstest;`);
    await q(`SET search_path = rlstest, public;`);

    // auth.uid() stand-in
    await q(`CREATE SCHEMA IF NOT EXISTS auth;`);
    await q(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
             LANGUAGE sql STABLE AS $$ SELECT current_setting('rlstest.uid', true)::uuid $$;`);

    await q(`CREATE TABLE rlstest.projects (
               id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, name text);`);
    await q(`CREATE TABLE rlstest.project_members (
               id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
               project_id uuid REFERENCES rlstest.projects(id) ON DELETE CASCADE,
               user_id uuid, status text DEFAULT 'accepted');`);

    const owner = "11111111-1111-1111-1111-111111111111";
    const { rows } = await q(
        `INSERT INTO rlstest.projects (user_id, name) VALUES ($1,'P1') RETURNING id`, [owner]);
    const pid = rows[0].id;

    await q(`ALTER TABLE rlstest.projects ENABLE ROW LEVEL SECURITY;`);
    await q(`ALTER TABLE rlstest.project_members ENABLE ROW LEVEL SECURITY;`);

    // A non-owning role so RLS is actually enforced (table owners bypass it)
    await q(`DO $$ BEGIN
               IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='rls_tester') THEN
                 CREATE ROLE rls_tester NOLOGIN;
               END IF;
             END $$;`);
    await q(`GRANT USAGE ON SCHEMA rlstest, auth TO rls_tester;`);
    await q(`GRANT SELECT ON ALL TABLES IN SCHEMA rlstest TO rls_tester;`);
    await q(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO rls_tester;`);

    // ── BROKEN: the policy pair currently live in prod (v33 + v40) ──
    await q(`CREATE POLICY own ON rlstest.projects FOR SELECT USING (user_id = auth.uid());`);
    await q(`CREATE POLICY member_view ON rlstest.projects FOR SELECT USING (
               EXISTS (SELECT 1 FROM rlstest.project_members
                       WHERE project_members.project_id = projects.id
                         AND project_members.user_id = auth.uid()
                         AND project_members.status = 'accepted'));`);
    await q(`CREATE POLICY owner_manage ON rlstest.project_members FOR ALL USING (
               EXISTS (SELECT 1 FROM rlstest.projects
                       WHERE projects.id = project_members.project_id
                         AND projects.user_id = auth.uid()));`);

    // SET LOCAL ROLE only takes effect inside a transaction; without BEGIN it
    // silently no-ops and the query runs as the table owner, which BYPASSES RLS
    // entirely (and would make this whole harness meaningless).
    async function readAs(uid, label) {
        const c = await pool.connect();
        try {
            await c.query(`BEGIN`);
            await c.query(`SET LOCAL search_path = rlstest, public`);
            await c.query(`SELECT set_config('rlstest.uid', $1, true)`, [uid]);
            await c.query(`SET LOCAL ROLE rls_tester`);
            const who = await c.query(`SELECT current_user`);
            const r = await c.query(`SELECT id, name FROM rlstest.projects`);
            await c.query(`COMMIT`);
            console.log(`${label}: OK — ${r.rows.length} row(s) [as ${who.rows[0].current_user}]`);
            return { ok: true, count: r.rows.length };
        } catch (e) {
            await c.query(`ROLLBACK`).catch(() => {});
            console.log(`${label}: ERROR — ${e.message}`);
            return { ok: false, count: -1 };
        } finally {
            c.release();
        }
    }
    const readAsUser = (label) => readAs(owner, label).then((r) => r.ok);

    console.log("── Before fix (current prod policy shape) ──");
    const before = await readAsUser("  owner reads projects");

    // ── FIX: SECURITY DEFINER helpers break the cycle (v47) ─────────
    await q(`CREATE OR REPLACE FUNCTION rlstest.is_project_member(pid uuid)
             RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
             SET search_path = rlstest, public AS $$
               SELECT EXISTS (SELECT 1 FROM rlstest.project_members pm
                              WHERE pm.project_id = pid AND pm.user_id = auth.uid()
                                AND pm.status = 'accepted') $$;`);
    await q(`CREATE OR REPLACE FUNCTION rlstest.is_project_owner(pid uuid)
             RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
             SET search_path = rlstest, public AS $$
               SELECT EXISTS (SELECT 1 FROM rlstest.projects p
                              WHERE p.id = pid AND p.user_id = auth.uid()) $$;`);
    await q(`GRANT EXECUTE ON FUNCTION rlstest.is_project_member(uuid), rlstest.is_project_owner(uuid) TO rls_tester;`);

    await q(`DROP POLICY member_view ON rlstest.projects;`);
    await q(`CREATE POLICY member_view ON rlstest.projects FOR SELECT
             USING (rlstest.is_project_member(id));`);
    await q(`DROP POLICY owner_manage ON rlstest.project_members;`);
    await q(`CREATE POLICY owner_manage ON rlstest.project_members FOR ALL
             USING (rlstest.is_project_owner(project_id));`);

    console.log("── After fix (v47 SECURITY DEFINER helpers) ──");
    const after = await readAsUser("  owner reads projects");

    // Member access must still work (the feature v40 added)
    const member = "22222222-2222-2222-2222-222222222222";
    await q(`INSERT INTO rlstest.project_members (project_id, user_id, status)
             VALUES ($1,$2,'accepted')`, [pid, member]);
    const m = await readAs(member, "  accepted member reads projects");
    console.log(`  → member sees shared project: ${m.count === 1 ? "YES (correct)" : "NO (" + m.count + ")"}`);

    // Non-member must NOT see it
    const stranger = "33333333-3333-3333-3333-333333333333";
    const s = await readAs(stranger, "  stranger reads projects");
    console.log(`  → stranger sees nothing: ${s.count === 0 ? "YES (correct)" : "NO — LEAK of " + s.count}`);

    console.log(`\nVERDICT: recursion before=${before ? "no" : "YES"} after=${after ? "no" : "YES"}`);
    await q(`DROP SCHEMA rlstest CASCADE;`);
    await q(`DROP ROLE IF EXISTS rls_tester;`).catch(() => {});
    await pool.end();
}

main().catch(async (e) => { console.error("FATAL", e.message); await pool.end(); process.exit(1); });
