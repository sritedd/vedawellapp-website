-- ================================================
-- SCHEMA V12: Communication log table + handover_date
-- Run this in Supabase SQL Editor after schema_v11
-- ================================================

-- 1. Add handover_date to projects (for warranty tracking)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS handover_date DATE;

-- 2. Communication log table
CREATE TABLE IF NOT EXISTS communication_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'sms', 'site_visit', 'meeting')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    details TEXT,
    builder_response TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_log_project ON communication_log(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_communication_log_followup ON communication_log(follow_up_date)
    WHERE follow_up_required = true AND follow_up_date IS NOT NULL;

ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;

-- Users can manage their own communication logs
DROP POLICY IF EXISTS "Users can view own comms" ON communication_log;
CREATE POLICY "Users can view own comms"
  ON communication_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = communication_log.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own comms" ON communication_log;
CREATE POLICY "Users can insert own comms"
  ON communication_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own comms" ON communication_log;
CREATE POLICY "Users can update own comms"
  ON communication_log FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = communication_log.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comms" ON communication_log;
CREATE POLICY "Users can delete own comms"
  ON communication_log FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = communication_log.project_id AND projects.user_id = auth.uid()));

-- Admin read access
DROP POLICY IF EXISTS "Admins can read all communication_log" ON communication_log;
CREATE POLICY "Admins can read all communication_log"
  ON communication_log FOR SELECT
  USING (public.is_admin());

-- ================================================
-- DONE
-- ================================================
