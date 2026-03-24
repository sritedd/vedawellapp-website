-- Schema v25: Email verification override flag
-- Allows admins to bypass email verification for specific users

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified_override BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.email_verified_override IS 'Admin override: when true, skips email verification gate for project creation';
