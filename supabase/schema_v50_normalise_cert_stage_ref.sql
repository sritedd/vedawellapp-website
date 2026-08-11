-- VedaWell Schema Migration v50: Normalise certifications.required_for_stage
-- Run in Supabase SQL Editor
-- Date: 2026-08-11
--
-- ═══════════════════════════════════════════════════════════════════════════
-- DATA CONSISTENCY. `certifications.required_for_stage` is populated in two
-- different formats:
--
--   project seeding      -> the stage UUID      ("4e1187bf-8a3e-…")
--   CertificationGate    -> the stage name/key  ("Slab / Footings")
--
-- StageGate matched on NAME only, so a UUID could never match and every seeded
-- certificate requirement was invisible — the gate reported "All Clear" while
-- mandatory certificates were missing (P1-9). That was patched by matching both
-- formats, but the underlying inconsistency remains, and the next piece of code
-- to read this column will fall into exactly the same trap.
--
-- This migration converges the data on ONE format: the stage UUID. After it,
-- the dual-format matching in StageGate is belt-and-braces rather than
-- load-bearing.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Report what we're about to change (visible in the SQL Editor output).
SELECT
    count(*) FILTER (WHERE c.required_for_stage IN (SELECT s.id::text FROM stages s WHERE s.project_id = c.project_id)) AS already_uuid,
    count(*) FILTER (WHERE c.required_for_stage IS NOT NULL
                       AND c.required_for_stage NOT IN (SELECT s.id::text FROM stages s WHERE s.project_id = c.project_id)) AS needs_conversion,
    count(*) FILTER (WHERE c.required_for_stage IS NULL) AS null_refs
FROM certifications c;

-- Convert name/key references to the matching stage UUID **within the same
-- project**. Both sides are slugified so "Slab / Footings", "slab_footings" and
-- "Slab-Footings" all collapse to the same token.
UPDATE certifications c
SET required_for_stage = s.id::text
FROM stages s
WHERE s.project_id = c.project_id
  AND c.required_for_stage IS NOT NULL
  -- not already a UUID belonging to this project
  AND c.required_for_stage NOT IN (SELECT s2.id::text FROM stages s2 WHERE s2.project_id = c.project_id)
  AND lower(regexp_replace(trim(s.name),               '[^a-zA-Z0-9]+', '_', 'g'))
    = lower(regexp_replace(trim(c.required_for_stage), '[^a-zA-Z0-9]+', '_', 'g'));

-- Anything still unconverted refers to a stage that doesn't exist on that
-- project (bad legacy data). Leave it rather than guess — StageGate's name
-- matching still handles it, and silently repointing a compliance record at the
-- wrong stage would be worse than leaving it visible.
SELECT c.id, c.project_id, c.type, c.required_for_stage AS unresolved_ref
FROM certifications c
WHERE c.required_for_stage IS NOT NULL
  AND c.required_for_stage NOT IN (SELECT s.id::text FROM stages s WHERE s.project_id = c.project_id);

COMMIT;

-- ─── Verify ─────────────────────────────────────────────────────────
-- Every non-null ref should now be a stage UUID on the same project:
--   SELECT count(*) FROM certifications c
--   WHERE c.required_for_stage IS NOT NULL
--     AND c.required_for_stage NOT IN
--         (SELECT s.id::text FROM stages s WHERE s.project_id = c.project_id);
--   -- expect 0 (or only genuinely-orphaned legacy rows, listed above)
