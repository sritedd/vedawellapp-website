-- Schema v30: AI Conversation History
-- Stores AI chat conversations per project for persistence across sessions

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_project ON ai_conversations(project_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own conversations" ON ai_conversations
  FOR DELETE USING (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_conversations_updated ON ai_conversations;
CREATE TRIGGER ai_conversations_updated
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_ai_conversation_timestamp();
