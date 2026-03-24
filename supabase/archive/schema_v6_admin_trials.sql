-- ================================================
-- SCHEMA V6: Admin flag + Free trial support
-- Run this in Supabase SQL Editor after previous migrations
-- ================================================

-- 1. Add admin flag and trial expiry to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Update subscription_tier CHECK to include 'trial'
-- First drop existing check, then re-add with trial option
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'guardian_pro', 'trial'));

-- 3. Set admin users
UPDATE profiles SET is_admin = true, subscription_tier = 'guardian_pro'
WHERE email IN ('sridhar.kothandam@gmail.com', 'sridharkothandan@vedawellapp.com');

-- 4. Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- 5. Index for trial expiry queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends ON profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- 6. RLS policy: allow admins to read all profiles
-- (Existing RLS only lets users read their own profile)
-- Drop first to make this script re-runnable
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 7. RLS policy: allow admins to update any profile (for granting trials)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ================================================
-- DONE
-- After running this:
-- - Your two admin accounts have is_admin=true and guardian_pro tier
-- - Admins can read/update all profiles (for trial management)
-- - Users with trial_ends_at in the future get pro features
-- ================================================
