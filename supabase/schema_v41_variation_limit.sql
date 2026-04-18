-- VedaWell Schema Migration v41: Server-side free-tier variation limit
-- Run in Supabase SQL Editor
-- Date: 2026-04-18
--
-- Closes P3-22: client-side FREE_VARIATION_LIMIT could be bypassed via direct
-- Supabase calls. This trigger enforces the 2-variation cap server-side for
-- free-tier users. Trial and guardian_pro users remain unrestricted.

BEGIN;

CREATE OR REPLACE FUNCTION enforce_free_variation_limit()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    owner_tier TEXT;
    current_count INT;
    free_limit INT := 2;
BEGIN
    -- Resolve project owner
    SELECT user_id INTO owner_id
    FROM projects
    WHERE id = NEW.project_id;

    IF owner_id IS NULL THEN
        RETURN NEW; -- orphan row, let FK handle it
    END IF;

    -- Resolve tier from profiles
    SELECT subscription_tier INTO owner_tier
    FROM profiles
    WHERE id = owner_id;

    -- Only enforce on free tier. Trial, guardian_pro and admin-ish values
    -- (anything not literally 'free') get unlimited.
    IF COALESCE(owner_tier, 'free') <> 'free' THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO current_count
    FROM variations
    WHERE project_id = NEW.project_id;

    IF current_count >= free_limit THEN
        RAISE EXCEPTION 'FREE_TIER_VARIATION_LIMIT: free plan allows % variations per project. Upgrade to Guardian Pro for unlimited.', free_limit
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_free_variation_limit ON variations;
CREATE TRIGGER trg_enforce_free_variation_limit
    BEFORE INSERT ON variations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_free_variation_limit();

COMMIT;
