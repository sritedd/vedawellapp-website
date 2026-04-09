-- VedaWell Schema Migration v39: Enable RLS on exposed tables
-- Run in Supabase SQL Editor
-- Date: 2026-04-08
--
-- CRITICAL FIX: Supabase flagged account_deletion_log and stripe_webhook_events
-- as publicly accessible because RLS was not enabled. Both are service-role-only
-- tables — enabling RLS with no policies blocks anon/authenticated access while
-- service-role continues to bypass RLS as usual.

-- 1. account_deletion_log — audit table, service-role only
ALTER TABLE IF EXISTS account_deletion_log ENABLE ROW LEVEL SECURITY;

-- 2. stripe_webhook_events — webhook idempotency, service-role only
ALTER TABLE IF EXISTS stripe_webhook_events ENABLE ROW LEVEL SECURITY;
