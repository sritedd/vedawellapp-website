-- =====================================================
-- Schema v19: Database-level free tier enforcement
-- =====================================================
-- Enforces free tier limits at the DATABASE level via RLS
-- so users can't bypass client-side checks.
--
-- Free tier limits:
--   - 1 project
--   - 3 defects per project
--   - 2 variations per project
--
-- Pro/Trial/Admin users have unlimited access.
-- =====================================================

-- ─── Helper function: check if user has pro access ──────────────
-- Returns TRUE if user is: guardian_pro, active trial, or admin
CREATE OR REPLACE FUNCTION public.has_pro_access(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND (
      subscription_tier = 'guardian_pro'
      OR is_admin = true
      OR (subscription_tier = 'trial' AND trial_ends_at > now())
    )
  );
$$;

-- ─── Replace INSERT policy for projects ─────────────────────────
-- Free users: max 1 project
-- Pro users: unlimited
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Pro/trial/admin: unlimited
      public.has_pro_access(auth.uid())
      -- Free users: allow only if they have 0 projects
      OR (
        NOT public.has_pro_access(auth.uid())
        AND (SELECT count(*) FROM projects WHERE projects.user_id = auth.uid()) < 1
      )
    )
  );

-- ─── Replace INSERT policy for defects ──────────────────────────
-- Free users: max 3 defects per project
-- Pro users: unlimited
DROP POLICY IF EXISTS "Users can insert own project defects" ON defects;
CREATE POLICY "Users can insert own project defects" ON defects
  FOR INSERT
  WITH CHECK (
    -- Must own the project
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
    AND (
      -- Pro/trial/admin: unlimited
      public.has_pro_access(auth.uid())
      -- Free users: max 3 defects per project
      OR (
        NOT public.has_pro_access(auth.uid())
        AND (SELECT count(*) FROM defects WHERE defects.project_id = project_id) < 3
      )
    )
  );

-- ─── Replace INSERT policy for variations ───────────────────────
-- Free users: max 2 variations per project
-- Pro users: unlimited
DROP POLICY IF EXISTS "Users can insert own project variations" ON variations;
CREATE POLICY "Users can insert own project variations" ON variations
  FOR INSERT
  WITH CHECK (
    -- Must own the project
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
    AND (
      -- Pro/trial/admin: unlimited
      public.has_pro_access(auth.uid())
      -- Free users: max 2 variations per project
      OR (
        NOT public.has_pro_access(auth.uid())
        AND (SELECT count(*) FROM variations WHERE variations.project_id = project_id) < 2
      )
    )
  );

-- ─── Add UPDATE and DELETE policies for defects/variations ──────
-- (These were missing from the original schema)
DROP POLICY IF EXISTS "Users can update own project defects" ON defects;
CREATE POLICY "Users can update own project defects" ON defects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own project defects" ON defects;
CREATE POLICY "Users can delete own project defects" ON defects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own project variations" ON variations;
CREATE POLICY "Users can update own project variations" ON variations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own project variations" ON variations;
CREATE POLICY "Users can delete own project variations" ON variations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid())
  );

-- ─── Grant execute permission on helper function ────────────────
GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO service_role;
