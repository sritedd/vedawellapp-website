-- Schema v31: Activity / Audit Log
-- Append-only log of all project actions for evidence and accountability

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No updated_at — this table is append-only

CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view logs for their own projects
CREATE POLICY "Users can view own project logs" ON activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = activity_log.project_id AND projects.user_id = auth.uid())
  );

-- Users can insert logs for their own projects
CREATE POLICY "Users can insert own project logs" ON activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- NO UPDATE or DELETE policies — audit log is immutable
