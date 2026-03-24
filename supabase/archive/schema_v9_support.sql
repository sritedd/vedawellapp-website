-- ================================================
-- SCHEMA V9: Support messaging system
-- Run this in Supabase SQL Editor after schema_v8
-- ================================================

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT false,
    admin_id UUID REFERENCES auth.users(id),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON support_messages(is_admin_reply, read_at) WHERE read_at IS NULL;

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own messages (both sent and admin replies)
DROP POLICY IF EXISTS "Users read own messages" ON support_messages;
CREATE POLICY "Users read own messages"
  ON support_messages FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own messages (not admin replies)
DROP POLICY IF EXISTS "Users send messages" ON support_messages;
CREATE POLICY "Users send messages"
  ON support_messages FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_admin_reply = false);

-- Users can mark admin replies as read
DROP POLICY IF EXISTS "Users mark as read" ON support_messages;
CREATE POLICY "Users mark as read"
  ON support_messages FOR UPDATE
  USING (user_id = auth.uid() AND is_admin_reply = true)
  WITH CHECK (user_id = auth.uid() AND is_admin_reply = true);

-- Admins can read all messages
DROP POLICY IF EXISTS "Admins read all messages" ON support_messages;
CREATE POLICY "Admins read all messages"
  ON support_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Admins can insert replies
DROP POLICY IF EXISTS "Admins send replies" ON support_messages;
CREATE POLICY "Admins send replies"
  ON support_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) AND is_admin_reply = true);

-- Admins can update messages (mark as read etc)
DROP POLICY IF EXISTS "Admins update messages" ON support_messages;
CREATE POLICY "Admins update messages"
  ON support_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ================================================
-- DONE
-- ================================================
