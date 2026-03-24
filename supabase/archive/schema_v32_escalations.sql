-- Schema v32: Builder Escalation Workflow
-- Tracks escalation steps for unresolved defects

CREATE TABLE IF NOT EXISTS escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  defect_id UUID REFERENCES defects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 4),
  status TEXT NOT NULL DEFAULT 'active',
  builder_name TEXT,
  builder_email TEXT,
  notes TEXT,
  letter_type TEXT,
  letter_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escalations_project ON escalations(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_defect ON escalations(defect_id);

ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own escalations" ON escalations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own escalations" ON escalations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own escalations" ON escalations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own escalations" ON escalations
  FOR DELETE USING (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_escalation_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escalations_updated ON escalations;
CREATE TRIGGER escalations_updated
  BEFORE UPDATE ON escalations
  FOR EACH ROW EXECUTE FUNCTION update_escalation_timestamp();
