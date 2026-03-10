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
