-- VedaWell Revenue Sprint: Schema additions
-- Run this after schema_v2.sql

-- 1. Add subscription fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'guardian_pro')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ;

-- Index for webhook lookups by stripe customer ID
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 2. Email subscribers table
CREATE TABLE IF NOT EXISTS email_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'unknown',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Allow inserts from authenticated and anonymous users (for newsletter signup)
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (subscribe)
CREATE POLICY "Anyone can subscribe" ON email_subscribers
    FOR INSERT WITH CHECK (true);

-- Only service role can read/update/delete (for admin/email sending)
CREATE POLICY "Service role can manage subscribers" ON email_subscribers
    FOR ALL USING (auth.role() = 'service_role');

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);
