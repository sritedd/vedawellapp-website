-- ================================================
-- SCHEMA V7: Admin read access to all Guardian tables
-- Run this in Supabase SQL Editor after schema_v6
-- Allows admins to view aggregate stats across all users
-- ================================================

-- Helper: admin check subquery used in all policies below
-- EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)

-- Projects: admin can read all projects
DROP POLICY IF EXISTS "Admins can read all projects" ON projects;
CREATE POLICY "Admins can read all projects"
  ON projects FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Stages: admin can read all stages
DROP POLICY IF EXISTS "Admins can read all stages" ON stages;
CREATE POLICY "Admins can read all stages"
  ON stages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = stages.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Checklist items: admin can read all
DROP POLICY IF EXISTS "Admins can read all checklist_items" ON checklist_items;
CREATE POLICY "Admins can read all checklist_items"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = checklist_items.stage_id AND projects.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Variations: admin can read all
DROP POLICY IF EXISTS "Admins can read all variations" ON variations;
CREATE POLICY "Admins can read all variations"
  ON variations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Defects: admin can read all
DROP POLICY IF EXISTS "Admins can read all defects" ON defects;
CREATE POLICY "Admins can read all defects"
  ON defects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Certifications: admin can read all
DROP POLICY IF EXISTS "Admins can read all certifications" ON certifications;
CREATE POLICY "Admins can read all certifications"
  ON certifications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Inspections: admin can read all
DROP POLICY IF EXISTS "Admins can read all inspections" ON inspections;
CREATE POLICY "Admins can read all inspections"
  ON inspections FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = inspections.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Documents: admin can read all
DROP POLICY IF EXISTS "Admins can read all documents" ON documents;
CREATE POLICY "Admins can read all documents"
  ON documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Weekly checkins: admin can read all
DROP POLICY IF EXISTS "Admins can read all weekly_checkins" ON weekly_checkins;
CREATE POLICY "Admins can read all weekly_checkins"
  ON weekly_checkins FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = weekly_checkins.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Email subscribers: admin can read all
DROP POLICY IF EXISTS "Admins can read all email_subscribers" ON email_subscribers;
CREATE POLICY "Admins can read all email_subscribers"
  ON email_subscribers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ================================================
-- DONE
-- Admins can now query aggregate stats across all
-- Guardian tables for the admin dashboard
-- ================================================
