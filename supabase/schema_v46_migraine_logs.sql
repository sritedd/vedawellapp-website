-- VedaWell Schema Migration v46: Migraine tracker per-user log
-- Run in Supabase SQL Editor
-- Date: 2026-07-25
--
-- Backs the /tools/migraine-tracker tool. Anonymous users keep their log in
-- localStorage; signed-in users get it synced to their account (this table).
-- One row per user, holding the whole log as a JSON blob — matches how the
-- tool already serialises {entries, preventive, lastExport} for storage/export.

BEGIN;

CREATE TABLE IF NOT EXISTS migraine_logs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE migraine_logs ENABLE ROW LEVEL SECURITY;

-- User-scoped: a user can only ever see or touch their own row.
DROP POLICY IF EXISTS "migraine_logs_select" ON migraine_logs;
CREATE POLICY "migraine_logs_select" ON migraine_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "migraine_logs_insert" ON migraine_logs;
CREATE POLICY "migraine_logs_insert" ON migraine_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "migraine_logs_update" ON migraine_logs;
CREATE POLICY "migraine_logs_update" ON migraine_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "migraine_logs_delete" ON migraine_logs;
CREATE POLICY "migraine_logs_delete" ON migraine_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Keep updated_at honest on every write.
CREATE OR REPLACE FUNCTION touch_migraine_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_migraine_logs_updated_at ON migraine_logs;
CREATE TRIGGER trg_migraine_logs_updated_at
    BEFORE UPDATE ON migraine_logs
    FOR EACH ROW
    EXECUTE FUNCTION touch_migraine_logs_updated_at();

COMMIT;
