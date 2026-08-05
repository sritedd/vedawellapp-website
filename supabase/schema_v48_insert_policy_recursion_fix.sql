-- VedaWell Schema Migration v48: Fix infinite recursion on defect/variation INSERT
-- Run in Supabase SQL Editor (AFTER schema_v47_rls_recursion_fix.sql)
-- Date: 2026-08-05
--
-- ═══════════════════════════════════════════════════════════════════════════
-- P0 PRODUCTION BUG (second one, found after v47 unblocked reads).
-- Logging a defect or a variation fails for EVERY user with:
--     Failed to save: infinite recursion detected in policy for relation "defects"
-- Defect logging is the core of the product, so this is a total feature outage.
-- Found 2026-08-05 by the live prod E2E run, reproduced from the real UI.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- CAUSE — the free-tier limit is enforced inside each table's own INSERT policy
-- by counting rows OF THAT SAME TABLE:
--
--   defects    FOR INSERT WITH CHECK (... (SELECT count(*) FROM defects    ...) < 3)
--   variations FOR INSERT WITH CHECK (... (SELECT count(*) FROM variations ...) < 2)
--
-- Evaluating a policy for table X that reads X re-enters X's policies, which
-- Postgres aborts as recursion. The `has_pro_access() OR (...)` wrapper does
-- NOT prevent it: SQL does not guarantee short-circuit evaluation, so the
-- subquery is planned regardless of tier. Verified in prod against an account
-- that is BOTH guardian_pro AND is_admin — it still recursed.
--
-- MEASURED IN PROD before writing this fix:
--   defects    INSERT -> RECURSION        (has self-referential count)
--   variations INSERT -> RECURSION        (has self-referential count)
--   materials  INSERT -> OK               (control: no self-reference)
--   projects   INSERT -> OK, and the 2nd project is still correctly blocked
--
-- SCOPE — deliberately minimal. `projects` carries the same latent pattern but
-- currently behaves correctly (1st project allowed, 2nd blocked), so this
-- hotfix does NOT touch it; changing a working production policy would add risk
-- for no gain. Logged as a follow-up to harden later.
--
-- FIX — drop the self-referential counting from the two broken policies and let
-- the EXISTING BEFORE INSERT triggers enforce the tier limits. Those triggers
-- are SECURITY DEFINER, so their counts never re-enter policy evaluation:
--     schema_v41_variation_limit.sql -> enforce_free_variation_limit()  (max 2)
--     schema_v42_defect_limit.sql    -> enforce_free_defect_limit()     (max 3)
-- Both are already applied in prod, so tier enforcement is unchanged and stays
-- server-side — it simply moves from the policy to the trigger that was written
-- for exactly this purpose.

BEGIN;

-- Ownership check only. Tier limits come from the v41/v42 triggers.
DROP POLICY IF EXISTS "Users can insert own project defects" ON defects;
CREATE POLICY "Users can insert own project defects" ON defects FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "Users can insert own project variations" ON variations;
CREATE POLICY "Users can insert own project variations" ON variations FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

COMMIT;

-- ─── Verify after running ───────────────────────────────────────────
-- 1. Any user can log a defect / variation on their own project.
-- 2. A free-tier user is still capped: the 4th defect and 3rd variation raise
--    FREE_TIER_DEFECT_LIMIT / FREE_TIER_VARIATION_LIMIT from the trigger.
-- 3. A user cannot insert into someone else's project (is_project_owner false).
--    node e2e/setup/verify-write-limits.mjs   -- checks all three against prod
