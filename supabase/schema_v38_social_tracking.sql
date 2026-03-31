-- VedaWell Schema Migration v38: Social Media Post Tracking
-- Run in Supabase SQL Editor
-- Date: 2026-03-31

BEGIN;

-- Track which posts have been published to which platforms
CREATE TABLE IF NOT EXISTS social_post_history (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform        TEXT NOT NULL,
    post_id         TEXT NOT NULL,
    post_label      TEXT,
    external_id     TEXT,
    utm_campaign    TEXT,
    posted_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_post_platform ON social_post_history(platform, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_post_utm ON social_post_history(utm_campaign);

-- Service role only — no user access needed
ALTER TABLE social_post_history ENABLE ROW LEVEL SECURITY;

COMMIT;
