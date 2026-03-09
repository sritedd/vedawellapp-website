-- ================================================
-- SCHEMA V10: Fix infinite recursion in profiles RLS
-- The admin policies on "profiles" check profiles.is_admin,
-- which triggers the same RLS policies → infinite loop.
-- Fix: SECURITY DEFINER function that bypasses RLS.
-- ================================================

-- 1. Create a helper function that checks admin status WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 2. Now recreate ALL admin policies on profiles to use the function instead of subquery

-- Drop the old recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recreate with the safe function
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

-- 3. Also fix admin policies on other tables to use the function (optional but consistent)

-- support_messages
DROP POLICY IF EXISTS "Admins read all messages" ON support_messages;
CREATE POLICY "Admins read all messages"
  ON support_messages FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins send replies" ON support_messages;
CREATE POLICY "Admins send replies"
  ON support_messages FOR INSERT
  WITH CHECK (public.is_admin() AND is_admin_reply = true);

DROP POLICY IF EXISTS "Admins update messages" ON support_messages;
CREATE POLICY "Admins update messages"
  ON support_messages FOR UPDATE
  USING (public.is_admin());

-- announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (public.is_admin());

-- Guardian tables (projects, stages, etc.) — update if they exist
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'projects', 'stages', 'checklist_items', 'variations',
    'defects', 'certifications', 'inspections', 'documents',
    'weekly_checkins', 'email_subscribers'
  ])
  LOOP
    -- Only update if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
      EXECUTE format('DROP POLICY IF EXISTS "Admins can read all %s" ON %I', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY "Admins can read all %s" ON %I FOR SELECT USING (public.is_admin())',
        tbl, tbl
      );
    END IF;
  END LOOP;
END;
$$;

-- ================================================
-- DONE — Grant Trial / Set as Pro should now work
-- ================================================
