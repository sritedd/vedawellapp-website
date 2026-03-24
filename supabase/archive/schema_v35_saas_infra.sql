-- Schema v35: SaaS Infrastructure — Notification prefs, NCC checklist to DB

-- 1. Notification Preferences (server-side, per-user)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  defect_reminders BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  certificate_expiry BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  warranty_reminders BOOLEAN DEFAULT true,
  insurance_expiry BOOLEAN DEFAULT true,
  web_push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification prefs" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_notification_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_prefs_updated ON notification_preferences;
CREATE TRIGGER notification_prefs_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_notification_prefs_timestamp();

-- 2. NCC Checklist Items (per-project, replaces localStorage)
CREATE TABLE IF NOT EXISTS ncc_checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_ncc_checklist_project ON ncc_checklist_items(project_id);

ALTER TABLE ncc_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own NCC checklist" ON ncc_checklist_items
  FOR ALL USING (user_id = auth.uid());

-- 3. Add TOTP/MFA columns to profiles (for 2FA tracking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMPTZ;
