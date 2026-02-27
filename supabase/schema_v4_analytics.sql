-- VedaWell Analytics: Schema v4
-- Run this in Supabase SQL editor after schema_v3_revenue.sql

-- 1. Add last_seen_at to profiles (updated each Guardian dashboard load)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Index for "active in last N days" queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at) WHERE last_seen_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);

-- 2. Tool usage counters (incremented via /api/track-tool)
CREATE TABLE IF NOT EXISTS tool_usage (
    tool_slug TEXT PRIMARY KEY,
    use_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: anyone can increment via the API route (uses service role key server-side)
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- Public read (for "Popular tools" display)
CREATE POLICY "Anyone can read tool usage" ON tool_usage
    FOR SELECT USING (true);

-- Only service role can insert/update (API route uses service role)
CREATE POLICY "Service role manages tool usage" ON tool_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Index for top-tools queries
CREATE INDEX IF NOT EXISTS idx_tool_usage_count ON tool_usage(use_count DESC);

-- 3. Increment function (called by /api/track-tool)
--    Upserts the row and atomically increments use_count
CREATE OR REPLACE FUNCTION increment_tool_usage(slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO tool_usage (tool_slug, use_count, last_used_at, updated_at)
    VALUES (slug, 1, NOW(), NOW())
    ON CONFLICT (tool_slug)
    DO UPDATE SET
        use_count    = tool_usage.use_count + 1,
        last_used_at = NOW(),
        updated_at   = NOW();
END;
$$;
