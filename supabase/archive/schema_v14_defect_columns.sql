-- ================================================
-- SCHEMA V14: Add missing columns to defects table
-- Required by ProjectDefects and NotificationCenter components
-- Safe to re-run (uses IF NOT EXISTS / exception handling)
-- ================================================

-- 1. Add new columns (safe — does nothing if already exists)
DO $$
BEGIN
  -- Date tracking
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS due_date DATE;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS reported_date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS rectified_date DATE;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS verified_date DATE;

  -- Notes
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS homeowner_notes TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS builder_notes TEXT;

  -- Reminder tracking
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

  -- Build stage where defect was found
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS stage TEXT;
END;
$$;

-- 2. Update status check constraint to include 'rectified' status
-- (original only allows: open, fixed, verified — component uses rectified)
ALTER TABLE defects DROP CONSTRAINT IF EXISTS defects_status_check;
ALTER TABLE defects ADD CONSTRAINT defects_status_check
  CHECK (status IN ('open', 'fixed', 'rectified', 'verified'));

-- 3. Backfill reported_date from created_at for existing rows
UPDATE defects
SET reported_date = created_at::date
WHERE reported_date IS NULL;

-- 4. Index for due date queries (NotificationCenter filters defects due within 7 days)
CREATE INDEX IF NOT EXISTS idx_defects_due_date ON defects(project_id, due_date)
WHERE due_date IS NOT NULL;

-- ================================================
-- DONE — Run schema_v13 first if not already done
-- ================================================
