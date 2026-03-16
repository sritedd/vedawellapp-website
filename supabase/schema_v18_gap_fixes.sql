-- ============================================================
-- Schema v18: Gap Analysis Fixes
-- Payment protection, project dates, stage timeline tracking
-- ============================================================

-- 1. New columns for projects (contract signing, handover, timeline)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_signed_date date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS handover_date date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_end_date date;

-- 2. New columns for stages (timeline + payment tracking)
ALTER TABLE stages ADD COLUMN IF NOT EXISTS payment_percentage numeric DEFAULT 0;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS expected_start_date date;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS expected_end_date date;

-- 3. NEW payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'paid', 'blocked')),
  due_date date,
  paid_date date,
  paid_amount numeric DEFAULT 0,
  certificates_required text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = payments.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = payments.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = payments.project_id AND projects.user_id = auth.uid())
);

-- 5. Index for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
