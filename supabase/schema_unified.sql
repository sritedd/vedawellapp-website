-- ===========================================================================
-- Guardian Unified Schema — All tables, RLS policies, indexes, triggers
-- Generated: 2026-03-23 from schema.sql + schema_v2..v35
--
-- WARNING: This is a REFERENCE file showing the final state of the database.
-- DO NOT run this on an existing database — it will conflict with existing
-- objects. Use individual migration files for incremental changes.
-- For a fresh Supabase project, run this file once.
-- ===========================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: TABLES (final column definitions, all migrations merged)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1.01 profiles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email                 TEXT,
  full_name             TEXT,
  phone                 TEXT,
  role                  TEXT DEFAULT 'homeowner' CHECK (role IN ('homeowner', 'builder', 'certifier')),
  -- Subscription & billing (v3)
  subscription_tier     TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'guardian_pro', 'trial')),
  stripe_customer_id    TEXT,
  subscription_updated_at TIMESTAMPTZ,
  -- Admin & trial (v6)
  is_admin              BOOLEAN DEFAULT false,
  trial_ends_at         TIMESTAMPTZ,
  -- Analytics (v4)
  last_seen_at          TIMESTAMPTZ,
  -- Referral (v11)
  referral_code         TEXT UNIQUE,
  referral_count        INTEGER DEFAULT 0,
  referred_by           UUID REFERENCES auth.users(id),
  -- Phone verification (v21)
  phone_verified        BOOLEAN DEFAULT false,
  phone_verified_at     TIMESTAMPTZ,
  phone_otp_hash        TEXT,
  phone_otp_expires_at  TIMESTAMPTZ,
  phone_otp_attempts    INT DEFAULT 0,
  -- Email verification (v25)
  email_verified_override BOOLEAN DEFAULT false,
  -- Identity verification (v27)
  identity_verified     BOOLEAN DEFAULT false,
  identity_verified_at  TIMESTAMPTZ,
  -- MFA (v35)
  mfa_enabled           BOOLEAN DEFAULT false,
  mfa_verified_at       TIMESTAMPTZ,
  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.02 projects ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) NOT NULL,
  name                  TEXT NOT NULL,
  builder_name          TEXT,
  contract_value        NUMERIC,
  start_date            DATE,
  status                TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'paused')),
  address               TEXT,
  -- Builder info (v2)
  builder_license_number TEXT,
  builder_abn           TEXT,
  hbcf_policy_number    TEXT,
  insurance_expiry_date DATE,
  -- Dates (v12, v18)
  handover_date         DATE,
  contract_signed_date  DATE,
  expected_end_date     DATE,
  -- State workflow (v17)
  state                 TEXT DEFAULT 'NSW',
  build_category        TEXT DEFAULT 'new_build',
  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.03 stages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stages (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name                  TEXT NOT NULL,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified')),
  completion_date       DATE,
  order_index           INTEGER,          -- v15
  payment_percentage    NUMERIC DEFAULT 0, -- v18
  expected_start_date   DATE,             -- v18
  expected_end_date     DATE,             -- v18
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.04 checklist_items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_items (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stage_id              UUID REFERENCES stages(id) ON DELETE CASCADE NOT NULL,
  description           TEXT NOT NULL,
  is_completed          BOOLEAN DEFAULT false,
  completed_at          TIMESTAMPTZ,
  evidence_url          TEXT,
  is_critical           BOOLEAN DEFAULT false,   -- v2
  requires_photo        BOOLEAN DEFAULT false,   -- v2
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.05 variations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS variations (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  additional_cost       NUMERIC DEFAULT 0,
  status                TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  approved_by_user_at   TIMESTAMPTZ,
  -- Signatures (v2)
  builder_signature_url TEXT,
  homeowner_signature_url TEXT,
  signed_at             TIMESTAMPTZ,
  reason_category       TEXT CHECK (reason_category IN ('design_change', 'site_condition', 'regulatory', 'builder_error')),
  labour_cost           NUMERIC DEFAULT 0,
  material_cost         NUMERIC DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.06 defects ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS defects (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  severity              TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical', 'cosmetic')),
  status                TEXT DEFAULT 'open' CHECK (status IN ('open', 'reported', 'in_progress', 'fixed', 'rectified', 'verified', 'disputed')),
  image_url             TEXT,
  location              TEXT,
  stage                 TEXT,                     -- v14
  -- Date tracking (v14)
  due_date              DATE,
  reported_date         DATE DEFAULT CURRENT_DATE,
  rectified_date        DATE,
  verified_date         DATE,
  -- Notes (v14)
  homeowner_notes       TEXT,
  builder_notes         TEXT,
  reminder_count        INTEGER DEFAULT 0,        -- v14
  override_reason       TEXT,                     -- v15
  -- SLA tracking (v28)
  reported_at           TIMESTAMPTZ DEFAULT now(),
  builder_notified_at   TIMESTAMPTZ,
  builder_acknowledged_at TIMESTAMPTZ,
  escalation_level      TEXT DEFAULT 'none' CHECK (escalation_level IN ('none', 'reminder_sent', 'formal_notice', 'fair_trading', 'tribunal')),
  last_escalation_at    TIMESTAMPTZ,
  sla_days              INTEGER DEFAULT 14,
  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.07 certifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type                  TEXT NOT NULL,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'expired')),
  file_url              TEXT,
  expiry_date           DATE,
  required_for_stage    TEXT,
  uploaded_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.08 inspections ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage                 TEXT,
  scheduled_date        DATE,
  result                TEXT DEFAULT 'not_booked' CHECK (result IN ('not_booked', 'booked', 'passed', 'failed')),
  inspector_name        TEXT,
  inspector             TEXT,
  notes                 TEXT,
  report_url            TEXT,
  certificate_received  BOOLEAN DEFAULT false,    -- v15
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.09 weekly_checkins ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  week_start            DATE NOT NULL,
  builder_responsive    BOOLEAN,
  received_update       BOOLEAN,
  notes                 TEXT,
  -- Extended columns (v16)
  status                TEXT DEFAULT 'on_track',
  weather               TEXT,
  workers_on_site       INTEGER DEFAULT 0,
  work_completed        TEXT,
  next_week_plan        TEXT,
  issues                TEXT[],
  photos_count          INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.10 documents ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type                  TEXT,
  name                  TEXT NOT NULL,
  file_url              TEXT NOT NULL,
  uploaded_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.11 payments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id            UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_name            TEXT NOT NULL,
  percentage            NUMERIC NOT NULL DEFAULT 0,
  amount                NUMERIC NOT NULL DEFAULT 0,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'paid', 'blocked')),
  due_date              DATE,
  paid_date             DATE,
  paid_amount           NUMERIC DEFAULT 0,
  certificates_required TEXT[] DEFAULT '{}',
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── 1.12 communication_log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communication_log (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('call', 'email', 'sms', 'site_visit', 'meeting')),
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  summary               TEXT NOT NULL,
  details               TEXT,
  builder_response      TEXT,
  follow_up_required    BOOLEAN DEFAULT false,
  follow_up_date        DATE,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.13 progress_photos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_photos (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage                 TEXT NOT NULL,
  area                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  photo_url             TEXT NOT NULL,
  tags                  TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.14 materials ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category              TEXT NOT NULL,
  name                  TEXT NOT NULL,
  brand                 TEXT,
  model                 TEXT,
  color                 TEXT,
  supplier              TEXT,
  location              TEXT,
  verified              BOOLEAN DEFAULT false,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.15 site_visits ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_visits (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  time                  TEXT,
  duration              TEXT,
  purpose               TEXT,
  attendees             TEXT[],
  observations          TEXT,
  concerns              TEXT[],
  follow_up_actions     TEXT[],
  weather_conditions    TEXT,
  workers_on_site       INTEGER DEFAULT 0,
  photos_taken          INTEGER DEFAULT 0,
  -- Evidence mode (v34)
  gps_lat               DOUBLE PRECISION,
  gps_lng               DOUBLE PRECISION,
  gps_accuracy          DOUBLE PRECISION,
  weather_temp          TEXT,
  weather_description   TEXT,
  evidence_mode         BOOLEAN DEFAULT false,
  voice_notes           TEXT,
  area_tags             TEXT[],
  trade_tags            TEXT[],
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.16 email_subscribers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_subscribers (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  source                TEXT DEFAULT 'unknown',
  status                TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.17 tool_usage ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_usage (
  tool_slug             TEXT PRIMARY KEY,
  use_count             BIGINT DEFAULT 0,
  last_used_at          TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.18 announcements ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message               TEXT NOT NULL,
  type                  TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  active                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  created_by            UUID REFERENCES auth.users(id)
);

-- ── 1.19 support_messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_messages (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message               TEXT NOT NULL,
  is_admin_reply        BOOLEAN DEFAULT false,
  admin_id              UUID REFERENCES auth.users(id),
  read_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.20 knowledge_base (RAG) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content               TEXT NOT NULL,
  category              TEXT NOT NULL,
  state                 TEXT,
  stage                 TEXT,
  embedding             vector(1536),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.21 ai_cache ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_cache (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key             TEXT UNIQUE NOT NULL,
  response              JSONB NOT NULL,
  model                 TEXT NOT NULL,
  tokens_used           INT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL
);

-- ── 1.22 pre_handover_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pre_handover_items (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_key              TEXT NOT NULL,
  category              TEXT NOT NULL,
  text                  TEXT NOT NULL,
  found                 BOOLEAN NOT NULL DEFAULT false,
  description           TEXT NOT NULL DEFAULT '',
  location              TEXT NOT NULL DEFAULT '',
  severity              TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor', 'cosmetic')),
  photo_note            TEXT NOT NULL DEFAULT '',
  is_custom             BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, item_key)
);

-- ── 1.23 contract_review_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_review_items (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id               TEXT NOT NULL,
  checked               BOOLEAN NOT NULL DEFAULT false,
  checked_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, item_id)
);

-- ── 1.24 builder_reviews ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS builder_reviews (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_rating        INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  categories            JSONB NOT NULL DEFAULT '{}',
  review_text           TEXT NOT NULL DEFAULT '',
  recommend             BOOLEAN NOT NULL,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- ── 1.25 ai_conversations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL DEFAULT 'New Conversation',
  messages              JSONB NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.26 activity_log (append-only) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action                TEXT NOT NULL,
  entity_type           TEXT NOT NULL,
  entity_id             UUID,
  old_values            JSONB,
  new_values            JSONB,
  metadata              JSONB,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.27 escalations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escalations (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  defect_id             UUID REFERENCES defects(id) ON DELETE SET NULL,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level                 INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 4),
  status                TEXT NOT NULL DEFAULT 'active',
  builder_name          TEXT,
  builder_email         TEXT,
  notes                 TEXT,
  letter_type           TEXT,
  letter_generated_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.28 project_members ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email         TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'collaborator', 'viewer')),
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, invited_email)
);

-- ── 1.29 allowances ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allowances (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category              TEXT NOT NULL,
  item_name             TEXT NOT NULL,
  allowance_type        TEXT NOT NULL DEFAULT 'pc' CHECK (allowance_type IN ('pc', 'ps')),
  contract_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount         NUMERIC(12,2),
  supplier              TEXT,
  notes                 TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'ordered', 'installed')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.30 notification_preferences ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  defect_reminders      BOOLEAN DEFAULT true,
  payment_alerts        BOOLEAN DEFAULT true,
  certificate_expiry    BOOLEAN DEFAULT true,
  weekly_digest         BOOLEAN DEFAULT true,
  warranty_reminders    BOOLEAN DEFAULT true,
  insurance_expiry      BOOLEAN DEFAULT true,
  web_push_enabled      BOOLEAN DEFAULT false,
  push_subscription     JSONB,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.31 ncc_checklist_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ncc_checklist_items (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_key              TEXT NOT NULL,
  checked               BOOLEAN DEFAULT false,
  checked_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, item_key)
);

-- ── 1.32 account_deletion_log (audit) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_deletion_log (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL,
  email                 TEXT NOT NULL,
  project_count         INTEGER DEFAULT 0,
  deleted_at            TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: INDEXES (comprehensive, all tables)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── profiles ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at) WHERE last_seen_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends ON profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON profiles(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON profiles(phone_verified) WHERE phone IS NOT NULL;

-- ── projects ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_id_user ON projects(id, user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ── stages ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_project_created ON stages(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stages_project_order ON stages(project_id, order_index);

-- ── checklist_items ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_checklist_items_stage_id ON checklist_items(stage_id);

-- ── variations ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_variations_project_id ON variations(project_id);
CREATE INDEX IF NOT EXISTS idx_variations_project_status ON variations(project_id, status);

-- ── defects ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_project_status ON defects(project_id, status);
CREATE INDEX IF NOT EXISTS idx_defects_open ON defects(project_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_defects_due_date ON defects(project_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_defects_sla_overdue ON defects(project_id, reported_at, sla_days) WHERE status NOT IN ('verified', 'rectified');
CREATE INDEX IF NOT EXISTS idx_defects_escalation ON defects(escalation_level, last_escalation_at) WHERE status NOT IN ('verified', 'rectified');
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(project_id, severity);

-- ── certifications ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_certifications_project_id ON certifications(project_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON certifications(expiry_date) WHERE expiry_date IS NOT NULL;

-- ── inspections ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_scheduled ON inspections(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- ── weekly_checkins ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_project_id ON weekly_checkins(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_project ON weekly_checkins(project_id, week_start DESC);

-- ── documents ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_uploaded ON documents(project_id, uploaded_at DESC);

-- ── payments ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date) WHERE due_date IS NOT NULL;

-- ── communication_log ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_communication_log_project ON communication_log(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_communication_log_followup ON communication_log(follow_up_date) WHERE follow_up_required = true AND follow_up_date IS NOT NULL;

-- ── progress_photos ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_progress_photos_project ON progress_photos(project_id, created_at DESC);

-- ── materials ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);

-- ── site_visits ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_site_visits_project ON site_visits(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_evidence ON site_visits(project_id) WHERE evidence_mode = true;

-- ── email_subscribers ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);

-- ── tool_usage ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tool_usage_count ON tool_usage(use_count DESC);

-- ── support_messages ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON support_messages(is_admin_reply, read_at) WHERE read_at IS NULL;

-- ── knowledge_base ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── ai_cache ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON ai_cache(expires_at);

-- ── pre_handover_items ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pre_handover_items_project ON pre_handover_items(project_id);

-- ── contract_review_items ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contract_review_items_project ON contract_review_items(project_id);

-- ── builder_reviews ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_builder_reviews_project ON builder_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_builder_reviews_user ON builder_reviews(user_id);

-- ── ai_conversations ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project ON ai_conversations(project_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);

-- ── activity_log ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- ── escalations ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_escalations_project ON escalations(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_defect ON escalations(defect_id);

-- ── project_members ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_email ON project_members(invited_email);

-- ── allowances ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_allowances_project ON allowances(project_id);

-- ── notification_preferences ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- ── ncc_checklist_items ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ncc_checklist_project ON ncc_checklist_items(project_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Auto-create profile on signup ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'homeowner')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Admin check (avoids RLS recursion on profiles) ──────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── Pro access check (subscription + trial + admin) ─────────────────────────
CREATE OR REPLACE FUNCTION public.has_pro_access(user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND (
      subscription_tier = 'guardian_pro'
      OR is_admin = true
      OR (subscription_tier = 'trial' AND trial_ends_at > now())
    )
  );
$$;

-- ── Tool usage increment (atomic upsert) ────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_tool_usage(slug TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO tool_usage (tool_slug, use_count, last_used_at, updated_at)
  VALUES (slug, 1, NOW(), NOW())
  ON CONFLICT (tool_slug)
  DO UPDATE SET
    use_count    = tool_usage.use_count + 1,
    last_used_at = NOW(),
    updated_at   = NOW();
END;
$$;

-- ── Generic updated_at trigger function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

-- Auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- pre_handover_items updated_at
DROP TRIGGER IF EXISTS trg_pre_handover_updated_at ON pre_handover_items;
CREATE TRIGGER trg_pre_handover_updated_at
  BEFORE UPDATE ON pre_handover_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- contract_review_items updated_at
DROP TRIGGER IF EXISTS set_contract_review_items_updated_at ON contract_review_items;
CREATE TRIGGER set_contract_review_items_updated_at
  BEFORE UPDATE ON contract_review_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- builder_reviews updated_at
DROP TRIGGER IF EXISTS set_builder_reviews_updated_at ON builder_reviews;
CREATE TRIGGER set_builder_reviews_updated_at
  BEFORE UPDATE ON builder_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ai_conversations updated_at
DROP TRIGGER IF EXISTS ai_conversations_updated ON ai_conversations;
CREATE TRIGGER ai_conversations_updated
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- escalations updated_at
DROP TRIGGER IF EXISTS escalations_updated ON escalations;
CREATE TRIGGER escalations_updated
  BEFORE UPDATE ON escalations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- project_members updated_at
DROP TRIGGER IF EXISTS project_members_updated ON project_members;
CREATE TRIGGER project_members_updated
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- allowances updated_at
DROP TRIGGER IF EXISTS allowances_updated ON allowances;
CREATE TRIGGER allowances_updated
  BEFORE UPDATE ON allowances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- notification_preferences updated_at
DROP TRIGGER IF EXISTS notification_prefs_updated ON notification_preferences;
CREATE TRIGGER notification_prefs_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: ROW LEVEL SECURITY (all tables)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncc_checklist_items ENABLE ROW LEVEL SECURITY;

-- ── profiles ────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile (restricted)" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND subscription_tier IS NOT DISTINCT FROM (SELECT subscription_tier FROM profiles WHERE id = auth.uid())
    AND is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM profiles WHERE id = auth.uid())
    AND trial_ends_at IS NOT DISTINCT FROM (SELECT trial_ends_at FROM profiles WHERE id = auth.uid())
    AND referral_count IS NOT DISTINCT FROM (SELECT referral_count FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- ── projects ────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all projects" ON projects FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can create own projects" ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_pro_access(auth.uid())
      OR (NOT public.has_pro_access(auth.uid()) AND (SELECT count(*) FROM projects WHERE projects.user_id = auth.uid()) < 1)
    )
  );
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- ── Helper macro: project ownership check ───────────────────────────────────
-- Most child tables use: EXISTS (SELECT 1 FROM projects WHERE projects.id = <table>.project_id AND projects.user_id = auth.uid())

-- ── stages ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own project stages" ON stages FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = stages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project stages" ON stages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own stages" ON stages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = stages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own stages" ON stages FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = stages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all stages" ON stages FOR SELECT USING (public.is_admin());

-- ── checklist_items ─────────────────────────────────────────────────────────
CREATE POLICY "Users can view own checklist items" ON checklist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM stages JOIN projects ON projects.id = stages.project_id WHERE stages.id = checklist_items.stage_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own checklist items" ON checklist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stages JOIN projects ON projects.id = stages.project_id WHERE stages.id = stage_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own checklist items" ON checklist_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stages JOIN projects ON projects.id = stages.project_id WHERE stages.id = checklist_items.stage_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all checklist_items" ON checklist_items FOR SELECT USING (public.is_admin());

-- ── variations ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own project variations" ON variations FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project variations" ON variations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  AND (public.has_pro_access(auth.uid()) OR (NOT public.has_pro_access(auth.uid()) AND (SELECT count(*) FROM variations WHERE variations.project_id = project_id) < 2)));
CREATE POLICY "Users can update own variations" ON variations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own variations" ON variations FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = variations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all variations" ON variations FOR SELECT USING (public.is_admin());

-- ── defects ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own project defects" ON defects FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project defects" ON defects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  AND (public.has_pro_access(auth.uid()) OR (NOT public.has_pro_access(auth.uid()) AND (SELECT count(*) FROM defects WHERE defects.project_id = project_id) < 3)));
CREATE POLICY "Users can update own project defects" ON defects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project defects" ON defects FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = defects.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all defects" ON defects FOR SELECT USING (public.is_admin());

-- ── certifications ──────────────────────────────────────────────────────────
CREATE POLICY "Users can view own certifications" ON certifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own certifications" ON certifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own certifications" ON certifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own certifications" ON certifications FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = certifications.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all certifications" ON certifications FOR SELECT USING (public.is_admin());

-- ── inspections ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own inspections" ON inspections FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = inspections.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can manage own inspections" ON inspections FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = inspections.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all inspections" ON inspections FOR SELECT USING (public.is_admin());

-- ── weekly_checkins ─────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own checkins" ON weekly_checkins FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = weekly_checkins.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all weekly_checkins" ON weekly_checkins FOR SELECT USING (public.is_admin());

-- ── documents ───────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own documents" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = documents.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all documents" ON documents FOR SELECT USING (public.is_admin());

-- ── payments ────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = payments.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = payments.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = payments.project_id AND projects.user_id = auth.uid()));

-- ── communication_log ───────────────────────────────────────────────────────
CREATE POLICY "Users can view own comms" ON communication_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = communication_log.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own comms" ON communication_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own comms" ON communication_log FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = communication_log.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own comms" ON communication_log FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = communication_log.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all communication_log" ON communication_log FOR SELECT USING (public.is_admin());

-- ── progress_photos ─────────────────────────────────────────────────────────
CREATE POLICY "Users can view own photos" ON progress_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = progress_photos.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own photos" ON progress_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own photos" ON progress_photos FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = progress_photos.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Admins can read all progress_photos" ON progress_photos FOR SELECT USING (public.is_admin());

-- ── materials ───────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own materials" ON materials FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid()));

-- ── site_visits ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own site visits" ON site_visits FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = site_visits.project_id AND projects.user_id = auth.uid()));

-- ── email_subscribers ───────────────────────────────────────────────────────
CREATE POLICY "Anyone can subscribe" ON email_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage subscribers" ON email_subscribers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read all email_subscribers" ON email_subscribers FOR SELECT USING (public.is_admin());

-- ── tool_usage ──────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can read tool usage" ON tool_usage FOR SELECT USING (true);
CREATE POLICY "Service role manages tool usage" ON tool_usage FOR ALL USING (auth.role() = 'service_role');

-- ── announcements ───────────────────────────────────────────────────────────
CREATE POLICY "Anyone can read active announcements" ON announcements FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (public.is_admin());

-- ── support_messages ────────────────────────────────────────────────────────
CREATE POLICY "Users read own messages" ON support_messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users send messages" ON support_messages FOR INSERT WITH CHECK (user_id = auth.uid() AND is_admin_reply = false);
CREATE POLICY "Users mark as read" ON support_messages FOR UPDATE
  USING (user_id = auth.uid() AND is_admin_reply = true)
  WITH CHECK (user_id = auth.uid() AND is_admin_reply = true);
CREATE POLICY "Admins read all messages" ON support_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins send replies" ON support_messages FOR INSERT WITH CHECK (public.is_admin() AND is_admin_reply = true);
CREATE POLICY "Admins update messages" ON support_messages FOR UPDATE USING (public.is_admin());

-- ── knowledge_base ──────────────────────────────────────────────────────────
CREATE POLICY "knowledge_base_read" ON knowledge_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "knowledge_base_service" ON knowledge_base FOR ALL TO service_role USING (true);

-- ── ai_cache ────────────────────────────────────────────────────────────────
CREATE POLICY "ai_cache_read" ON ai_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_cache_insert" ON ai_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ai_cache_update" ON ai_cache FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ai_cache_service" ON ai_cache FOR ALL TO service_role USING (true);

-- ── pre_handover_items ──────────────────────────────────────────────────────
CREATE POLICY "Users can view own pre-handover items" ON pre_handover_items FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own pre-handover items" ON pre_handover_items FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own pre-handover items" ON pre_handover_items FOR UPDATE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own pre-handover items" ON pre_handover_items FOR DELETE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ── contract_review_items ───────────────────────────────────────────────────
CREATE POLICY "Users manage own contract review items" ON contract_review_items FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ── builder_reviews ─────────────────────────────────────────────────────────
CREATE POLICY "Users manage own builder reviews" ON builder_reviews FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── ai_conversations ────────────────────────────────────────────────────────
CREATE POLICY "Users can view own conversations" ON ai_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON ai_conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON ai_conversations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own conversations" ON ai_conversations FOR DELETE USING (user_id = auth.uid());

-- ── activity_log (append-only: NO update/delete) ────────────────────────────
CREATE POLICY "Users can view own project logs" ON activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = activity_log.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project logs" ON activity_log FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── escalations ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own escalations" ON escalations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own escalations" ON escalations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own escalations" ON escalations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own escalations" ON escalations FOR DELETE USING (user_id = auth.uid());

-- ── project_members ─────────────────────────────────────────────────────────
CREATE POLICY "Project owners can manage members" ON project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Members can view own membership" ON project_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own invitations" ON project_members FOR UPDATE
  USING (user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ── allowances ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage own allowances" ON allowances FOR ALL USING (user_id = auth.uid());

-- ── notification_preferences ────────────────────────────────────────────────
CREATE POLICY "Users can manage own notification prefs" ON notification_preferences FOR ALL USING (user_id = auth.uid());

-- ── ncc_checklist_items ─────────────────────────────────────────────────────
CREATE POLICY "Users can manage own NCC checklist" ON ncc_checklist_items FOR ALL USING (user_id = auth.uid());


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: STORAGE BUCKETS & POLICIES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('evidence', 'evidence', true),
  ('documents', 'documents', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- User-scoped storage: users can only access files under their own projects
CREATE POLICY "Users can upload to own projects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('evidence', 'documents', 'certificates')
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can read own project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('evidence', 'documents', 'certificates')
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own project files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('evidence', 'documents', 'certificates')
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE user_id = auth.uid())
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: REALTIME PUBLICATION
-- ══════════════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE stages;
ALTER PUBLICATION supabase_realtime ADD TABLE defects;
ALTER PUBLICATION supabase_realtime ADD TABLE variations;
ALTER PUBLICATION supabase_realtime ADD TABLE inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE certifications;
ALTER PUBLICATION supabase_realtime ADD TABLE communication_log;
ALTER PUBLICATION supabase_realtime ADD TABLE progress_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE pre_handover_items;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE contract_review_items;
ALTER PUBLICATION supabase_realtime ADD TABLE builder_reviews;


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: GRANTS
-- ══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro_access(uuid) TO service_role;


-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION 9: SEED DATA (Admin users)
-- ══════════════════════════════════════════════════════════════════════════════

-- Set admin users (run after first login)
-- UPDATE profiles SET is_admin = true, subscription_tier = 'guardian_pro'
-- WHERE email IN ('sridhar.kothandam@gmail.com', 'sridharkothandan@vedawellapp.com');


-- ══════════════════════════════════════════════════════════════════════════════
-- END OF UNIFIED SCHEMA
-- 32 tables, 70+ indexes, 80+ RLS policies, 9 triggers, 4 functions
-- ══════════════════════════════════════════════════════════════════════════════
