-- Combined migrations: v13, v14, v15, v16
-- Generated: 2026-03-11T00:19:37.422Z
-- Paste this into the Supabase SQL Editor

-- ════════════════════════════════════════
-- schema_v13_storage_buckets.sql
-- ════════════════════════════════════════

-- ================================================
-- SCHEMA V13: Storage buckets + progress_photos table
-- Run this in Supabase SQL Editor after schema_v12
-- ================================================

-- 1. Create storage buckets (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('evidence', 'evidence', true),
  ('documents', 'documents', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for evidence bucket
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view evidence" ON storage.objects;
CREATE POLICY "Anyone can view evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence');

DROP POLICY IF EXISTS "Users can delete own evidence" ON storage.objects;
CREATE POLICY "Users can delete own evidence"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');

-- 3. Storage RLS policies for documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- 4. Storage RLS policies for certificates bucket
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
CREATE POLICY "Authenticated users can upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Users can delete own certificates" ON storage.objects;
CREATE POLICY "Users can delete own certificates"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- 5. Progress photos table (for ProgressPhotos component)
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    area TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_project ON progress_photos(project_id, created_at DESC);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own photos" ON progress_photos;
CREATE POLICY "Users can view own photos"
  ON progress_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = progress_photos.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own photos" ON progress_photos;
CREATE POLICY "Users can insert own photos"
  ON progress_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own photos" ON progress_photos;
CREATE POLICY "Users can delete own photos"
  ON progress_photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = progress_photos.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can read all progress_photos" ON progress_photos;
CREATE POLICY "Admins can read all progress_photos"
  ON progress_photos FOR SELECT
  USING (public.is_admin());

-- ================================================
-- DONE
-- ================================================


-- ════════════════════════════════════════
-- schema_v14_defect_columns.sql
-- ════════════════════════════════════════

-- ================================================
-- SCHEMA V14: Add missing columns to defects table
-- Required by ProjectDefects and NotificationCenter components
-- Safe to re-run (uses IF NOT EXISTS / exception handling)
-- ================================================

-- 1. Add new columns (safe — does nothing if already exists)
DO $$
BEGIN
  -- Date tracking
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS due_date DATE;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS reported_date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS rectified_date DATE;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS verified_date DATE;

  -- Notes
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS homeowner_notes TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS builder_notes TEXT;

  -- Reminder tracking
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

  -- Build stage where defect was found
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS stage TEXT;
END;
$$;

-- 2. Update status check constraint to include 'rectified' status
-- (original only allows: open, fixed, verified — component uses rectified)
ALTER TABLE defects DROP CONSTRAINT IF EXISTS defects_status_check;
ALTER TABLE defects ADD CONSTRAINT defects_status_check
  CHECK (status IN ('open', 'fixed', 'rectified', 'verified'));

-- 3. Backfill reported_date from created_at for existing rows
UPDATE defects
SET reported_date = created_at::date
WHERE reported_date IS NULL;

-- 4. Index for due date queries (NotificationCenter filters defects due within 7 days)
CREATE INDEX IF NOT EXISTS idx_defects_due_date ON defects(project_id, due_date)
WHERE due_date IS NOT NULL;

-- ================================================
-- DONE — Run schema_v13 first if not already done
-- ================================================


-- ════════════════════════════════════════
-- schema_v15_bugfixes.sql
-- ════════════════════════════════════════

-- ================================================
-- SCHEMA V15: Bug fixes for Guardian components
-- Fixes: missing order_index, defect status constraint,
--        inspection certificate_received, defect override_reason
-- Safe to re-run
-- ================================================

-- 1. Add order_index to stages table (ProjectOverview sorts by this)
ALTER TABLE stages ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Backfill order_index from created_at ordering per project
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) AS rn
  FROM stages
)
UPDATE stages SET order_index = numbered.rn
FROM numbered
WHERE stages.id = numbered.id AND stages.order_index IS NULL;

-- 2. Fix defect status CHECK constraint
--    Code uses: open, reported, in_progress, fixed, rectified, verified, disputed
--    Old constraint only allowed: open, fixed, rectified, verified
ALTER TABLE defects DROP CONSTRAINT IF EXISTS defects_status_check;
ALTER TABLE defects ADD CONSTRAINT defects_status_check
  CHECK (status IN ('open', 'reported', 'in_progress', 'fixed', 'rectified', 'verified', 'disputed'));

-- 3. Add override_reason to defects (for StageGate audit trail)
ALTER TABLE defects ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- 4. Add certificate_received to inspections table
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS certificate_received BOOLEAN DEFAULT false;

-- 5. Add scheduled_date to inspections (InspectionTimeline uses it)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- 6. Add inspector column if missing (InspectionTimeline uses it)
--    schema_v2 may have added it but let's be safe
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector TEXT;

-- 7. Add stage column to inspections (for grouping by stage)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS stage TEXT;

-- ================================================
-- DONE — Run after schema_v14
-- ================================================


-- ════════════════════════════════════════
-- schema_v16_materials_visits.sql
-- ════════════════════════════════════════

-- ================================================
-- SCHEMA V16: Create materials and site_visits tables
-- Also extends weekly_checkins with missing columns
-- Safe to re-run (IF NOT EXISTS / DO $$ blocks)
-- ================================================

-- 1. Materials registry
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    supplier TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own materials" ON materials;
CREATE POLICY "Users can manage own materials" ON materials FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid())
);

-- 2. Site visit log
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT,
    duration TEXT,
    purpose TEXT,
    attendees TEXT[], -- array of names
    observations TEXT,
    concerns TEXT[],
    follow_up_actions TEXT[],
    weather_conditions TEXT,
    workers_on_site INTEGER DEFAULT 0,
    photos_taken INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own site visits" ON site_visits;
CREATE POLICY "Users can manage own site visits" ON site_visits FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = site_visits.project_id AND projects.user_id = auth.uid())
);

-- 3. Extend weekly_checkins with columns the component needs
DO $$
BEGIN
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'on_track';
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS weather TEXT;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS workers_on_site INTEGER DEFAULT 0;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS work_completed TEXT;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS next_week_plan TEXT;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS issues TEXT[];
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS photos_count INTEGER DEFAULT 0;
END;
$$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_project ON site_visits(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_project ON weekly_checkins(project_id, week_start DESC);

-- ================================================
-- DONE — Run after schema_v15
-- ================================================


