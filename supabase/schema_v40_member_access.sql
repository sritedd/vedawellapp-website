-- VedaWell Schema Migration v40: Allow project members to read shared projects
-- Run in Supabase SQL Editor (AFTER schema_v33_project_members.sql)
-- Date: 2026-04-09
--
-- FIX: Accepted project members currently hit "Project Not Found" because
-- the projects RLS policy only allows user_id = auth.uid(). This adds a
-- policy for members to SELECT projects they've been invited to.

-- Allow accepted project members to read the project
CREATE POLICY "Members can view shared projects" ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.status = 'accepted'
    )
  );

-- Also allow members to read project-scoped data (stages, defects, etc.)
-- These tables scope via project_id → projects.user_id, but members need access too.

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
    -- Only create if the table exists (some may not be created yet)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
      EXECUTE format(
        'CREATE POLICY "Members can view shared %I" ON %I FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = %I.project_id
            AND project_members.user_id = auth.uid()
            AND project_members.status = ''accepted''
          )
        )', tbl, tbl, tbl
      );
    END IF;
  END LOOP;
END $$;
