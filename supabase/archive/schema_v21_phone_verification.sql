-- schema_v21_phone_verification.sql
-- Phone verification for anti-abuse: unique phone per account, OTP before project creation

-- Add phone verification columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_otp_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_otp_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_otp_attempts int DEFAULT 0;

-- Unique constraint on phone (only for non-null, non-empty values)
-- This prevents multiple accounts with the same phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
    ON profiles (phone)
    WHERE phone IS NOT NULL AND phone != '';

-- Index for quick phone lookup during OTP verification
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified
    ON profiles (phone_verified)
    WHERE phone IS NOT NULL;
