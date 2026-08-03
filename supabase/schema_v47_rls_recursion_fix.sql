-- VedaWell Schema Migration v47: Fix infinite recursion in projects RLS
-- Run in Supabase SQL Editor
-- Date: 2026-08-03
--
-- ═══════════════════════════════════════════════════════════════════════════
-- P0 PRODUCTION BUG. Every authenticated SELECT on `projects` fails with:
--     infinite recursion detected in policy for relation "projects"
-- The UI swallows the error and renders "No Projects Yet", so every logged-in
-- user's project list looks empty. Found 2026-08-03 by the live prod E2E run.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- CAUSE — two policies reference each other's table:
--   v40  projects."Members can view shared projects"  → subquery on project_members
--   v33  project_members."Project owners can manage members" → subquery on projects
-- Reading either table evaluates the other's policy, which re-evaluates the
-- first, forever. The v40 child-table policies (stages, defects, …) inherit the
-- same cycle because they also read project_members.
--
-- FIX — SECURITY DEFINER helper functions. They execute as the function owner
-- (postgres), and a table owner is not subject to that table's RLS, so the
-- membership/ownership lookup inside them does NOT re-enter policy evaluation.
-- This is the standard Supabase pattern for mutually-referential policies.
--
-- VERIFIED before shipping: e2e/setup/verify-rls-fix.mjs reproduces the exact
-- recursion on a local Postgres with the current policy shape, then applies
-- these helpers and confirms (a) owner reads work, (b) an accepted member still
-- sees the shared project, (c) a stranger still sees nothing.

BEGIN;

-- ─── Helpers that break the cycle ──────────────────────────────────

-- Is the current user an ACCEPTED member of this project?
CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = pid
      AND pm.user_id = auth.uid()
      AND pm.status = 'accepted'
  );
$$;

-- Does the current user OWN this project?
CREATE OR REPLACE FUNCTION public.is_project_owner(pid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = pid AND p.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_project_owner(uuid)  TO authenticated, service_role;

-- ─── projects: member-read policy no longer touches project_members ─

DROP POLICY IF EXISTS "Members can view shared projects" ON projects;
CREATE POLICY "Members can view shared projects" ON projects FOR SELECT
  USING (public.is_project_member(id));

-- ─── project_members: owner policy no longer touches projects ───────

DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
CREATE POLICY "Project owners can manage members" ON project_members FOR ALL
  USING (public.is_project_owner(project_id));

-- ─── child tables: same swap, same reason ───────────────────────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'stages', 'defects', 'variations', 'certifications', 'inspections',
    'payments', 'documents', 'communication_log', 'progress_photos',
    'weekly_checkins', 'site_visits', 'pre_handover_items',
    'contract_review_items', 'builder_reviews', 'materials'
  ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = tbl AND table_schema = 'public'
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I',
                     'Members can view shared ' || tbl, tbl);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT USING (public.is_project_member(%I.project_id))',
        'Members can view shared ' || tbl, tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ─── Verify (expect: no error, and your own projects listed) ────────
-- Run as an authenticated user from the app, or check policy shape here:
--   SELECT tablename, policyname FROM pg_policies
--   WHERE schemaname='public' AND tablename IN ('projects','project_members')
--   ORDER BY tablename, policyname;
