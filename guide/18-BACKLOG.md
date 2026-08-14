# 18 — Live Backlog

> **This is the single live queue.** Everything still open from the 2026-08 live-prod
> E2E run plus older carry-overs, in the order I'd work them.
>
> **Convention** (same as `14-FULL-APP-REVIEW.md` §10.2): when an item is done,
> ~~strike the row~~ and append `✅ FIXED <date> (<commit>)` with a one-line note on what
> actually changed. Don't delete rows — the history is the point.
>
> **Status**: 10 open · 1 done · 1 partial · created 2026-08-11 · last worked 2026-08-14
>
> Closed already and NOT repeated here: the two P0 RLS outages (v47/v48), the AI
> quota outage, the PDF-worker CSP block, the contract-parser overwrite, the Stage
> Gate certificate blindness, public storage buckets (v49), and cert-ref
> normalisation (v50). See `17-E2E-PROD-RUN-PLAYBOOK.md` §8–15.

---

## How to work this list

1. Take the top open item. One item per commit.
2. **Verify against prod, not just the type checker.** Every P0 in this codebase
   passed `tsc` and looked fine in code review — they were only caught by driving
   the real app. A green build is not evidence.
3. Force the *actual* code path. The cert-ref fix nearly produced a false pass
   because the first test hit an UPDATE branch when the bug lived in INSERT.
4. Strike the row, record the commit, push.

---

## P1 — do these first

### ~~B-1 · `projects` INSERT policy still carries the self-referential pattern~~
✅ **FIXED 2026-08-14 (schema_v51 + b2053b5)** — cap moved to
`enforce_free_project_limit()` trigger; policy reduced to `auth.uid() = user_id`.
Verified on prod: the 2nd project is now blocked by **`FREE_TIER_PROJECT_LIMIT`
(trigger)**, not `row-level security` (policy), proving the self-reference is
gone while behaviour is unchanged. `verify-write-limits.mjs` extended to cover
projects + project-impersonation; results identical pre/post. The new-project
page maps the raw trigger message to a friendly one for the bypass path.

**Effort**: 30 min · **Risk if skipped**: latent repeat of a P0

`schema_unified.sql:838` still has `(SELECT count(*) FROM projects WHERE user_id = auth.uid()) < 1`
inside the `projects` INSERT policy — the exact shape that caused infinite
recursion on `defects` and `variations` (fixed in v48). It currently *works*
(measured: 1st project allowed, 2nd correctly blocked), which is why v48
deliberately left it alone during a hotfix.

But it's the same landmine. Convert it to a `BEFORE INSERT` trigger like
`enforce_free_defect_limit()` / `enforce_free_variation_limit()`, then simplify
the policy to `auth.uid() = user_id`.

**Verify**: free user creates 1st project ✅, 2nd blocked ✅, pro/trial/admin
unlimited ✅ — via `verify-write-limits.mjs` extended to cover projects.

### ~~B-2 · `schema_unified.sql` is stale~~
⚠️ **PARTIALLY DONE 2026-08-14** — full regeneration still needs a `pg_dump` of the
live DB (no direct SQL access from here), and hand-merging 16 migrations into
1100 lines would risk a *confidently wrong* file, which is worse than a visibly
stale one. Instead: a prominent staleness banner at the top naming the four
policy sets that no longer match production, plus **SECTION 8** consolidating the
current state of every v36–v51 change (helper functions, rewritten policies,
tier triggers, private buckets, the `required_for_stage` convention).
**Remaining**: regenerate wholesale from a real dump.

**Effort**: 1–2 h · **Risk if skipped**: wrong source of truth for every future migration

Missing everything from v36 onward. Anyone reading it to understand current RLS
gets a picture that is several P0s out of date — including the policies that were
just rewritten in v47/v48/v49/v50.

Regenerate from the live database rather than hand-merging the migration files,
then diff against the v1–v50 chain to confirm nothing was missed.

---

## P2 — worth doing, not urgent

### B-3 · 9 of 17 audit actions never fire
**Effort**: 2 h · **Value**: tribunal evidence completeness

Emitted today (8): `certificate.uploaded`, `communication.logged`,
`payment.updated`, `defect.created`, `defect.updated`, `defect.resolved`,
`variation.created`, `stage.advanced`.

Never emitted (9): `payment.created`, `variation.signed`, `project.created`,
`project.updated`, `project.deleted`, `inspection.scheduled`,
`inspection.completed`, `escalation.started`, `escalation.advanced`.

`variation.signed` and the `escalation.*` pair are the valuable ones — a signed
variation and an escalation history are exactly what a tribunal asks for.
`project.*` is lower value.

### B-4 · AI spec fires faster than the rate limiter
**Effort**: 45 min

`guardian-ai.spec.ts` scored 4 passed / 13 failed on prod. The failures are
environmental, not product bugs: the Input Validation block fires 6 requests
back-to-back as one user through a 5 s per-user limiter, so requests 2+ get 429
instead of the expected 400. Verified by hand with 8 s spacing — validation
returns correct 400s, free gating 403, free chat on a foreign project 404.

Add a rate-limit-aware helper (space requests, or retry once on 429) so the
suite's result means something.

### B-5 · 4 workflow-spec failures
**Effort**: 1–2 h

`5 passed / 4 failed` after fixing the stale tab names, the More card grid and
the dead `.min-h-[500px]` selector. Remaining: `Stages seeded correctly`,
`Stage Gate renders`, `Material/site visit/check-in on tabs`, `Complete all
stages and close project`.

Likely the onboarding overlay intercepting clicks and text-matching. **Not
product defects** — every feature these cover is verified working through the
browser. Dismiss the onboarding wizard in `beforeAll` and re-check.

### B-6 · `guardian-smoke.spec.ts` can never pass
**Effort**: 2 h to redesign, 5 min to retire

Seeds a LOCAL Postgres (`guardian_test`) then asserts the cloud-backed UI shows
that data. Architecturally impossible. Currently excluded from the prod config.

Decide: point it at Supabase like the other specs, or delete it. Leaving a
permanently-red spec in the repo trains people to ignore red.

### B-7 · NSW payment milestones total 90%, not 100%
**Effort**: owner decision, then 30 min

Seeding parses percentages out of free text and takes the **low end** of ranges:
`"Frame Stage (15-20%)"` → 15, `"Final Stage / PC (5-10%)"` → 5. NSW sums to 90%.

The UI now says so explicitly ("these milestones cover 90% … the remainder is
commonly the deposit … check your contract"), so it is honest rather than
misleading. **Needs your call**: is 90% the intended convention, or should the
schedule reconcile to 100%?

---

## P3 — polish

### B-8 · Certificate gate reads as contradictory
**Effort**: 20 min

A green "You may proceed with the progress payment" banner sits directly above a
list of 8 unchecked ⬜ certificates. The banner is about the *current stage's*
requirements; the list is a static state-wide reference. Both correct, but a
stressed homeowner will read them as conflicting. Separate them visually or
retitle the list.

### B-9 · Orphaned storage sweep
**Effort**: 1 h

`deleteProject()` and `delete-account` both clear storage correctly (verified).
Only deletions *outside* those paths leave files. Now hygiene rather than
exposure, since the buckets are private (v49).

Add a cron that lists bucket prefixes and removes any whose project no longer
exists.

### B-10 · Scanned PDFs can't be parsed
**Effort**: large (needs OCR)

Real inspection reports are often scanned images with no text layer — the sample
PCI report extracted only image data. The component already guards this
(`fullText.trim().length < 50`) so it degrades to a message rather than feeding
garbage to the AI. Supporting them needs OCR (Tesseract, or a vision model).

### B-11 · Free-tier caps never clicked as a real free user
**Effort**: 30 min

Verified by string-matching the trigger errors (`FREE_TIER_*_LIMIT`) against the
UI's handlers, plus server-side enforcement proven via API. That's strong but not
the same as clicking it. Log in as `e2e-free@` in a browser and hit the 4th
defect / 3rd variation / 2nd project.

### B-12 · Yearly Stripe price still absent
**Effort**: 15 min (owner)

`pro_yearly.priceId` is `""`, so the button shows "Coming Soon". The webhook
already allowlists `STRIPE_YEARLY_PRICE_ID`, so creating the price and setting
the env var is all that's needed.

---

## Deliberately NOT in this backlog

- **Builder Check** — intentionally 503 `comingSoon` until real data sources
  (ABN Lookup, state licence registers) are integrated. Marketing copy no longer
  advertises it.
- **Panchang rebuild** — roadmap item, unrelated to Guardian.
- **`schema_v46_migraine_logs`** — the migraine tracker works on localStorage;
  only cross-device sync needs it.
