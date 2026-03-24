-- Schema v29: Account deletion audit log
-- This table logs account deletions for audit purposes.
-- Only accessed via service-role, so no RLS needed.

CREATE TABLE IF NOT EXISTS account_deletion_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    project_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMPTZ DEFAULT now()
);
