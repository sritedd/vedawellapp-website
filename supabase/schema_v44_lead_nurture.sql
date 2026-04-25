-- VedaWell Schema Migration v44: lead magnet nurture fields
-- Run in Supabase SQL Editor
-- Date: 2026-04-24
--
-- Adds columns to email_subscribers so the Red Flags lead magnet can:
--   - personalise the welcome email (first_name)
--   - provide one-click unsubscribe (unsubscribe_token)
--   - drive a day-3/day-7/day-14 nurture sequence (sequence_stage + last_email_at)

BEGIN;

ALTER TABLE email_subscribers
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS sequence_stage INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_at TIMESTAMPTZ;

-- Backfill tokens for rows that existed before the default was added.
UPDATE email_subscribers
SET unsubscribe_token = encode(gen_random_bytes(16), 'hex')
WHERE unsubscribe_token IS NULL;

ALTER TABLE email_subscribers
  ALTER COLUMN unsubscribe_token SET NOT NULL;

-- Cron loop scans by status + stage + last_email_at.
CREATE INDEX IF NOT EXISTS idx_email_subscribers_nurture
  ON email_subscribers (status, sequence_stage, last_email_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_email_subscribers_unsubscribe_token
  ON email_subscribers (unsubscribe_token);

COMMIT;
