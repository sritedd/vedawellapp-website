# 17 — E2E Run Playbook for Opus (LIVE PROD)

> **Target: the live production site `https://vedawellapp.com`** — per user decision 2026-07-25
> ("i want to test using actual live prod website"). This supersedes the "localhost only" rule
> in `guide/16-E2E-BROWSER-TEST-PLAN.md` for this run. The safety rails below are how we test
> prod without hurting prod.
>
> **Audience**: a future Opus session. Execute top to bottom. Phase A fixes known-broken specs
> BEFORE any run — running first and "discovering" these failures wastes a full cycle.
>
> **Status**: NOT RUN — playbook created 2026-07-25 after reviewing the E2E suite.

---

## 0. Review verdict (why Phase A exists)

The E2E suite was reviewed file-by-file on 2026-07-25. State of each piece:

| Asset | Verdict | Detail |
|-------|---------|--------|
| `playwright.config.ts` | localhost-only | Boots `npm run dev`, wipes local `guardian_test` Postgres in globalSetup. **Do not use for prod.** Use `playwright.prod.config.ts` (created 2026-07-25). |
| `e2e/guardian-full-workflow.spec.ts` | **WILL FAIL for VIC** | `STATE_CONFIGS.VIC.expectedStages` lists 2 stages; the workflow JSON now has **10** and the spec asserts exact count+order (`dbStages.length === expectedStages.length`). NSW(8)/QLD(7)/WA(8) names verified matching the JSON exactly. SA/TAS/ACT/NT: **no coverage at all**. Header comment ("QLD/WA no stages") stale. |
| `e2e/guardian-ai.spec.ts` | **Free-tier tests test the wrong user** | The "Tier Gating (Free User)" describe logs in as `test@vedawellapp.com` — but the seeded user is `e2e-test@vedawellapp.com` and is **guardian_pro**. Whichever account it hits, it is not a controlled free user. Also: `chat returns 403 for free users` predates the **1 lifetime free chat preview** — a genuinely-free user's FIRST chat now streams 200, then 403. `BASE_URL` is hardcoded `http://localhost:3000` (ignores Playwright baseURL). |
| `e2e/guardian-smoke.spec.ts` | **Architecturally broken vs cloud** | Seeds a LOCAL Postgres (`guardian_test`) then asserts the UI shows that data — but the app (dev or prod) reads cloud Supabase. Those assertions can never pass. Excluded in the prod config; needs redesign or retirement. Do not run. |
| `e2e/setup/supabase-seed.ts` | Works, writes to PROD | Reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` from `.env.local` — that IS the prod instance. So seed/cleanup helpers are already prod-capable. Test user: `e2e-test@vedawellapp.com` / `E2eTestPass!2026`, auto-upserted to `guardian_pro`. |
| `guide/07-TESTING-SETUP.md` | Corrected 2026-07-25 | Older claims (QLD/WA stageless, VIC=2) were stale. |

---

## 1. Prod safety rails (non-negotiable)

1. **Test data is namespaced**: every project this run creates is named `E2E …`. Cleanup =
   `cleanupE2EProjects()` + `deleteTestProject()`. **Always run cleanup, even after failures.**
   Verify afterwards: `select count(*) from projects where name like 'E2E %'` → 0.
2. **Never complete a Stripe payment.** Stripe is in LIVE mode. Checkout testing stops at the
   Stripe-hosted page rendering; then navigate back. Test cards do not work in live mode; a
   real card would create a real charge.
3. **Touch only test accounts** (`e2e-test@…`, `e2e-free@…`). Never modify, message, or delete
   real users from admin surfaces. Admin UI checks are read-only (search renders, buttons exist).
4. **No cron triggering** (`/api/cron/*`) — they email real users.
5. **AI calls are metered, not free**: test user quotas are real (pro: 50 ai + 30 chat/day;
   admin: unlimited). Keep AI assertions to ~1–2 calls per route.
6. **Expect side effects and note them**: GA4 page_views, Sentry breadcrumbs, page_views table
   rows from the test user. Acceptable pollution; mention it in the final report.
7. **Deletes are scoped to ids the run created.** Never bulk-delete anything by pattern other
   than the `E2E %` project cleanup that already exists.

---

## 2. Preflight

```bash
cd vedawell-next
# The seed layer needs these two in .env.local (verified present 2026-07-25):
grep -cE '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SECRET_KEY)=' .env.local   # expect 2

# Prod is up:
curl -s -o /dev/null -w "%{http_code}\n" https://vedawellapp.com/guardian        # 200
curl -s -o /dev/null -w "%{http_code}\n" https://vedawellapp.com/guardian/login  # 200
```

Accounts (create/refresh via a small Node script using `e2e/setup/supabase-seed.ts` helpers):

| Account | Tier | Purpose | How |
|---------|------|---------|-----|
| `e2e-test@vedawellapp.com` | `guardian_pro` | main journey | `ensureTestUser()` (exists) |
| same, with `is_admin=true` | admin | admin surfaces + unlimited-quota check | service-role update; **revert at teardown** |
| `e2e-free@vedawellapp.com` | `free` | tier limits + free-preview chat | create via Admin API (`email_confirm: true`), profile tier `free`, **zero rows in `ai_usage_log`** (fresh preview) |

`ADMIN_EMAILS` is set on Netlify (per memory) but won't include the test email — use the
`is_admin=true` profile flag instead; `isAdminEmail() OR is_admin` are equivalent gates.

---

## 3. Phase A — fix the specs (before any run)

Commit these as one "fix stale e2e specs" commit.

**A1. `guardian-full-workflow.spec.ts` — derive stages from the JSON, kill drift forever.**
Replace the hardcoded `expectedStages` arrays:

```ts
import workflows from "../src/data/australian-build-workflows.json";
const stagesFor = (s: string): string[] =>
    (workflows.workflows.new_build as any)[s]?.stages?.map((x: any) => x.name) ?? [];
```

Build `STATE_CONFIGS` for **all 8 states** (`NSW,VIC,QLD,WA,SA,TAS,ACT,NT`) with
`expectedStages: stagesFor(code)` + the per-state `insuranceLabel`. Delete the stale header
comment and the dead "QLD/WA: empty is expected" branch. Fix the header count claim.

**A2. `guardian-ai.spec.ts`:**
- `const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";`
- Default `TEST_EMAIL`/`TEST_PASSWORD` to the real seeded pro user
  (`e2e-test@vedawellapp.com` / `E2eTestPass!2026`) instead of `test@vedawellapp.com`.
- Point the "Tier Gating (Free User)" describe at `e2e-free@vedawellapp.com` (env:
  `E2E_FREE_EMAIL` / `E2E_FREE_PASSWORD`).
- Rewrite the chat gating test for current business logic: with a fresh free user, **first chat
  → 200 (lifetime preview streams); second chat → 403** with `upgradeRequired: true`. Keep
  `stage-advice`/`builder-check` → 403 as-is (correct).
- Builder Check note: for PRO users the route returns **503 `comingSoon`** by design — any
  success-shape assertion on it is wrong; 503 is the pass.

**A3. Do not touch `guardian-smoke.spec.ts`** (excluded from the prod config). Log its redesign
as a backlog item — its local-Postgres seeding model can't work against cloud Supabase.

Validate Phase A: `npx tsc --noEmit` and `npx playwright test --config=playwright.prod.config.ts --list`
(should list workflow tests for 8 states + ai tests; zero smoke tests).

---

## 4. Phase B — spec suite against prod

```bash
# Workflow first, one state at a time; NSW must be green before the rest:
npx playwright test --config=playwright.prod.config.ts guardian-full-workflow -g "NSW"
npx playwright test --config=playwright.prod.config.ts guardian-full-workflow -g "VIC"
# ...then QLD, WA, SA, TAS, ACT, NT

# Then the AI/API suite:
E2E_BASE_URL=https://vedawellapp.com npx playwright test --config=playwright.prod.config.ts guardian-ai
```

Expected: seed writes go straight to prod Supabase (service role), the browser drives the live
site, `afterAll` deletes each project. If a run aborts, run `cleanupE2EProjects()` manually.

Triage guide:
- Login timeout → check the deployed site manually before blaming the spec (Netlify functions
  cold-start; first login can be slow — that's what `retries: 1` is for).
- Stage-count mismatch after A1 → the workflow JSON and prod seeding genuinely disagree; that's
  a real finding, not spec drift.
- AI 429 on the pro user → real quota exhaustion (50/day shared with any manual testing that day).
- AI 503 with `fallback: true` → provider keys/config on Netlify, not a test bug.

## 5. Phase C — browser-MCP journey on prod (the part specs can't cover)

Run `guide/16-E2E-BROWSER-TEST-PLAN.md` §4 with Playwright MCP against `https://vedawellapp.com`,
logged in as the pro test user (admin-flagged for 4A4/AI6). Prod deltas:

- 4B (creation) runs through the REAL UI wizard — this is the first time ever. Name the project
  `E2E NSW UI Build` so cleanup catches it.
- 4E/M-section: "Should I Pay?", HBCF threshold, cooling-off — all pure reads, safe.
- **4H tier limits use `e2e-free@…`** — expect DB-trigger errors (v41/v42) surfaced as friendly
  UI messages, not raw Postgres text. Raw `FREE_TIER_…` text reaching the UI is a P2 finding.
- Stripe step stops at the hosted checkout page (rail #2).
- 4I teardown + §6 findings log as written.

## 6. Phase D — remaining states + report

- §5 short-circuit of plan 16 for VIC→NT (create → stage count → state-specific
  insurance/tribunal strings → one defect → Should I Pay → delete).
- Teardown: revert `is_admin`, verify zero `E2E %` projects remain, optionally delete the
  free user's test defects.
- Check Sentry for events captured during the run window; triage anything new.
- Write results into plan 16's matrices + findings log; update this file's Status line; fix
  P0/P1 findings; commit and push.

---

## 7. Done means

- Phase A committed; `--list` shows 8-state coverage.
- NSW green end-to-end (specs + browser journey) on prod; 7 states pass the short circuit.
- No `E2E %` rows left in prod; `is_admin` reverted; no unexplained Sentry events.
- Findings triaged with severities; docs updated.
