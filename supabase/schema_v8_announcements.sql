-- ================================================
-- SCHEMA V8: Admin announcements banner
-- Run this in Supabase SQL Editor after schema_v7
-- ================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active announcements
DROP POLICY IF EXISTS "Anyone can read active announcements" ON announcements;
CREATE POLICY "Anyone can read active announcements"
  ON announcements FOR SELECT
  USING (active = true);

-- Admins can manage announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ================================================
-- DONE
-- ================================================
