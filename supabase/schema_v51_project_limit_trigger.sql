-- VedaWell Schema Migration v51: Move the free project cap out of the RLS policy
-- Run in Supabase SQL Editor
-- Date: 2026-08-11
-- Backlog: B-1
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LATENT REPEAT OF A P0. The projects INSERT policy still counts projects from
-- inside its own policy:
--
--   WITH CHECK (auth.uid() = user_id AND (
--     has_pro_access(auth.uid())
--     OR (NOT has_pro_access(auth.uid())
--         AND (SELECT count(*) FROM projects WHERE user_id = auth.uid()) < 1)))
--                              ^^^^^^^^ reads the table the policy is ON
--
-- That is the exact shape that made defects and variations throw
-- "infinite recursion detected in policy" for every user (fixed in v48). It
-- happens to work here today — measured on prod: a free user's 1st project is
-- allowed and the 2nd is correctly blocked — which is why v48 deliberately did
-- not touch it during a hotfix.
--
-- It is still a landmine: it survives only because Postgres currently plans it
-- in a way that terminates. Any future change to the projects policy set can
-- tip it over, and the failure mode is a total outage of project creation.
--
-- This migration moves the cap to a BEFORE INSERT trigger, matching the pattern
-- already proven for defects (v42) and variations (v41), and reduces the policy
-- to plain ownership.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION enforce_free_project_limit()
RETURNS TRIGGER AS $$
DECLARE
    owner_tier   TEXT;
    owner_admin  BOOLEAN;
    owner_trial  TIMESTAMPTZ;
    current_count INT;
    free_limit   INT := 1;
BEGIN
    SELECT subscription_tier, is_admin, trial_ends_at
      INTO owner_tier, owner_admin, owner_trial
    FROM profiles
    WHERE id = NEW.user_id;

    -- Pro, admin and active-trial users are unrestricted. Mirrors
    -- public.has_pro_access() so the two can't drift apart.
    IF COALESCE(owner_admin, false)
       OR COALESCE(owner_tier, 'free') = 'guardian_pro'
       OR (COALESCE(owner_tier, 'free') = 'trial' AND owner_trial > now()) THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO current_count FROM projects WHERE user_id = NEW.user_id;

    IF current_count >= free_limit THEN
        RAISE EXCEPTION 'FREE_TIER_PROJECT_LIMIT: free plan allows % project. Upgrade to Guardian Pro for unlimited.', free_limit
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_free_project_limit ON projects;
CREATE TRIGGER trg_enforce_free_project_limit
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION enforce_free_project_limit();

-- Policy is now plain ownership — no self-reference, no recursion risk.
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;

-- ─── Verify ─────────────────────────────────────────────────────────
--   node e2e/setup/verify-write-limits.mjs
-- Expect: free user's 1st project OK, 2nd blocked with FREE_TIER_PROJECT_LIMIT;
-- pro/admin unlimited; nobody can insert a project owned by another user.
