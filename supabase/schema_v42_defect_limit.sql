-- VedaWell Schema Migration v42: Server-side free-tier defect limit
-- Run in Supabase SQL Editor
-- Date: 2026-04-20
--
-- Closes P5-1: client-side FREE_DEFECT_LIMIT in ProjectDefects.tsx could be
-- bypassed via direct Supabase calls. Mirrors the v41 trigger that already
-- enforces the 2-variation cap. Trial and guardian_pro users stay unrestricted.

BEGIN;

CREATE OR REPLACE FUNCTION enforce_free_defect_limit()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    owner_tier TEXT;
    current_count INT;
    free_limit INT := 3;
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
    FROM defects
    WHERE project_id = NEW.project_id;

    IF current_count >= free_limit THEN
        RAISE EXCEPTION 'FREE_TIER_DEFECT_LIMIT: free plan allows % defect reports per project. Upgrade to Guardian Pro for unlimited.', free_limit
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_free_defect_limit ON defects;
CREATE TRIGGER trg_enforce_free_defect_limit
    BEFORE INSERT ON defects
    FOR EACH ROW
    EXECUTE FUNCTION enforce_free_defect_limit();

COMMIT;
