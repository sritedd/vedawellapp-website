-- ================================================
-- LOCAL TEST SCHEMA for guardian_test database
-- Standalone — no Supabase auth.* dependencies
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'homeowner' CHECK (role IN ('homeowner', 'builder', 'certifier')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'guardian_pro')),
  stripe_customer_id TEXT,
  subscription_updated_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  builder_name TEXT,
  contract_value NUMERIC,
  start_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'paused')),
  address TEXT,
  builder_license_number TEXT,
  builder_abn TEXT,
  hbcf_policy_number TEXT,
  insurance_expiry_date DATE,
  handover_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- STAGES
CREATE TABLE IF NOT EXISTS stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified')),
  completion_date DATE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CHECKLIST ITEMS
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id UUID REFERENCES stages(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  evidence_url TEXT,
  is_critical BOOLEAN DEFAULT false,
  requires_photo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- VARIATIONS
CREATE TABLE IF NOT EXISTS variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  additional_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  approved_by_user_at TIMESTAMPTZ,
  builder_signature_url TEXT,
  homeowner_signature_url TEXT,
  signed_at TIMESTAMPTZ,
  reason_category TEXT CHECK (reason_category IN ('design_change', 'site_condition', 'regulatory', 'builder_error')),
  labour_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DEFECTS
CREATE TABLE IF NOT EXISTS defects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reported', 'in_progress', 'fixed', 'rectified', 'verified', 'disputed')),
  image_url TEXT,
  location TEXT,
  due_date DATE,
  reported_date DATE DEFAULT CURRENT_DATE,
  rectified_date DATE,
  verified_date DATE,
  homeowner_notes TEXT,
  builder_notes TEXT,
  reminder_count INTEGER DEFAULT 0,
  stage TEXT,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CERTIFICATIONS
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

-- INSPECTIONS
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,
  scheduled_date DATE,
  result TEXT DEFAULT 'not_booked' CHECK (result IN ('not_booked', 'booked', 'passed', 'failed')),
  inspector_name TEXT,
  inspector TEXT,
  notes TEXT,
  report_url TEXT,
  certificate_received BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WEEKLY CHECK-INS
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  builder_responsive BOOLEAN,
  received_update BOOLEAN,
  notes TEXT,
  status TEXT DEFAULT 'on_track',
  weather TEXT,
  workers_on_site INTEGER DEFAULT 0,
  work_completed TEXT,
  next_week_plan TEXT,
  issues TEXT[],
  photos_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COMMUNICATION LOG
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'sms', 'site_visit', 'meeting')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  details TEXT,
  builder_response TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROGRESS PHOTOS
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATERIALS
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  supplier TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITE VISITS
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  duration TEXT,
  purpose TEXT,
  attendees TEXT[],
  observations TEXT,
  concerns TEXT[],
  follow_up_actions TEXT[],
  weather_conditions TEXT,
  workers_on_site INTEGER DEFAULT 0,
  photos_taken INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT MILESTONES
CREATE TABLE IF NOT EXISTS payment_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_name TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')),
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_stages_project ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_stage ON checklist_items(stage_id);
CREATE INDEX IF NOT EXISTS idx_defects_project ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_due_date ON defects(project_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variations_project ON variations(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_certifications_project ON certifications(project_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_project ON communication_log(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_photos_project ON progress_photos(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_project ON site_visits(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_project ON weekly_checkins(project_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_project ON payment_milestones(project_id);
