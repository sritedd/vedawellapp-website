-- Schema v33: Multi-User / Family Sharing
-- Allows project owners to invite family/partners with role-based access

CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'collaborator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, invited_email)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_email ON project_members(invited_email);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Project owners can manage members
CREATE POLICY "Project owners can manage members" ON project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
  );

-- Members can view their own membership
CREATE POLICY "Members can view own membership" ON project_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can accept/decline their own invitations
CREATE POLICY "Users can update own invitations" ON project_members
  FOR UPDATE USING (user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_project_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_members_updated ON project_members;
CREATE TRIGGER project_members_updated
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION update_project_member_timestamp();
