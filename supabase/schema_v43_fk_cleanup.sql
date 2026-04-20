-- VedaWell Schema Migration v43: FK ON DELETE cleanup
-- Run in Supabase SQL Editor
-- Date: 2026-04-20
--
-- Phase 6 data-integrity findings:
-- P6-2 (P2): profiles.referred_by has no ON DELETE -> blocks auth.admin.deleteUser()
--            for any user who has successfully referred someone else.
-- P6-3 (P3): announcements.created_by + support_messages.admin_id likewise block
--            admin accounts from self-deleting.
-- P6-4 (P3): profiles.id -> auth.users(id) has no ON DELETE. Current flow
--            manually deletes profile first; this adds defence-in-depth.
-- P6-5 (P3): projects.user_id -> profiles(id) has no ON DELETE. Same pattern.

BEGIN;

-- ── P6-4: profiles.id -> auth.users(id) cascade ─────────────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── P6-2: profiles.referred_by -> auth.users(id) SET NULL ──────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_referred_by_fkey
  FOREIGN KEY (referred_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── P6-5: projects.user_id -> profiles(id) cascade ──────────────────────────
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE projects
  ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── P6-3: announcements.created_by -> auth.users(id) SET NULL ──────────────
ALTER TABLE announcements
  DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

ALTER TABLE announcements
  ADD CONSTRAINT announcements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── P6-3: support_messages.admin_id -> auth.users(id) SET NULL ─────────────
ALTER TABLE support_messages
  DROP CONSTRAINT IF EXISTS support_messages_admin_id_fkey;

ALTER TABLE support_messages
  ADD CONSTRAINT support_messages_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
