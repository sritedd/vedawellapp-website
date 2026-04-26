-- VedaWell Schema Migration v45: lead-magnet UTM attribution
-- Run in Supabase SQL Editor
-- Date: 2026-04-25
--
-- Adds UTM columns to email_subscribers so we can attribute /red-flags
-- signups to the marketing channel that drove them. Without these, we have
-- no way to know whether TikTok, Reddit, Facebook, Google Ads, or organic
-- search is delivering signups — and therefore no way to double down on
-- what works or kill what doesn't.
--
-- Columns are nullable. Older signups (and direct/organic) won't have UTM
-- attribution — that's expected and correct.

BEGIN;

ALTER TABLE email_subscribers
  ADD COLUMN IF NOT EXISTS utm_source TEXT,        -- e.g. 'tiktok', 'reddit', 'facebook', 'google'
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,        -- e.g. 'social', 'cpc', 'email'
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,      -- e.g. 'flag-06', 'r-ausrenovation', 'sept-launch'
  ADD COLUMN IF NOT EXISTS utm_content TEXT,       -- e.g. specific ad creative or post variant
  ADD COLUMN IF NOT EXISTS utm_term TEXT,          -- search keyword for paid campaigns
  ADD COLUMN IF NOT EXISTS referrer_url TEXT;      -- document.referrer fallback when UTM is absent

-- Source aggregation queries hit utm_source most often.
CREATE INDEX IF NOT EXISTS idx_email_subscribers_utm_source
  ON email_subscribers (utm_source, created_at)
  WHERE utm_source IS NOT NULL;

-- Campaign-level rollup index.
CREATE INDEX IF NOT EXISTS idx_email_subscribers_utm_campaign
  ON email_subscribers (utm_campaign, created_at)
  WHERE utm_campaign IS NOT NULL;

COMMIT;

-- ── Useful queries for admin dashboards ─────────────────────────────────
--
-- Signups in last 30 days by source:
--   SELECT COALESCE(utm_source, '(direct/organic)') AS source,
--          COUNT(*) AS signups,
--          COUNT(*) FILTER (WHERE sequence_stage >= 99) AS completed_nurture
--   FROM email_subscribers
--   WHERE created_at > now() - INTERVAL '30 days'
--     AND source = 'red-flags-pdf'
--   GROUP BY source
--   ORDER BY signups DESC;
--
-- Top campaigns by source:
--   SELECT utm_source, utm_campaign, COUNT(*) AS signups
--   FROM email_subscribers
--   WHERE utm_campaign IS NOT NULL
--   GROUP BY utm_source, utm_campaign
--   ORDER BY signups DESC
--   LIMIT 50;
