-- Schema v26: Security Hardening
-- Prevents users from modifying subscription_tier, is_admin, trial_ends_at via direct Supabase calls
-- MUST be run on Supabase SQL Editor

-- 1. Drop the overly permissive profile update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Create a restricted update policy that prevents users from changing sensitive columns
-- Users can update their own profile, but subscription_tier, is_admin, and trial_ends_at
-- must remain unchanged (only server-side service role can modify these)
CREATE POLICY "Users can update own profile (restricted)" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND subscription_tier IS NOT DISTINCT FROM (SELECT subscription_tier FROM profiles WHERE id = auth.uid())
    AND is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM profiles WHERE id = auth.uid())
    AND trial_ends_at IS NOT DISTINCT FROM (SELECT trial_ends_at FROM profiles WHERE id = auth.uid())
    AND referral_count IS NOT DISTINCT FROM (SELECT referral_count FROM profiles WHERE id = auth.uid())
  );

-- 3. Verify: test that a user cannot update their own tier
-- (Run this as a test after applying the policy)
-- UPDATE profiles SET subscription_tier = 'guardian_pro' WHERE id = auth.uid();
-- Should fail with RLS violation
