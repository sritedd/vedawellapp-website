-- Schema v34: Sprint 4 — Site Diary Evidence, PC/PS Allowances
-- Combines multiple small tables into one migration

-- 1. Site Diary Evidence — extends site_visits with evidence-grade fields
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS gps_lat DOUBLE PRECISION;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS gps_lng DOUBLE PRECISION;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS gps_accuracy DOUBLE PRECISION;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS weather_temp TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS weather_description TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS evidence_mode BOOLEAN DEFAULT false;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS voice_notes TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS area_tags TEXT[];
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS trade_tags TEXT[];

-- 2. PC/PS (Prime Cost / Provisional Sum) Allowances
CREATE TABLE IF NOT EXISTS allowances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  allowance_type TEXT NOT NULL DEFAULT 'pc' CHECK (allowance_type IN ('pc', 'ps')),
  contract_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12,2),
  supplier TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'ordered', 'installed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allowances_project ON allowances(project_id);

ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own allowances" ON allowances
  FOR ALL USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_allowance_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS allowances_updated ON allowances;
CREATE TRIGGER allowances_updated
  BEFORE UPDATE ON allowances
  FOR EACH ROW EXECUTE FUNCTION update_allowance_timestamp();
