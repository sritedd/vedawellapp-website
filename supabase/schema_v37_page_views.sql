-- VedaWell Schema Migration v37: Page Views & User Activity Tracking
-- Run in Supabase SQL Editor
-- Date: 2026-03-31

BEGIN;

-- Page views table — logs every Guardian page visit with user info
CREATE TABLE IF NOT EXISTS page_views (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    path            TEXT NOT NULL,
    referrer        TEXT,
    user_agent      TEXT,
    session_id      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);

-- RLS: users can insert their own page views, admins read all
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "page_views_insert" ON page_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can read their own views (admin reads via service role)
CREATE POLICY "page_views_select" ON page_views FOR SELECT
    USING (auth.uid() = user_id);

-- Auto-cleanup: delete page views older than 90 days (run via cron)
-- This keeps the table from growing unbounded

-- Add engagement columns to profiles for idle tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_page_view_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_page_views INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_engagement_email_at TIMESTAMPTZ;

-- Index for finding idle users efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_last_page_view ON profiles(last_page_view_at)
    WHERE last_page_view_at IS NOT NULL;

COMMIT;
