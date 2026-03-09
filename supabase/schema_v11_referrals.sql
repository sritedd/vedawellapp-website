-- ================================================
-- SCHEMA V11: Referral system
-- Run this in Supabase SQL Editor after schema_v10
-- ================================================

-- Add referral columns to profiles (safe if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_count') THEN
    ALTER TABLE profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);
  END IF;
END;
$$;

-- Index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- ================================================
-- DONE
-- ================================================
