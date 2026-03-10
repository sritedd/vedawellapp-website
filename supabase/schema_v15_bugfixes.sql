-- ================================================
-- SCHEMA V15: Bug fixes for Guardian components
-- Fixes: missing order_index, defect status constraint,
--        inspection certificate_received, defect override_reason
-- Safe to re-run
-- ================================================

-- 1. Add order_index to stages table (ProjectOverview sorts by this)
ALTER TABLE stages ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Backfill order_index from created_at ordering per project
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) AS rn
  FROM stages
)
UPDATE stages SET order_index = numbered.rn
FROM numbered
WHERE stages.id = numbered.id AND stages.order_index IS NULL;

-- 2. Fix defect status CHECK constraint
--    Code uses: open, reported, in_progress, fixed, rectified, verified, disputed
--    Old constraint only allowed: open, fixed, rectified, verified
ALTER TABLE defects DROP CONSTRAINT IF EXISTS defects_status_check;
ALTER TABLE defects ADD CONSTRAINT defects_status_check
  CHECK (status IN ('open', 'reported', 'in_progress', 'fixed', 'rectified', 'verified', 'disputed'));

-- 3. Add override_reason to defects (for StageGate audit trail)
ALTER TABLE defects ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- 4. Add certificate_received to inspections table
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS certificate_received BOOLEAN DEFAULT false;

-- 5. Add scheduled_date to inspections (InspectionTimeline uses it)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- 6. Add inspector column if missing (InspectionTimeline uses it)
--    schema_v2 may have added it but let's be safe
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector TEXT;

-- 7. Add stage column to inspections (for grouping by stage)
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS stage TEXT;

-- ================================================
-- DONE — Run after schema_v14
-- ================================================
