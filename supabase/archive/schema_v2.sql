-- ================================================
-- COMPREHENSIVE GUARDIAN SCHEMA V2
-- Run this AFTER the initial schema.sql
-- ================================================

-- ================================================
-- VARIATIONS ENHANCEMENTS (Digital Signatures)
-- ================================================
ALTER TABLE variations ADD COLUMN IF NOT EXISTS builder_signature_url TEXT;
ALTER TABLE variations ADD COLUMN IF NOT EXISTS homeowner_signature_url TEXT;
ALTER TABLE variations ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE variations ADD COLUMN IF NOT EXISTS reason_category TEXT 
  CHECK (reason_category IN ('design_change', 'site_condition', 'regulatory', 'builder_error'));
ALTER TABLE variations ADD COLUMN IF NOT EXISTS labour_cost NUMERIC DEFAULT 0;
ALTER TABLE variations ADD COLUMN IF NOT EXISTS material_cost NUMERIC DEFAULT 0;

-- ================================================
-- CHECKLIST ITEMS ENHANCEMENTS (Critical Flag)
-- ================================================
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS requires_photo BOOLEAN DEFAULT false;

-- ================================================
-- CERTIFICATIONS (Payment Gating)
-- ================================================
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'expired')),
  file_url TEXT,
  expiry_date DATE,
  required_for_stage TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can insert own certifications" ON certifications;

CREATE POLICY "Users can view own certifications" ON certifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can insert own certifications" ON certifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);

-- ================================================
-- INSPECTIONS (Sequencer)
-- ================================================
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('footing', 'frame', 'waterproof', 'pre_plaster', 'final')),
  scheduled_date DATE,
  result TEXT DEFAULT 'not_booked' CHECK (result IN ('not_booked', 'booked', 'passed', 'failed')),
  inspector_name TEXT,
  notes TEXT,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can manage own inspections" ON inspections;

CREATE POLICY "Users can view own inspections" ON inspections FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = inspections.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can manage own inspections" ON inspections FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = inspections.project_id AND projects.user_id = auth.uid())
);

-- ================================================
-- WEEKLY CHECK-INS (Builder Accountability)
-- ================================================
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  builder_responsive BOOLEAN,
  received_update BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can manage own checkins" ON weekly_checkins;

CREATE POLICY "Users can manage own checkins" ON weekly_checkins FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = weekly_checkins.project_id AND projects.user_id = auth.uid())
);

-- ================================================
-- DOCUMENTS (Vault)
-- ================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;

CREATE POLICY "Users can manage own documents" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid())
);

-- ================================================
-- PROJECTS ENHANCEMENTS (Builder Info)
-- ================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS builder_license_number TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS builder_abn TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hbcf_policy_number TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;

-- ================================================
-- DONE - Run this in Supabase SQL Editor
-- ================================================

-- ================================================
-- SECURITY FIX: Missing RLS Policies for UPDATE/DELETE
-- These were identified in the security audit
-- ================================================

-- Variations: UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own variations" ON variations;
DROP POLICY IF EXISTS "Users can delete own variations" ON variations;

CREATE POLICY "Users can update own variations" ON variations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own variations" ON variations FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid())
);

-- Defects: UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own defects" ON defects;
DROP POLICY IF EXISTS "Users can delete own defects" ON defects;

CREATE POLICY "Users can update own defects" ON defects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own defects" ON defects FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid())
);

-- Stages: UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own stages" ON stages;
DROP POLICY IF EXISTS "Users can delete own stages" ON stages;

CREATE POLICY "Users can update own stages" ON stages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = stages.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own stages" ON stages FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = stages.project_id AND projects.user_id = auth.uid())
);

-- Documents: UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid())
);

-- Certifications: UPDATE/DELETE  
DROP POLICY IF EXISTS "Users can update own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can delete own certifications" ON certifications;

CREATE POLICY "Users can update own certifications" ON certifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own certifications" ON certifications FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid())
);

