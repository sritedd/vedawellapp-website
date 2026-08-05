/**
 * Reproduce the v48 INSERT recursion locally and prove the fix works,
 * including that free-tier limits are still enforced (by trigger).
 */
import pg from "pg";
const pool = new pg.Pool({ host: "localhost", port: 5432, database: "guardian_test", user: "postgres", password: "postgres" });
const q = (s, p) => pool.query(s, p);

const OWNER = "11111111-1111-1111-1111-111111111111";

async function insertAs(uid, projectId, title) {
    const c = await pool.connect();
    try {
        await c.query("BEGIN");
        await c.query("SET LOCAL search_path = t48, public");
        await c.query("SELECT set_config('t48.uid', $1, true)", [uid]);
        await c.query("SET LOCAL ROLE t48_user");
        await c.query("INSERT INTO t48.defects (project_id, title) VALUES ($1,$2)", [projectId, title]);
        await c.query("COMMIT");
        return "OK";
    } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        return "ERR: " + e.message.split("\n")[0].slice(0, 90);
    } finally { c.release(); }
}

async function main() {
    await q(`DROP SCHEMA IF EXISTS t48 CASCADE; CREATE SCHEMA t48;`);
    await q(`CREATE SCHEMA IF NOT EXISTS auth;`);
    await q(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
             AS $$ SELECT current_setting('t48.uid', true)::uuid $$;`);
    await q(`CREATE TABLE t48.profiles (id uuid PRIMARY KEY, subscription_tier text, is_admin bool DEFAULT false, trial_ends_at timestamptz);`);
    await q(`CREATE TABLE t48.projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);`);
    await q(`CREATE TABLE t48.defects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid, title text);`);
    await q(`INSERT INTO t48.profiles VALUES ($1,'free',false,null)`, [OWNER]);
    const { rows } = await q(`INSERT INTO t48.projects (user_id) VALUES ($1) RETURNING id`, [OWNER]);
    const pid = rows[0].id;

    await q(`CREATE OR REPLACE FUNCTION t48.has_pro_access(uid uuid) RETURNS boolean
             LANGUAGE sql SECURITY DEFINER STABLE SET search_path=t48,public AS $$
               SELECT EXISTS (SELECT 1 FROM t48.profiles WHERE id=uid AND
                 (subscription_tier='guardian_pro' OR is_admin OR (subscription_tier='trial' AND trial_ends_at>now()))) $$;`);
    await q(`CREATE OR REPLACE FUNCTION t48.is_project_owner(pid uuid) RETURNS boolean
             LANGUAGE sql SECURITY DEFINER STABLE SET search_path=t48,public AS $$
               SELECT EXISTS (SELECT 1 FROM t48.projects p WHERE p.id=pid AND p.user_id=auth.uid()) $$;`);

    await q(`ALTER TABLE t48.defects ENABLE ROW LEVEL SECURITY;`);
    await q(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='t48_user') THEN CREATE ROLE t48_user NOLOGIN; END IF; END $$;`);
    await q(`GRANT USAGE ON SCHEMA t48, auth TO t48_user;`);
    await q(`GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA t48 TO t48_user;`);
    await q(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t48, auth TO t48_user;`);

    // ── BROKEN shape (current prod): self-referential count in the policy ──
    await q(`CREATE POLICY sel ON t48.defects FOR SELECT USING (t48.is_project_owner(project_id));`);
    await q(`CREATE POLICY ins ON t48.defects FOR INSERT WITH CHECK (
               t48.is_project_owner(project_id)
               AND (t48.has_pro_access(auth.uid()) OR (NOT t48.has_pro_access(auth.uid())
                    AND (SELECT count(*) FROM t48.defects WHERE defects.project_id = project_id) < 3)));`);
    console.log("── Before fix (current prod policy shape) ──");
    console.log("  free user inserts defect:", await insertAs(OWNER, pid, "d1"));

    // ── v48 shape: plain ownership policy + SECURITY DEFINER trigger ──
    await q(`DROP POLICY ins ON t48.defects;`);
    await q(`CREATE POLICY ins ON t48.defects FOR INSERT WITH CHECK (t48.is_project_owner(project_id));`);
    await q(`CREATE OR REPLACE FUNCTION t48.enforce_free_defect_limit() RETURNS TRIGGER AS $$
             DECLARE owner_id uuid; owner_tier text; cnt int; lim int := 3;
             BEGIN
               SELECT user_id INTO owner_id FROM t48.projects WHERE id = NEW.project_id;
               IF owner_id IS NULL THEN RETURN NEW; END IF;
               SELECT subscription_tier INTO owner_tier FROM t48.profiles WHERE id = owner_id;
               IF COALESCE(owner_tier,'free') <> 'free' THEN RETURN NEW; END IF;
               SELECT COUNT(*) INTO cnt FROM t48.defects WHERE project_id = NEW.project_id;
               IF cnt >= lim THEN
                 RAISE EXCEPTION 'FREE_TIER_DEFECT_LIMIT: free plan allows % defects', lim USING ERRCODE='check_violation';
               END IF;
               RETURN NEW;
             END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=t48,public;`);
    await q(`DROP TRIGGER IF EXISTS trg ON t48.defects;
             CREATE TRIGGER trg BEFORE INSERT ON t48.defects FOR EACH ROW EXECUTE FUNCTION t48.enforce_free_defect_limit();`);

    console.log("── After fix (v48) ──");
    for (let i = 1; i <= 4; i++) {
        console.log(`  free user defect #${i}:`, await insertAs(OWNER, pid, "d" + i));
    }
    await q(`UPDATE t48.profiles SET subscription_tier='guardian_pro' WHERE id=$1`, [OWNER]);
    console.log("  pro user defect #5 (limit must NOT apply):", await insertAs(OWNER, pid, "d5"));

    await q(`DROP SCHEMA t48 CASCADE;`);
    await pool.end();
}
main().catch(async e => { console.error("FATAL", e.message); await pool.end(); process.exit(1); });
