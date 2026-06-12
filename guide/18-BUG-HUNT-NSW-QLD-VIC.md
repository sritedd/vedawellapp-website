# Bug Hunt: Project Workflow Creation → Closure (NSW / QLD / VIC)

Date: 2026-06-11. Status: FOUND, fixes pending. Execute Batches A → B → C, typecheck + build + commit + push after each batch. Do not stop until all are fixed.

## Batch A — money/legal correctness (~3h)

1. **QLD double base-stage payment** — `src/app/guardian/projects/new/page.tsx:218` parses `paymentMilestone` with `match(/\d+/)` (first number wins). QLD slab = "Base Stage (combined 10%)" → seeds a SECOND 10% payment row on top of site_start's 10%. Fix: skip payment creation when milestone text contains "combined" (or "additional"); also consider deposit handling.
2. **Dispute PDF shows NSW contacts for all states** — `src/app/api/guardian/export-pdf/route.ts:436` hardcodes NSW Fair Trading 13 32 20 / HBCF / NCAT. Fix: reuse the per-state `TRIBUNAL_INFO` map from `src/components/guardian/TribunalExport.tsx:18` (extract to shared lib, e.g. `src/lib/guardian/tribunal-info.ts`) and key off `project.state`.
3. **PDF payment schedule fabricated** — same file, `STAGE_PAYMENTS` const (line ~60, "NSW standard payment schedule") + broken name matching ("Base/Slab"→"baseslab" never matches). Fix: read the real `payments` table rows for the project instead of the hardcoded table.
4. **VIC warranty text is NSW law reworded** — `src/data/australian-build-workflows.json` new_build/VIC warranty stage says "6 years structural, 2 years non-structural" (NSW Home Building Act). VIC correct: 10-year builder liability period (s134 Building Act 1993), implied warranties under Domestic Building Contracts Act 1995, DBI required >$16k, claims via DBDRV then VCAT. Fix the description + yourRights array.
5. **VIC frame milestone "15-20%"** — VIC statutory max at frame = 15% (DBCA s40). Fix display text to "Frame Stage (15%)". Also fix VIC practical_completion "(5-10%)" → VIC completion balance is typically 10%: make it "Final Stage (10%)" so parser seeds 10 not 5.

## Batch B — stage-name ↔ guidance-key mismatch (~2h)

6. **Stage-aware features dead for 7/8 stages, all states.** `currentStage` = DB stage NAME normalized (`"Slab / Footings"`→`slab_footings`, `"Pre-Plasterboard"`→`pre-plasterboard` hyphen survives) but consumers use workflow IDs (`slab`, `frame`, `pre_plasterboard`):
   - `STAGE_GUIDANCE` in `src/components/guardian/SmartDashboard.tsx:459-460`
   - `STAGE_VISIBLE_TABS` in `src/app/guardian/projects/[id]/page.tsx:231-232`
   - dodgyBuilderWarnings lookup `s.id === currentStage` in SmartDashboard.tsx:310
   - pre-plasterboard banner `normalizedStage === "pre_plasterboard"` SmartDashboard.tsx:549
   Fix: create shared helper `stageNameToKey(name)` in `src/lib/guardian/stage-keys.ts` mapping DB names → canonical workflow ids (handle hyphen, "(PC)", "/ Footings", "Stage" suffix etc.). Use it in all 4 consumers. Keep fallback DEFAULT_GUIDANCE.

## Batch C — closure lifecycle (~2h)

7. **handover_date never settable** — read by NotificationCenter.tsx:148, ProjectOverview.tsx:86, SmartDashboard warranty alerts; written NOWHERE. Fix: add handover_date date field to `src/components/guardian/ProjectSettings.tsx`.
8. **No closure transition** — completing final stage (StageGate.tsx:331) only updates the stage. Fix: in StageGate confirmProceed, when the completed stage is the last non-warranty stage (or named practical completion), prompt/auto: set `projects.status = "completed"` + `handover_date = today` (with user confirm dialog).

## Minor (fix if time allows, else log)

9. VIC planning/building_permit stages seed with zero checklist items — add 2-3 basic checklist items each (e.g. "Planning permit issued by council", "Building permit issued by RBS").
10. QLD lacks pre_plasterboard stage (checklist lives in fixing) — leave as-is, note in docs.

## Verification per batch
- `npx tsc --noEmit` clean
- `npm run build` clean
- Batch A: create test assertion — QLD workflow seeds exactly one 10% base payment; VIC totals sum sanely; dispute PDF for VIC project shows VCAT/CAV contacts
- Batch B: normalized keys for all 8 NSW stage names resolve to guidance entries
- Commit per batch, push, verify Netlify deploy goes ready
