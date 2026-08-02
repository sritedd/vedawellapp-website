# 16 — Live Browser E2E Test Plan (Playwright MCP)

> **Goal**: Drive a real browser as a real admin user, create a project end to end, and exercise
> every feature until we *know* it works — rather than inferring it from code review.
>
> **Order**: NSW first and completely. Only once NSW is green do we repeat for the other 7 states.
>
> **Status**: NOT STARTED — created 2026-07-25
>
> **Driver**: Playwright MCP (browser tools), not the `e2e/*.spec.ts` Playwright runner. The
> spec files seed data via service role and assert; this plan clicks the actual UI like a user.

---

## 0. Why this exists

Every prior review was *code inspection*. The 2026-04 hardening review closed 10 phases without
a single real project ever being created through the UI. Known consequences:

- `guide/07-TESTING-SETUP.md` claims "QLD/WA have no workflow stages". **That is stale** —
  all 8 states now have full `new_build` workflows (verified 2026-07-25 against
  `src/data/australian-build-workflows.json`). The test matrix has been wrong for months.
- The dev-bypass preview was completely broken (mock client crashed on the dashboard AND the
  project page) and nobody noticed, because nobody had opened the authenticated UI.

Assume nothing is proven until a browser has clicked it.

---

## 1. Prerequisites (do these BEFORE any browser work)

These are blockers. Each has been verified as of 2026-07-25.

| # | Item | Status | Action |
|---|------|--------|--------|
| P1 | `ADMIN_EMAILS` in `.env.local` | ❌ **ABSENT** | Must be set or admin surfaces are unreachable — `isAdminEmail()` returns `[]` and logs `[Admin] ADMIN_EMAILS env var is not set`. Set to the admin's email. |
| P2 | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | ❌ absent (`SUPABASE_SECRET_KEY` is SET) | App code reads `SUPABASE_SERVICE_ROLE_KEY`; the e2e seed reads `SUPABASE_SECRET_KEY`. Add the former (same value) or service-role paths fail locally. |
| P3 | `schema_v46_migraine_logs.sql` | ⬜ not run | Not required for Guardian testing; only blocks migraine profile sync. |
| P4 | Dev server | — | `npm run dev` on a known port. Test against **localhost**, never prod — this plan creates and deletes real rows. |
| P5 | Test account | — | Reuse `ensureTestUser()` from `e2e/setup/supabase-seed.ts` (`e2e-test@vedawellapp.com` / `E2eTestPass!2026`, auto-set to `guardian_pro`), then flip `is_admin=true` for admin runs. |

**Never run this plan against production.** Project creation, defect logging, and the delete
cascade all write real rows. Localhost only, unless explicitly testing a deploy smoke.

---

## 2. MCP servers required

Already registered in `vedawell-next/.mcp.json`:

| Server | Used for | Registered |
|--------|----------|-----------|
| `playwright` (`@playwright/mcp`) | **Primary driver** — navigate, click, type, snapshot, screenshot, read console | ✅ yes |
| `supabase` (`@supabase/mcp-server-supabase`) | Verify rows actually persisted; flip `is_admin`; clean up after runs | ✅ yes (needs `SUPABASE_ACCESS_TOKEN`) |
| `sentry` | Confirm no new errors were captured during the run | ✅ yes |
| `netlify` | Deploy-state checks when smoke-testing a deploy | ✅ yes |

Nothing new needs installing. If browser tools are unavailable in a session, they may surface
under a different prefix (e.g. `browser-forms`) — use whichever browser toolset is present.

**Auth note**: the Google Calendar / Google Drive claude.ai connectors are unauthorized and
irrelevant here — ignore them.

---

## 3. Golden rules for every step

1. **Snapshot before you click.** Take an accessibility snapshot to find the real element; never
   guess a selector.
2. **Verify persistence, don't trust the toast.** After every write: reload the page (or re-query
   via the Supabase MCP) and confirm the row is still there. Optimistic UI has lied before.
3. **Watch the console on every page.** Any React error, unhandled rejection, or failed request
   is a finding. Log it with the page and the exact message.
4. **Record the outcome inline** in the matrices below — ✅ / ❌ / ⚠️ plus a one-line note.
5. **One finding = one line** with file:line if identifiable. Fix in a separate pass, not mid-run,
   unless it blocks the journey.

---

## 4. NSW — the full journey (DO THIS FIRST, COMPLETELY)

NSW is the reference state: 8 `new_build` stages, plus the only state with `granny_flat` (7) and
`extension` (8) workflows. If NSW is green, the rest are largely data variations.

### 4A. Auth & entry

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Load `/guardian` logged out | Landing renders; "Get Guardian" CTA | ⬜ |
| A2 | Go to `/guardian/dashboard` logged out | Redirects to `/guardian/login` | ⬜ |
| A3 | Log in as admin (email+password) | Lands on dashboard, email shown in header | ⬜ |
| A4 | Admin surfaces reachable (`/guardian/admin`) | Loads, not 403 (requires **P1**) | ⬜ |
| A5 | Console clean on dashboard | No errors | ⬜ |

### 4B. Project creation (2-step wizard)

The form lives at `/guardian/projects/new`. Step 1 = `BuildTypeSelector` (category + state);
step 2 = details. An **email-verification gate** blocks creation unless the account is verified,
is `guardian_pro`, is admin, or has `email_verified_override`.

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | Open `/guardian/projects/new` | Either the wizard or the "Verify Your Email" gate | ⬜ |
| B2 | If gated: confirm admin/Pro bypass works | Wizard shown for admin/Pro | ⬜ |
| B3 | Step 1: pick `new_build` + `NSW` | "Next" enables only after a category is chosen | ⬜ |
| B4 | Step 2: fill name, builder, licence, HBCF policy + expiry, contract value, address, start date, contract signed date | All fields accept input | ⬜ |
| B5 | NSW-specific insurance copy shows | HBCF wording (NSW branch at `new/page.tsx:516`) | ⬜ |
| B6 | Submit | Redirects to the new project page | ⬜ |
| B7 | **Verify in DB** | `projects` row with `state='NSW'`, `build_category='new_build'` | ⬜ |
| B8 | **Stages seeded = 8** with `order_index` set | 8 NSW stages in order, not `created_at` order | ⬜ |
| B9 | Payment milestones + certificates seeded | Rows in `payments` / `certifications` | ⬜ |

### 4C. The 5-section navigation

Nav is Home / Build / Issues / Evidence / More (desktop top bar, mobile bottom bar). Visit every
sub-tab; each must render without console errors and without fake data.

| Section | Sub-tabs to open | Result |
|---------|------------------|--------|
| Home | Dashboard, Pending Actions | ⬜ |
| Build | Stage Gate, Stages, Inspections, Certificates, NCC 2025 | ⬜ |
| Issues | Defects, Variations, Red Flags, Disputes, Pre-Handover | ⬜ |
| Evidence | Photos, Documents, Comms, Check-ins, Site Visits | ⬜ |
| More | Payments, Budget, Cost Check, Builder Score, Rate Builder, Materials, Checklists, Export, Reports, Notifications, Alerts, Settings | ⬜ |

### 4D. Core write paths (each must survive a reload)

| # | Feature | Action | Verify | Result |
|---|---------|--------|--------|--------|
| C1 | Defect | Log one with severity + stage | Reload → present; row in `defects` | ⬜ |
| C2 | Defect status | Transition through valid states | Invalid transitions rejected | ⬜ |
| C3 | Variation | Add with cost | Reload → present; total updates | ⬜ |
| C4 | Communication | Log an entry | Reload → present | ⬜ |
| C5 | Site visit | Log one (GPS/weather/tags) | Reload → present | ⬜ |
| C6 | Material | Add a record | Reload → present | ⬜ |
| C7 | Weekly check-in | Submit one | Reload → present; feeds Builder Score | ⬜ |
| C8 | Pre-handover | Tick items; "Create Defects" bridge | Defects actually created | ⬜ |
| C9 | Stage Gate | Advance a stage | `stages.status` changes; blocked without certs | ⬜ |
| C10 | Certificate | Upload to a stage | Row in `certifications`; gate unblocks | ⬜ |

### 4E. The money logic (highest business risk)

| # | Feature | Expected | Result |
|---|---------|----------|--------|
| M1 | "Should I Pay?" with open critical defect | **DO NOT PAY** + blocker list | ⬜ |
| M2 | Resolve blockers | Flips to green/PAY | ⬜ |
| M3 | Blockers deep-link | Each blocker navigates to the right tab | ⬜ |
| M4 | Payment schedule | Milestones cross-referenced against certificates | ⬜ |
| M5 | HBCF threshold alert (NSW $20k) | Fires for a $500k contract | ⬜ |
| M6 | Cooling-off countdown | Correct NSW business-day maths | ⬜ |
| M7 | Warranty periods | NSW statutory periods correct | ⬜ |
| M8 | No `undefined` / `Invalid Date` anywhere | Real values only | ⬜ |

### 4F. AI features (admin = unlimited quota after the 2026-07-17 fix)

| # | Route | Expected | Result |
|---|-------|----------|--------|
| AI1 | Defect Assist (free tier) | Returns a structured description | ⬜ |
| AI2 | Stage Advice (Pro) | NSW + current-stage specific | ⬜ |
| AI3 | Guardian Chat (Pro) | Streams; knows project stage + defects | ⬜ |
| AI4 | Claim Review (Pro) | PAY / HOLD / DISPUTE verdict | ⬜ |
| AI5 | Builder Check | **503 "coming soon"** — intentionally disabled | ⬜ |
| AI6 | Admin quota | No 429 on repeat calls (validates the `tier:"admin"` fix) | ⬜ |

### 4G. Export & evidence

| # | Feature | Expected | Result |
|---|---------|----------|--------|
| E1 | Tribunal Export | 10-section pack, NSW tribunal = NCAT | ⬜ |
| E2 | PDF export (6 types) | Real branded PDFs download | ⬜ |
| E3 | Calendar `.ics` | Valid file | ⬜ |
| E4 | Data export | Full JSON | ⬜ |

### 4H. Tier limits (log out of admin; use a free account)

| # | Limit | Expected | Result |
|---|-------|----------|--------|
| T1 | 2nd project on free | Blocked + upgrade prompt | ⬜ |
| T2 | 4th defect on free | Blocked (v42 DB trigger) | ⬜ |
| T3 | 3rd variation on free | Blocked (v41 DB trigger) | ⬜ |
| T4 | Chat on free | Exactly 1 lifetime preview, then 403 | ⬜ |
| T5 | Free→trial | 7-day trial grants Pro features | ⬜ |

### 4I. Teardown

| # | Step | Expected | Result |
|---|------|----------|--------|
| Z1 | Delete the project | Full cascade — no orphans in any child table | ⬜ |
| Z2 | Sentry check | No new errors from the run | ⬜ |

---

## 5. Remaining 7 states (only after NSW is fully green)

Per state, run the **short circuit**: create project → verify stage count → check state-specific
insurance/cooling-off/warranty/tribunal → log one defect → "Should I Pay?" → delete. Full
4C–4H depth is not repeated unless a state fails.

| State | `new_build` stages | Insurance scheme | Tribunal | Result |
|-------|-------------------|------------------|----------|--------|
| NSW | 8 | HBCF | NCAT | ⬜ (§4) |
| VIC | **10** | DBI | VCAT / DBDRV | ⬜ |
| QLD | 7 | QBCC | QCAT / QBCC | ⬜ |
| WA | 8 | HBCF (WA) | SAT | ⬜ |
| SA | 7 | BIG | SACAT | ⬜ |
| TAS | 7 | — | TASCAT | ⬜ |
| ACT | 7 | — | ACAT | ⬜ |
| NT | 7 | — | NTCAT | ⬜ |

**Known data gaps to confirm, not assume:**
- `granny_flat` exists only for NSW (7 stages) and VIC (**0 stages — empty array**). VIC granny
  flat will seed zero stages; decide whether that's a graceful empty state or a bug to fix.
- `extension` exists only for NSW (8 stages). All other states → no stages.
- Update `guide/07-TESTING-SETUP.md` once confirmed; its QLD/WA claim is already wrong.

---

## 6. Findings log

| # | Sev | Page / file | Issue | Status |
|---|-----|-------------|-------|--------|
| _(append as found)_ | | | | |

---

## 7. Definition of done

- Every NSW box ✅ (or ❌ with a logged finding).
- All 8 states pass the short circuit.
- Zero unexplained console errors.
- Findings triaged: P0/P1 fixed and pushed; P2/P3 in the backlog.
- `guide/07-TESTING-SETUP.md` corrected.
- This file updated with results + date.
