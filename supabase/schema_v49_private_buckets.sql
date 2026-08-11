-- VedaWell Schema Migration v49: Make evidence/documents/certificates PRIVATE
-- Run in Supabase SQL Editor
-- Date: 2026-08-11
--
-- ═══════════════════════════════════════════════════════════════════════════
-- PRIVACY FIX. All three storage buckets were PUBLIC, so every uploaded file —
-- defect photos, signed building contracts, compliance certificates — was
-- readable by anyone holding the URL, with no authentication at all. Proven
-- during the live E2E run:
--
--     GET /storage/v1/object/public/evidence/<project>/photos/<file>.jpg
--     -> 200 image/jpeg 64274      (no credentials sent)
--
-- The project UUID that forms the path prefix is visible in the address bar of
-- every project page, so the path is not meaningfully secret. Storage RLS did
-- not help: the /object/public/ endpoint bypasses it entirely for public
-- buckets. For a product built on legal-dispute evidence this is the wrong
-- default.
--
-- After this migration the app must use signed URLs (see
-- src/lib/guardian/storage.ts). Public URLs stop resolving — acceptable here
-- because there are no real users yet (owner's explicit call, 2026-08-11).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Flip the buckets to private ─────────────────────────────────
UPDATE storage.buckets
SET public = false
WHERE id IN ('evidence', 'documents', 'certificates');

-- ─── 2. Read access: owners AND accepted project members ────────────
-- Signing a URL requires SELECT on the object, so this policy is what makes
-- createSignedUrl() work at all once the bucket is private. The previous policy
-- only covered the project owner; project sharing (v40) gives accepted members
-- access to project DATA, so their photos and documents must resolve too —
-- otherwise every shared image renders broken.
--
-- public.is_project_member() is the SECURITY DEFINER helper from v47; using it
-- keeps this policy from re-entering projects/project_members RLS.
DROP POLICY IF EXISTS "Users can read own project files" ON storage.objects;
CREATE POLICY "Users can read own project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('evidence', 'documents', 'certificates')
    AND (
      (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE user_id = auth.uid())
      OR public.is_project_member(((storage.foldername(name))[1])::uuid)
    )
  );

COMMIT;

-- ─── Verify ─────────────────────────────────────────────────────────
-- 1. Buckets are private:
--      SELECT id, public FROM storage.buckets
--      WHERE id IN ('evidence','documents','certificates');   -- expect public = false
--
-- 2. An unauthenticated public URL no longer resolves:
--      curl -s -o /dev/null -w "%{http_code}\n" \
--        "https://<ref>.supabase.co/storage/v1/object/public/evidence/<path>"
--      -- expect 400/404, NOT 200
--
-- 3. The app still renders images (it now signs them):
--      node e2e/setup/verify-bucket-privacy.mjs
