-- Schema v36: AI Usage Telemetry + Cache RLS Fix
-- Run in Supabase SQL Editor

-- 1. AI Usage Log — track every AI request for cost monitoring, quotas, and optimization
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    feature text NOT NULL,  -- 'defect-assist', 'stage-advice', 'chat', 'builder-check', 'claim-review'
    model text NOT NULL,
    cache_hit boolean DEFAULT false,
    input_tokens int,
    output_tokens int,
    latency_ms int,
    success boolean DEFAULT true,
    error_code text,
    created_at timestamptz DEFAULT now()
);

-- Index for daily quota checks: how many requests has this user made today?
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_day
    ON ai_usage_log (user_id, created_at DESC);

-- Index for feature-level analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature
    ON ai_usage_log (feature, created_at DESC);

-- RLS: service-role only (no user access — this is server-side infra)
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
-- No policies = only service-role can read/write

-- 2. Fix ai_cache RLS — remove authenticated-user policies (security: BUG-2)
-- Cache is server-side infra. No user should read/write cache directly.
DO $$
BEGIN
    -- Drop any existing policies that allow authenticated users
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname = 'ai_cache_read') THEN
        DROP POLICY "ai_cache_read" ON ai_cache;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname = 'ai_cache_write') THEN
        DROP POLICY "ai_cache_write" ON ai_cache;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname = 'ai_cache_insert') THEN
        DROP POLICY "ai_cache_insert" ON ai_cache;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname = 'ai_cache_update') THEN
        DROP POLICY "ai_cache_update" ON ai_cache;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname = 'ai_cache_select') THEN
        DROP POLICY "ai_cache_select" ON ai_cache;
    END IF;
    -- Drop any "Users can" style policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_cache' AND policyname LIKE 'Users can%') THEN
        -- Get and drop each one
        PERFORM 1; -- policies will be dropped individually below
    END IF;
END $$;

-- Drop ALL remaining policies on ai_cache (belt and suspenders)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ai_cache'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON ai_cache', pol.policyname);
    END LOOP;
END $$;

-- Ensure RLS is enabled (service-role bypasses RLS, anon/authenticated are blocked)
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
-- No policies = only service-role can access. This is correct for cache.

-- 3. Webhook idempotency table (SEC-1)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    event_id text PRIMARY KEY,
    event_type text NOT NULL,
    processed_at timestamptz DEFAULT now()
);

-- Auto-cleanup old events (keep 30 days)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
    ON stripe_webhook_events (processed_at);
