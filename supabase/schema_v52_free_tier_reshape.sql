-- VedaWell Schema Migration v52: Free tier reshape
-- Run in Supabase SQL Editor
-- Date: 2026-09-09
--
-- Free = one project with the whole money loop and unlimited evidence capture;
-- Pro = evidence packaging, AI, more projects, sharing, the vault
-- (guide/19-USABILITY-AND-VALUE-GUIDE.md §1.3, §3.4).
--
-- The 3-defect and 2-variation caps (schema_v42, schema_v41) abandoned the free
-- project exactly when the evidence would start to matter — a real pre-handover
-- list has 30–100 items — so a free user never reached the moment where paying
-- makes sense. The 1-project cap (schema_v51) stays: it is the honest boundary.
--
-- Idempotent: safe to run twice.

BEGIN;

DROP TRIGGER IF EXISTS trg_enforce_free_defect_limit ON defects;
DROP FUNCTION IF EXISTS enforce_free_defect_limit();

DROP TRIGGER IF EXISTS trg_enforce_free_variation_limit ON variations;
DROP FUNCTION IF EXISTS enforce_free_variation_limit();

-- Sanity: the project cap must still be there. Fails loudly if v51 was never run.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_free_project_limit'
    ) THEN
        RAISE EXCEPTION 'schema_v51 (project limit trigger) is not applied — run it first';
    END IF;
END $$;

COMMIT;
