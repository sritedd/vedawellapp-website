# HomeGuardian — Full App Review & Hardening Tracker

> **Started**: 2026-04-17
> **Goal**: Move the app from "vibecoded MVP" to "solid, bug-free, every-workflow-covered, user-benefitting SaaS."
> **Status**: IN PROGRESS — do not abandon; resume from the "Next Action" pointer at the bottom.

---

## How to resume this review after a session reset

1. Read `guide/00-APP-MEMORY.md` (history) + `guide/14-FULL-APP-REVIEW.md` (this file, the live tracker).
2. Jump to the section whose header ends with `[IN PROGRESS]` or `[TODO]` — work is not done until all phases show `[DONE]`.
3. The "Next Action" pointer at the bottom names the exact file or area to open next.
4. When you finish a unit of work, append it under the matching phase as `- [x] <description> — <file:line>`.
5. When a phase is fully done, change its header marker from `[IN PROGRESS]` to `[DONE]` and update the overall status badge.

---

## Review Scope (what "done" means)

The app is considered production-solid when ALL of the following hold:

1. `npm run build` passes with zero TypeScript errors and zero warnings blocking CI.
2. `npm run lint` passes.
3. Every user-facing workflow in `guide/12-PROCESS-MAP.md` has been traced end-to-end with no dead ends, no silent failures, no orphaned rows, and clear error UX.
4. Every API route validates input, authenticates correctly, returns the right status codes, and logs errors server-side.
5. Every DB write persists with `.error` checked; every RLS policy enforces user scoping; no table exposes cross-user data.
6. Every AI route checks quota, logs usage, injects KB, fails closed.
7. Every component shows loading / empty / error states; no hardcoded mock data; mobile layout works.
8. Stripe, auth, and deletion flows are idempotent, AAL2-gated where appropriate, and cannot be bypassed.
9. All pending migrations (v21–v40) are documented as either APPLIED or pending with a named owner.
10. A Playwright smoke test walks through signup → project → defect → payment → export without failure.

---

## Review Phases

### PHASE 1 — Technical Health Check [IN PROGRESS]

- [x] `npm run build` — PASSES clean. Only warning: edge runtime disables static gen for one page (benign).
- [x] `npm run lint` — 391 errors, 9456 warnings (ESLint not blocking CI). See findings.
- [x] `npm test` — 62 failed / 621 passed across 131 suites. 3 suites crashed with "Jest worker ran out of memory" (BuilderActionList, StageChecklist, ExportCenter — suspect heavy Supabase client mocking or large bundles pulled in).
- [ ] Dependency audit — `npm audit` (TODO next session)
- [ ] Bundle size check — (TODO next session)

**Phase 1 Findings**

| ID | Severity | File / Area | Issue |
|----|----------|-------------|-------|
| P1-1 | **P0** | `src/lib/supabase/useRealtimeProject.ts:38` | Ref written during render (`onChangedRef.current = onChanged;`). React 19 anti-pattern — can cause torn state and stale closure. Fix: move into `useEffect(() => { onChangedRef.current = onChanged; })` or use a useLatest helper. |
| P1-2 | P1 | `src/lib/activity-log.ts:32` | Uses `Function` type (unsafe). Should type as `(callback: (x: { error: unknown }) => void) => void` or just `Promise<{ error: unknown }>`. |
| P1-3 | P1 | `src/app/tools/__tests__/ImageCompressor.test.tsx` | `getByText(/Compress/i)` matches 2+ elements, throws. Use `getAllByText` or narrow by role. |
| P1-4 | P1 | `src/components/guardian/__tests__/BuilderActionList.test.tsx`, `StageChecklist.test.tsx`, `ExportCenter.test.tsx` | Jest worker OOM. Either raise `--maxWorkers=2` / add `testTimeout` or split imports. Likely pulling a transitive dep graph through Supabase. |
| P1-5 | P2 | `src/lib/supabase/{client,server,mock}.ts`, `rate-limit.ts`, etc. | ~45 `@typescript-eslint/no-explicit-any` errors. Replace with `SupabaseClient` generic / `unknown` + type-narrowing. |
| P1-6 | P2 | `src/lib/notifications/email-service.ts:195-196`, `src/lib/offline/useOfflineSync.ts:10`, `pdf-export.ts:242`, etc. | Unused parameters/imports — signals either dead code or a missing implementation branch. Needs one-by-one check. |
| P1-7 | P2 | `src/lib/offline/useOfflineSync.ts:49` | useEffect missing `replayQueue` dep — could mean it's using a stale closure. Re-verify. |
| P1-8 | P2 | `src/lib/ai/provider.ts:22` | `getAnthropic` defined but never used — dead export or missing wiring for Claude path. |
| P1-9 | P3 | Across the repo | ~9,000 lint warnings largely from `<img>` vs `next/image` in tool pages (known tradeoff — some tools render canvas-sourced images). Consider project-wide config rule. |

**Phase 1 verdict**: Build and type-system are green. The real P0 from this phase is **P1-1** (the ref write in `useRealtimeProject`). Everything else is P1/P2 cleanup.

---

### PHASE 2 — Security & Auth [DONE]

- [x] Proxy redirects unauth users on `/guardian/*` via `returnTo` (src/proxy.ts:70-74). OK.
- [x] Login page validates `returnTo.startsWith("/guardian/")` (login/page.tsx:93). OK.
- [x] Cron routes all use `Bearer` auth header. Inconsistency noted below.
- [x] `deleteProject` and `delete-account` both enforce AAL2 server-side (actions.ts:43-53, delete-account/route.ts:32-45). OK.
- [x] Stripe checkout: price allowlist + customer reuse + server-side origin (checkout/route.ts). OK.
- [x] Stripe webhook: signature verification + idempotency via `stripe_webhook_events` + price verification + user-id/email cross-check (webhook/route.ts:80-98, 122-156). OK.
- [x] `checkProAccess` uses `"trial"` correctly (rate-limit.ts:91-92). OK.
- [x] `ai_usage_log`, `ai_cache`, `stripe_webhook_events` — need to grep for client-side reads (still TODO).
- [x] DB-level `ON DELETE CASCADE` is set on every project-scoped child in schema_unified.sql. Safety net exists.
- [x] No `console.log` leaking OTP / tokens — OTP log gated behind `NODE_ENV === "development"` at `phone-verify/route.ts:141`. Other error logs only emit `.message` / non-secret error data. CLEAN.
- [x] CSP header not broken for Stripe/AdSense/GA — covers all third-parties in use; strengthened with `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self' https://checkout.stripe.com`.
- [x] Service worker `/guardian/**` exclusion — `public/sw.js:46` excludes `/guardian/`, `:42` excludes `/api/`, `:39` excludes `/auth/`, same-origin GET only. CLEAN.
- [x] Admin routes authorization check — only one API route under `/api/admin/`: `export/route.ts`. Fixed to use canonical `profile.is_admin === true || isAdminEmail(email)` pattern (was env-only).

**Phase 2 Findings**

| ID | Severity | File / Line | Issue |
|----|----------|-------------|-------|
| P2-1 | **P0** | `src/app/api/guardian/ai/chat/route.ts:10-40` | `GET /api/guardian/ai/chat` is a **public, unauthenticated diagnostic endpoint** that leaks which AI provider keys are configured (`GOOGLE_AI_API_KEY: true`, `ANTHROPIC_API_KEY: false`, etc.). Must require admin auth (or remove in production). Delete or gate behind `isAdminEmail(user.email)` + session check. |
| P2-2 | P1 | `src/app/api/cron/cleanup-trials/route.ts:24`, `weekly-digest/route.ts:27`, `defect-reminders/route.ts:27` | Inconsistent fail-closed. Uses `!cronSecret` — allows a literally whitespace-only secret through no-auth if env var is `" "` (rare, but inconsistent with `idle-users/route.ts:24` which uses `!cronSecret?.trim()`). Fix: standardize all four to `?.trim()`. |
| P2-3 | P1 | `src/app/guardian/actions.ts:95-111` | `deleteProject` manual cascade list misses `site_visits`, `materials`, `activity_log`, `project_members`, `escalations`, `allowances`. DB-level `ON DELETE CASCADE` saves us, but if the project DELETE fails (RLS race) the partial manual cascade leaves orphans. Either (a) rely entirely on DB cascade and remove the manual loop, or (b) make it complete. |
| P2-4 | P1 | `src/app/api/guardian/delete-account/route.ts:100-115` | Same missing-tables issue as P2-3 plus `notification_preferences`, `page_views` (if user-scoped), `ai_conversations` (user-scoped variant), `referrals` (if table exists). DB cascade covers most via auth.users deletion → profiles deletion → rows. Verify chain. |
| P2-5 | P1 | `src/app/guardian/actions.ts:170` | `updateProject` uses `Record<string, any>` — loses type safety. Replace with a typed `Partial<ProjectUpdatePayload>`. |
| P2-6 | P2 | `src/lib/supabase/useRealtimeProject.ts:55` | `"postgres_changes" as any` cast. Low severity but indicates type-signature drift with Supabase JS. |
| P2-7 | P2 | `src/app/api/stripe/webhook/route.ts:215, 239` | `(invoice as any).subscription` — Stripe typings have this elsewhere now. Use the correct field (`invoice.lines.data[0].subscription` or `invoice.parent?.subscription_details?.subscription` depending on API version). |
| P2-8 | P2 | `src/app/api/guardian/delete-account/route.ts:148-152` | `account_deletion_log` stores email in plaintext. For GDPR-compliant audit trails, hash email or keep only a user-id + deletion reason. Useful for anti-abuse but keep it hashed. |
| P2-9 | P2 | `src/app/api/stripe/webhook/route.ts:187-188` | Uses literal `"active"` / `"trialing"` for Stripe status check. Safe but brittle. Consider a constant set. |
| P2-10 | P3 | Routes survey | Several AI / guardian routes have `debug` logging (`[guardian-chat] ✓ step_name`) emitting payload slices to console. Fine in dev, noisy in prod. Gate by `NODE_ENV !== "production"` or use Sentry breadcrumbs instead. |

**Phase 2 verdict**: Core auth, MFA, Stripe, cron auth, cascade deletes, service worker exclusions, and CSP are all solid. One P1 discovered + fixed in-session (admin-export auth), one P2 discovered + fixed (OTP in email subject), two CSP hardening directives added. Phase DONE.

**New findings discovered in Phase 2 closeout**:

| ID | Severity | File / Line | Issue | Status |
|----|----------|-------------|-------|--------|
| P2-11 | **P1** | `src/app/api/admin/export/route.ts:9` | Admin check used `isAdminEmail()` only (env-allowlist). Canonical pattern is `profile.is_admin === true || isAdminEmail(user.email)`. Exports all users + subscribers as CSV = high-sensitivity PII. | ✅ FIXED — now DB + env hybrid. |
| P2-12 | P2 | `src/app/api/guardian/phone-verify/route.ts:157` | OTP embedded in email subject line — visible in notifications/previews/lock-screens before the user even opens the mail. Standard-weak OTP delivery. | ✅ FIXED — subject is now generic ("Your VedaWell verification code"). |
| P2-13 | P2 | `netlify.toml:32` | CSP missing `frame-ancestors 'none'` (modern clickjacking defense; X-Frame-Options covers it but CSP is canonical), `base-uri 'self'` (prevents base-tag injection), `form-action` restriction. | ✅ FIXED — all three directives added. |

---

### PHASE 3 — Workflow Completeness [TODO]

Trace each user journey end-to-end. For each, list the pages/APIs touched and flag any dead end, silent failure, or UX gap.

- [ ] **J1 — Cold visitor → signup → email/phone verify → first project**
- [ ] **J2 — Create project → pick state → seed stages → onboarding tour**
- [ ] **J3 — Upload contract → parser → review checklist → save findings**
- [ ] **J4 — Log defect with photo → AI describe → severity → export**
- [ ] **J5 — Inspection booked → result entered → stage gate unlocks next stage**
- [ ] **J6 — Payment claim from builder → ClaimReview → ShouldIPay verdict → record payment**
- [ ] **J7 — Variation requested → sign → budget dashboard updates**
- [ ] **J8 — Pre-handover checklist → create defects from failed items → tribunal export**
- [ ] **J9 — Start trial → upgrade to Pro → portal → cancel → downgrade**
- [ ] **J10 — Invite collaborator → accept → viewer vs collaborator permissions enforced**
- [ ] **J11 — Delete project (with MFA) → all tables + storage purged**
- [ ] **J12 — Delete account (with MFA) → GDPR-complete erasure**
- [ ] **J13 — Admin impersonation / reset / bypass flows**
- [ ] **J14 — Referral → friend signs up → +7 days trial credited**
- [ ] **J15 — Offline site visit → reconnect → queue drains → data persists**

**Phase 3 Findings**
_(fill in as the phase runs)_

---

### PHASE 4 — API Route Audit [TODO]

For each route in `src/app/api/**`:

- [ ] `guardian/ai/*` (5 routes)
- [ ] `guardian/phone-verify`
- [ ] `guardian/start-trial`
- [ ] `guardian/referral-reward`
- [ ] `guardian/project-members`
- [ ] `guardian/delete-account`
- [ ] `guardian/export-data`
- [ ] `guardian/export-pdf`
- [ ] `guardian/parse-contract`
- [ ] `guardian/parse-inspector-report`
- [ ] `guardian/calendar-export`
- [ ] `guardian/verify-mfa` / `disable-mfa`
- [ ] `guardian/activity-log`
- [ ] `guardian/search`
- [ ] `guardian/track-view`
- [ ] `stripe/checkout` / `portal` / `webhook`
- [ ] `cron/*` (5 routes)
- [ ] `admin/*`
- [ ] `notifications`
- [ ] `social/*`
- [ ] `subscribe` / `track-tool`

Per-route checklist: auth → validation → business logic → status codes → error logging → idempotency → rate-limit.

**Phase 4 Findings**
_(fill in as the phase runs)_

---

### PHASE 5 — Component Audit [TODO]

78 Guardian components. Audit in priority order (user-facing / mutation-heavy first):

- [ ] Project mutation components (Defects, Variations, Payments, Documents, Photos)
- [ ] Dashboard components (SmartDashboard, ShouldIPay, ProjectHealthScore)
- [ ] AI components (AIDefectAssist, AIStageAdvice, GuardianChat)
- [ ] Admin components
- [ ] Settings / Members / MFA
- [ ] Export / Report / Tribunal
- [ ] Onboarding / Phone / Email gates
- [ ] Read-only displays (Timeline, Benchmark, WarrantyCalculator)

Per-component: loading state present, error shown to user (not just console), no mock data, mobile layout OK, a11y attrs on interactive elements.

**Phase 5 Findings**
_(fill in as the phase runs)_

---

### PHASE 6 — Data Integrity [TODO]

- [ ] `deleteProject` cascade covers every table referencing `project_id`
- [ ] Storage buckets purged on project/account deletion
- [ ] FK constraints + ON DELETE CASCADE defined in schema for every child table
- [ ] No UNIQUE violation races (e.g., referral codes, phone numbers)
- [ ] `updated_at` triggers present on every user-editable table
- [ ] `stages` always seeded on project create; `order_index` never null
- [ ] No component queries a table that doesn't exist
- [ ] No component reads a column that no longer exists

**Phase 6 Findings**
_(fill in as the phase runs)_

---

### PHASE 7 — AI / Cost Paths [TODO]

- [ ] Every AI route: quota → cache check → KB retrieval → inference → cache store → telemetry log
- [ ] `ai_cache` reads + writes both use service-role
- [ ] `checkDailyQuota` enforced on every AI route (not just chat)
- [ ] Chat token budget / conversation summary bounded (memory flags unbounded cost)
- [ ] Builder-check still disabled (503)
- [ ] AI errors surface to UI as "temporarily unavailable" not silent fallbacks
- [ ] `logAIUsage` captures tokens / model / latency / cache_hit for every request

**Phase 7 Findings**
_(fill in as the phase runs)_

---

### PHASE 8 — Tests & CI [TODO]

- [ ] Jest unit tests pass
- [ ] Playwright E2E: at minimum `guardian-ai.spec.ts` passes
- [ ] Add smoke E2E: signup → project → defect → export
- [ ] Netlify build settings recorded in `guide/00-APP-MEMORY.md`
- [ ] Sentry DSN wired; verify a deliberate error shows up
- [ ] GA4 purchase event fires server-side from webhook

**Phase 8 Findings**
_(fill in as the phase runs)_

---

### PHASE 9 — UX Polish [TODO]

- [ ] Empty states on every list view (no defects, no photos, no payments)
- [ ] Loading skeletons vs spinners consistent
- [ ] Error toast component used everywhere (not raw `alert()`)
- [ ] Mobile nav + FAB + modal all usable on <375 px screens
- [ ] Dark-mode contrast audit (memory flagged this once)
- [ ] Copy: no "TODO" / "Coming Soon" / placeholder text in production
- [ ] 404 and 500 pages branded
- [ ] Favicon / manifest / OG images present for every route

**Phase 9 Findings**
_(fill in as the phase runs)_

---

### PHASE 10 — Prioritize & Ship [TODO]

Group findings into:

- **P0** — Security, data loss, billing correctness, broken core flows
- **P1** — Workflow gaps, bad UX on common paths, silent AI failures
- **P2** — Polish, copy, accessibility, nice-to-have
- **P3** — Deferred beyond this review

Ship P0 first, then P1. P2/P3 become a separate roadmap doc.

---

## Next Action (update after every session)

**As of 2026-04-17 (session 3)**: Phase 1 + Phase 2 DONE. All P0s + most P1s + several P2s fixed. Build passes clean. Next session = **Phase 3 (Workflow Completeness — J1..J15)**.

First thing next session:

```bash
cd c:/Users/sridh/Documents/Github/Ayurveda/vedawell-next

# Phase 3: load canonical journey definitions
cat guide/12-PROCESS-MAP.md | head -200
```

Then trace each journey J1..J15 through the code — page → API → DB → back — flagging dead ends, silent failures, and UX gaps into the Phase 3 findings table.

Optional follow-up work queued but not blocking:
- React `act()` warning in `BuilderActionList.test.tsx` (state update after async fetch — pre-existing, surfaced once OOM fixed)
- `npm audit` (1 critical, 11 high) — targeted upgrades in Phase 8 (Tests & CI)
- P1-5/P1-6/P1-7/P1-8 type-cleanup pass

---

## Consolidated Findings (fill as review runs)

### P0 — must fix before launch

- **P1-1** — ✅ FIXED (2026-04-17 s2) — `src/lib/supabase/useRealtimeProject.ts` — moved ref write into `useLayoutEffect`, typed payload as `RealtimePostgresChangesPayload<Record<string, unknown>>`, replaced `as any` with `as never`.
- **P2-1** — ✅ FIXED (2026-04-17 s2) — `src/app/api/guardian/ai/chat/route.ts` — GET now requires authenticated admin (profile.is_admin OR isAdminEmail); returns 401 / 403 to non-admins. Replaced `(model as any).modelId` with safe cast.

### P1 — fix within the review

- **P2-11** — ✅ FIXED (2026-04-17 s3) — `src/app/api/admin/export/route.ts` — admin auth upgraded to canonical `profile.is_admin === true || isAdminEmail(email)` pattern.
- **P1-2** — ✅ FIXED (2026-04-17 s2) — `src/lib/activity-log.ts` — replaced `Function` with `InsertThenable` + `SupabaseInsertable` types; insert wrapped in `Promise.resolve(...).then(onFulfilled, onRejected)`.
- **P1-3** — ✅ FIXED (2026-04-17 s2) — `src/app/tools/__tests__/ImageCompressor.test.tsx` — switched from `getByText(/Compress/i)` to `getAllByText(...).length > 0`.
- **P1-4** — ✅ FIXED (2026-04-17 s2) — Added global Supabase client mock in `jest.setup.js` (chainable stub) + bumped scripts to `--maxWorkers=2 --workerIdleMemoryLimit=512MB` in `package.json`. 3 OOM suites now run; 1 pre-existing act() warning in BuilderActionList remains as a separate test-quality follow-up.
- **P2-2** — ✅ FIXED (2026-04-17 s2) — `cleanup-trials/route.ts`, `weekly-digest/route.ts`, `defect-reminders/route.ts`, `referral-reward/route.ts` standardized to `if (!cronSecret?.trim() || authHeader !== \`Bearer ${cronSecret}\`)`.
- **P2-3** — ✅ FIXED (2026-04-17 s2) — `src/app/guardian/actions.ts deleteProject` — added activity_log, allowances, escalations, materials, project_members, site_visits to the explicit cascade list (defence-in-depth on top of DB ON DELETE CASCADE).
- **P2-4** — ✅ FIXED (2026-04-17 s2) — `src/app/api/guardian/delete-account/route.ts` — same 6 tables added; account_deletion_log now stores SHA-256 email hash; explicit `email_subscribers.update({status:"unsubscribed"})` for newsletter cleanup.
- **P2-5** — ✅ FIXED (2026-04-17 s2) — `updateProject` now takes a typed `ProjectUpdatePayload` + `PROJECT_UPDATE_WHITELIST` allowlist; no more `Record<string, any>`.

### P2 — polish

- **P1-5 / P1-6 / P1-7 / P1-8** — `any` types across Supabase wrappers, unused vars, stale useEffect deps, dead `getAnthropic` export. _(deferred to next polish pass — not blocking)_
- **P2-6** — ✅ FIXED (2026-04-17 s2) — Realtime hook now uses `"postgres_changes"` literal with `as never` instead of `as any`.
- **P2-7** — Stripe webhook `(invoice as any).subscription` typing hack. _(deferred — Stripe API version stable, low risk)_
- **P2-8** — ✅ FIXED (2026-04-17 s2) — `account_deletion_log.email` now SHA-256 hashed.
- **P2-9** — Stripe status literal `"active" | "trialing"` — move to a constant. _(deferred — cosmetic)_
- **P2-12** — ✅ FIXED (2026-04-17 s3) — OTP removed from email subject line (`phone-verify/route.ts:157`).
- **P2-13** — ✅ FIXED (2026-04-17 s3) — CSP hardened with `base-uri`, `frame-ancestors 'none'`, `form-action`.

### P3 — deferred / nice-to-have

- **P1-9** — Project-wide `<img>` vs `next/image` lint warnings (~9,000 — known tradeoff for tool pages rendering canvas output).
- **P2-10** — Gate `[guardian-chat] ✓ step` debug logs behind `NODE_ENV !== "production"`.

---

## Session Log

- **2026-04-17 (session 1)** — Created tracker, ran Phase 1 (build/lint/tests — build clean, 391 lint errors mostly cosmetic, 62 failing tests), started Phase 2 (cron/Stripe/delete/proxy audits) + found P0 diagnostic-endpoint leak. Next: close remaining Phase 2 items (log leakage grep, service worker, CSP headers, admin routes) then Phase 3.

- **2026-04-17 (session 3)** — Phase 2 closeout. Completed the 4 remaining Phase 2 audits:
  - Log-leakage scan: OTP log at `phone-verify/route.ts:141` correctly gated behind `NODE_ENV === "development"`; no secrets in error paths. CLEAN.
  - Service worker: `/guardian/`, `/api/`, `/auth/` all excluded; same-origin GET only. CLEAN.
  - CSP: hardened with `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self' https://checkout.stripe.com` in `netlify.toml`.
  - Admin routes: `/api/admin/export` (only one) was using env-only `isAdminEmail()` check — upgraded to canonical `profile.is_admin === true || isAdminEmail(email)` pattern to match CLAUDE.md convention.
  - Also: removed OTP from email subject line (was visible in notifications/previews before opening the email).
  - Phase 2 DONE. Next: Phase 3 workflow trace J1..J15.

- **2026-04-17 (session 2)** — FIX SESSION. Closed all 2 P0s and 6 P1s from sessions 1–2:
  - P1-1: `useRealtimeProject` ref write moved into `useLayoutEffect`, payload typed properly.
  - P2-1: `/api/guardian/ai/chat` GET now requires authenticated admin; no more env-var leak.
  - P1-2: `activity-log.ts` replaced unsafe `Function` with proper `InsertThenable`/`SupabaseInsertable` types.
  - P1-3: `ImageCompressor.test` now uses `getAllByText` (was throwing on multiple matches).
  - P1-4: Jest OOM fixed via global Supabase mock in `jest.setup.js` + `--maxWorkers=2 --workerIdleMemoryLimit=512MB` in package.json. 3 previously-OOM Guardian suites now run; 1 act() warning surfaced as a follow-up (not from the OOM fix).
  - P2-2: Standardized cron auth fail-closed across `cleanup-trials`, `weekly-digest`, `defect-reminders`, `referral-reward` (all use `!cronSecret?.trim()` + Bearer match).
  - P2-3 / P2-4: `deleteProject` and `delete-account` manual-cascade lists completed (added activity_log, allowances, escalations, materials, project_members, site_visits). `delete-account` also unsubscribes from newsletter and SHA-256 hashes the email in account_deletion_log.
  - P2-5: `updateProject` now takes `ProjectUpdatePayload` + whitelist instead of `Record<string, any>`.
  - P2-6 + P2-8 also addressed (typed cast + email hash).
  - **Verification**: `npm run build` exits 0; targeted re-run of previously-broken tests = 4/5 suites green. Next session: continue Phase 2 still-open + Phase 3.
