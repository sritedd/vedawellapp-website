-- ================================================
-- SCHEMA V28: Defect SLA tracking and aging columns
-- Adds escalation tracking, SLA days, and notification timestamps
-- Safe to re-run (uses IF NOT EXISTS)
-- ================================================

DO $$
BEGIN
  -- When defect was first reported to builder (formal notification)
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ DEFAULT now();

  -- When formal notice was sent to builder
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS builder_notified_at TIMESTAMPTZ;

  -- When builder acknowledged the defect
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS builder_acknowledged_at TIMESTAMPTZ;

  -- Current escalation level
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS escalation_level TEXT DEFAULT 'none';

  -- When the last escalation action was taken
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS last_escalation_at TIMESTAMPTZ;

  -- SLA: number of days builder has to respond before considered overdue
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS sla_days INTEGER DEFAULT 14;
END;
$$;

-- Add check constraint for escalation_level (drop first if exists to be idempotent)
ALTER TABLE defects DROP CONSTRAINT IF EXISTS defects_escalation_level_check;
ALTER TABLE defects ADD CONSTRAINT defects_escalation_level_check
  CHECK (escalation_level IN ('none', 'reminder_sent', 'formal_notice', 'fair_trading', 'tribunal'));

-- Backfill reported_at from created_at for existing rows that have no value
UPDATE defects
SET reported_at = created_at
WHERE reported_at IS NULL;

-- Index for SLA queries (find overdue defects efficiently)
CREATE INDEX IF NOT EXISTS idx_defects_sla_overdue
  ON defects(project_id, reported_at, sla_days)
  WHERE status NOT IN ('verified', 'rectified');

-- Index for escalation queries
CREATE INDEX IF NOT EXISTS idx_defects_escalation
  ON defects(escalation_level, last_escalation_at)
  WHERE status NOT IN ('verified', 'rectified');

-- ================================================
-- DONE — Run after schema_v27
-- ================================================
