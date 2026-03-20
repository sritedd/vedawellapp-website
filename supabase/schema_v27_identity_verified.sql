-- schema_v27_identity_verified.sql
-- Adds identity_verified columns (email-OTP based verification)
-- and replaces overly-permissive storage RLS with user-scoped path enforcement

-- 1. Add identity_verified columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

-- 2. Storage RLS: Replace v13's permissive policies with user-scoped path enforcement
-- v13 policies allowed ANY authenticated user to upload/delete across ALL projects,
-- and allowed PUBLIC read on all buckets. This replaces them with ownership checks.

-- Drop ALL old v13 policies (evidence bucket)
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own evidence" ON storage.objects;

-- Drop ALL old v13 policies (documents bucket)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Drop ALL old v13 policies (certificates bucket)
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certificates" ON storage.objects;

-- Drop v27 policies if re-running this migration
DROP POLICY IF EXISTS "Users can upload to own projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project files" ON storage.objects;

-- New policy: users can only upload to paths under projects they own
-- Path structure: {projectId}/photos/..., {projectId}/defects/..., etc.
-- (storage.foldername(name))[1] extracts the first folder segment = projectId
CREATE POLICY "Users can upload to own projects" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('evidence', 'documents', 'certificates')
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE user_id = auth.uid()
        )
    );

-- New policy: users can only read files under projects they own
CREATE POLICY "Users can read own project files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id IN ('evidence', 'documents', 'certificates')
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE user_id = auth.uid()
        )
    );

-- New policy: users can only delete files under projects they own
CREATE POLICY "Users can delete own project files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id IN ('evidence', 'documents', 'certificates')
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE user_id = auth.uid()
        )
    );
