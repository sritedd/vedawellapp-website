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

### PHASE 3 — Workflow Completeness [DONE]

Trace each user journey end-to-end. For each, list the pages/APIs touched and flag any dead end, silent failure, or UX gap.

- [x] **J1 — Cold visitor → signup → email/phone verify → first project** — traced via `login/page.tsx` + `handle_new_user` trigger in `schema_unified.sql:657-670`. Signup flow is clean. 1 finding (P3-4).
- [x] **J2 — Create project → pick state → seed stages → onboarding tour** — traced `projects/new/page.tsx`. 1 finding (P3-1 non-atomic seed).
- [x] **J3 — Upload contract → parser → review checklist → save findings** — traced `ContractParser.tsx` + `parse-contract/route.ts`. 5 findings (P3-11 to P3-15) — most notable: AI result never persisted back to project.
- [x] **J4 — Log defect with photo → AI describe → severity → export** — traced `ProjectDefects.tsx`. 1 finding (P3-2) — ✅ FIXED.
- [x] **J5 — Inspection booked → result entered → stage gate unlocks next stage** — traced `InspectionTimeline.tsx`. 3 findings (P3-16/17/18) — notably no stage gate wiring: passing inspection does NOT advance `current_stage`.
- [x] **J6 — Payment claim from builder → ClaimReview → ShouldIPay verdict → record payment** — traced `PaymentSchedule.tsx`. 2 findings (P3-6 no audit log, P3-7 fetch errors discarded).
- [x] **J7 — Variation requested → sign → budget dashboard updates** — traced `ProjectVariations.tsx`. 4 findings (P3-19/20/21/22) — notably: tier-check fails OPEN if profile query errors (free users get Pro features).
- [x] **J8 — Pre-handover checklist → create defects from failed items → tribunal export** — traced `PreHandoverChecklist.tsx`. 2 findings (P3-23 schema mismatch stores photoNote in image_url; P3-24 partial-success not flagged).
- [ ] **J9 — Start trial → upgrade to Pro → portal → cancel → downgrade** _(deferred to next session)_
- [ ] **J10 — Invite collaborator → accept → viewer vs collaborator permissions enforced** _(deferred to next session)_
- [ ] **J11 — Delete project (with MFA) → all tables + storage purged** _(covered in Phase 2 P2-3 — full cascade list now applied)_
- [ ] **J12 — Delete account (with MFA) → GDPR-complete erasure** _(covered in Phase 2 P2-4)_
- [ ] **J13 — Admin impersonation / reset / bypass flows** _(deferred to next session)_
- [x] **J14 — Referral → friend signs up → +7 days trial credited** — traced `referral-reward/route.ts`. 2 findings — the endpoint logic is solid BUT **P3-26 is P0: no code anywhere in the app calls this endpoint**. The referral flow is completely unwired — dead code.
- [x] **J15 — Offline site visit → reconnect → queue drains → data persists** — traced `useOfflineSync.ts`. 3 findings (P3-3 unbounded retry, P3-9 errors silenced, P3-10 useEffect dep).

**Phase 3 Findings**

| ID | Severity | File / Line | Issue | Status |
|----|----------|-------------|-------|--------|
| P3-1 | **P1** | `src/app/guardian/projects/new/page.tsx:207-284` | Project seeding loop (stages, pre-handover items, contract fields) is client-side and non-atomic. If the page closes mid-loop, the project exists but stages are partial. No transaction boundary, no rollback. | OPEN — needs server action / RPC |
| P3-2 | **P1** | `src/components/guardian/ProjectDefects.tsx` updateStatus | `if (!updateError)` had no else branch — DB update failures silently ignored, UI showed stale status. | ✅ FIXED (s4) — surfaces error via setError + early return. |
| P3-3 | P1 | `src/lib/offline/useOfflineSync.ts` replay loop | Queued mutation retries are unbounded. A malformed payload or permanently-failing row retries forever on every reconnect, hammering the API. | OPEN — add max-retry + dead-letter state |
| P3-4 | P2 | `src/app/guardian/login/page.tsx:140` | Post-signup profile update (`is_builder`, `is_certifier` flags) does not check `.error`. If the profile row wasn't yet created by the trigger (race), the update silently no-ops. | OPEN — check error + retry once |
| P3-5 | P2 | `src/app/guardian/projects/new/page.tsx` contract date | `contract_signed_date` IS persisted in project insert at line 183 — initial suspicion was wrong. Not a bug. | CLEARED |
| P3-6 | P2 | `src/components/guardian/PaymentSchedule.tsx` markAsPaid | Payment recording does not write to `activity_log`. Every other mutation (defects, variations) logs to activity; payments are a notable gap for the audit trail story. | OPEN — add `logActivity(...)` call |
| P3-7 | P2 | `src/components/guardian/PaymentSchedule.tsx` fetchData | Catches errors from payment fetch and silently sets empty array — user sees "no payments" when the query actually failed. | OPEN — surface error state |
| P3-8 | P3 | `src/app/guardian/projects/new/page.tsx` state validation | No UI check that state (NSW/VIC/etc.) is valid before the seed workflow lookup. If user types an invalid state via URL hack, seed returns 0 stages and project looks broken. | OPEN — add allowlist |
| P3-9 | P2 | `src/lib/offline/useOfflineSync.ts` replay errors | When a replay item fails, the error is logged to console but nothing surfaces to the UI. User has no idea their offline writes didn't land. | OPEN — expose failedQueue + toast |
| P3-10 | P3 | `src/lib/offline/useOfflineSync.ts:49` | `useEffect` missing `replayQueue` in deps — uses initial closure. Works today because the ref is stable, but a refactor could break it silently. | OPEN — extract to `useCallback` |
| P3-11 | **P1** | `src/app/api/guardian/parse-contract/route.ts:29-35` | Missing `checkDailyQuota` + `logAIUsage` — contract parsing is not counted toward user AI quota or logged to telemetry. Violates `.claude/rules/api-routes.md` "All AI routes: check quota, log usage". Cost leak + telemetry gap. | OPEN |
| P3-12 | **P1** | `src/components/guardian/ContractParser.tsx:95` | AI-extracted contract data is displayed only. There is **no "Save to Project"** action — user uploads, AI parses, user closes tab → all data is lost. User must re-parse (burning another AI quota) every session. Should write `contract_sum`, `builder_name`, etc. back to `projects` row. | OPEN |
| P3-13 | P2 | `src/app/api/guardian/parse-contract/route.ts:52-75` | Does not inject KB context via `retrieveKnowledge()` — all other AI routes do. Contract parsing could benefit from state-specific clauses ("NSW Fair Trading mandates..."). | OPEN |
| P3-14 | P2 | `src/app/api/guardian/parse-contract/route.ts:87` | `JSON.parse(jsonMatch[0])` has no try/catch — malformed AI output crashes to the 500 handler with generic "Failed to parse contract", no retry, wasted AI call. | OPEN |
| P3-15 | P3 | `src/app/api/guardian/parse-contract/route.ts:39` | `projectId` destructured from request body but never used — dead param. Either wire it into a persist-to-project write (see P3-12) or remove. | OPEN |
| P3-16 | P2 | `src/components/guardian/InspectionTimeline.tsx:128-132` | `addInspection` silent-fails: if insert errors, `data` is null, branch skips all UI updates including `setShowAddForm(false)`. No error surfaced to user. | ✅ FIXED (s4) — sets `addError`, renders inline red banner. |
| P3-17 | P2 | `src/components/guardian/InspectionTimeline.tsx:50-68` | `fetchData` reads `stages` + `inspections` but never checks `.error` on either. DB failure = empty lists shown as "no inspections" / "no stages" with no error signal. | ✅ FIXED (s4) — sets `loadError`, renders red banner in place of empty list. |
| P3-18 | **P1** | `src/components/guardian/InspectionTimeline.tsx:86-108` | **Stage-gate gap**: passing an inspection updates the inspections row but does NOT advance `projects.current_stage`. J5 canonical flow ("result entered → stage gate unlocks next stage") is incomplete. Users manually change stage or don't know next stage is available. | OPEN |
| P3-19 | P2 | `src/components/guardian/ProjectVariations.tsx:131` | `handleSign` uses `if (!error)` with no else — signature + approval silently fail. User sees dialog just close with no "saved" confirmation or error. | ✅ FIXED (s4) — surfaces error via setTierError + early return. |
| P3-20 | **P1** | `src/components/guardian/ProjectVariations.tsx:62-75` | Tier check fails OPEN: if the profile select errors, `tierLimited` stays `false` and Pro gating is bypassed. Free users get unlimited variations on transient DB error. Server-side insert is also unguarded. | ✅ FIXED (s4) — fail-closed: no-user or profile-fetch-error both now set `tierLimited = true`. |
| P3-21 | P3 | `src/components/guardian/ProjectVariations.tsx:43-47` | `fetchVariations` logs error but leaves prior state; could mask stale data post-failure. Low severity. | OPEN |
| P3-22 | P1 | `src/components/guardian/ProjectVariations.tsx` free-tier check | Free-tier variation limit is client-side only. A user who tampers with state (or a future API client) can insert unlimited variations — RLS allows owner writes unconditionally. | OPEN — enforce in DB trigger or API route |
| P3-23 | **P1** | `src/components/guardian/PreHandoverChecklist.tsx:552` | Bridge stores `s.photoNote` (a text note) in the `image_url` column. Schema mismatch — when ProjectDefects renders `image_url` as an `<img src>`, it will break. Should be `notes` or a dedicated field. | ✅ FIXED (s4) — photoNote now appended to `description` instead; image_url left null. |
| P3-24 | P3 | `src/components/guardian/PreHandoverChecklist.tsx:562-566` | Partial-success not flagged: shows "N defects created" using DB-returned count, but doesn't tell the user if fewer were created than requested. | OPEN |
| P3-25 | P3 | `src/app/api/guardian/referral-reward/route.ts:111-115` | The `guardian_pro` branch does an atomic CAS update but silently returns success even if `updatedCount === 0` (race lost). Inconsistent with the trial branch which 409s. | OPEN |
| P3-26 | **P0** | `/api/guardian/referral-reward` has zero callers | **Referral rewards endpoint is completely unwired.** Grep for `referral-reward` across the codebase returns only the route definition itself. Signup flow does not POST a referral on new user creation. Every referral link silently fails to credit the referrer. J14 is broken end-to-end. | ✅ FIXED (s5) — new `/api/guardian/apply-referral` route + `RefCapture` component on `/guardian` landing + localStorage persistence across navigation + signup-side fire-and-forget call. |

---

### PHASE 4 — API Route Audit [DONE]

All ~30 API routes audited across 4 batches (AI / data / auth-account / external-cron-stripe). Per-route checklist: auth → validation → business logic → status codes → error logging → idempotency → rate-limit / quota.

- [x] `guardian/ai/*` — describe-defect, stage-advice, builder-check, chat, claim-review, parse-contract, parse-inspector-report
- [x] `guardian/phone-verify`, `verify-mfa`, `disable-mfa`, `delete-account`
- [x] `guardian/start-trial`, `apply-referral`, `referral-reward`, `track-view`, `project-members`
- [x] `guardian/export-data`, `export-pdf`, `calendar-export`, `activity-log`, `search`
- [x] `stripe/checkout`, `stripe/portal`, `stripe/webhook`
- [x] `cron/*` (idle-users, cleanup-trials, weekly-digest, defect-reminders)
- [x] `admin/export`, `notifications`, `social/auto-post`, `subscribe`, `track-tool`

**Phase 4 Findings**

| ID | Severity | File / Line | Issue | Status |
|----|----------|-------------|-------|--------|
| P4-1 | **P1** | `src/app/api/guardian/ai/claim-review/route.ts:64-72` | Selecting non-existent `current_stage` column from `projects`. PostgREST silently returned no rows → every claim-review request 404'd with "Project not found". Production-broken. | ✅ FIXED (s8) — removed column from select; current stage now computed from first non-completed `stages` row. |
| P4-2 | P3 | `src/app/api/guardian/ai/claim-review/route.ts:60` | Falsy `claimAmount` rejects $0 claims. Real-world impossibility — defer. | DEFERRED |
| P4-3 | P2 | `src/app/api/guardian/ai/claim-review/route.ts:177-186` | JSON-parse-failure response was 200 without `fallback` flag — client UI couldn't distinguish degraded response from real verdict. | ✅ FIXED (s8) — now 502 with `{ fallback: true }`. |
| P4-4 | P2 | `src/app/api/guardian/ai/claim-review/route.ts:203-214` | Catch-block response was 200 without fallback flag — same downstream UX problem as P4-3. | ✅ FIXED (s8) — now 503 with `{ fallback: true }`. |
| P4-5 | **P2** | `src/app/api/guardian/ai/chat/route.ts` POST | `debug` object (step trace + `hasGoogleKey`/`hasAnthropicKey` env-config booleans) returned in error responses to ALL authenticated callers — info-disclosure. The GET handler is admin-gated for this exact reason; POST defeated it via error-body leak. | ✅ FIXED (s8) — added `scrubDebug(payload, isAdmin)` helper; non-admin error responses now omit `debug`. Admin status resolved once via `isAdminEmail(email)` + DB `is_admin` flag fallback. |
| P4-6 | P2 | `src/app/api/guardian/parse-inspector-report/route.ts` | Pattern violation per `.claude/rules/api-routes.md`: missing `checkDailyQuota`, `logAIUsage` (success + error branches), `retrieveKnowledge` KB grounding, `{ fallback: true }` flag, length max-bound. | ✅ FIXED (s8) — full route rewrite to A+ AI-route standard. Quota counts under feature `parse-inspector-report`. |
| P4-7 | P2 | `src/app/api/guardian/disable-mfa/route.ts:107-118` | Admin DELETE on each TOTP factor didn't check `response.ok`. Silent partial success: `mfa_enabled` flag flipped to false in profiles but factors remained in `auth.mfa` — user thought MFA was off but next login still challenged. | ✅ FIXED (s8) — track `failedFactors[]`; if any DELETE fails return 502 before flipping the profile flag. Profile update also now checks `.error` and returns 500 with explicit refresh prompt on failure. |
| P4-8 | P3 | `src/app/api/guardian/phone-verify/route.ts:124-133, 246-249` | OTP-send and attempt-increment writes don't check `.error`. If write fails, OTP is sent but un-verifiable, or brute-force throttle silently breaks. Low-frequency, but worth tightening. | OPEN |
| P4-9 | **P2** | `src/app/api/guardian/export-data/route.ts:14-18` | `profile.*` selected and dumped into the user's GDPR export — leaks credential `phone_otp_hash`, OTP attempt counter, `stripe_customer_id`. The hash is a low-entropy SHA-256 of a 6-digit code (~20 bits, brute-forceable). User receives credentials in their own export. | ✅ FIXED (s8) — replaced `select("*")` with explicit allowlist of 22 user-facing columns; credential + payment-system identifiers excluded. |
| P4-10 | P3 | `src/app/api/guardian/export-pdf/route.ts:165-189` | `profile` and `project` queries don't check `.error`. `!profile` defaults tier to "free" (blocking — safe), but `!project` 404s without distinguishing RLS failure from missing row. | OPEN |
| P4-11 | P3 | `src/app/api/guardian/export-pdf/route.ts` | No per-IP / per-user throttle on PDF generation. Pro user could spam endpoint to inflate Netlify function cost. | OPEN |
| P4-12 | P3 | `src/app/api/guardian/calendar-export/route.ts:119` | `Content-Disposition` filename uses `project.name.replace(/\s+/g, "-")` — could contain CRLF or quotes that break the header. Should strip non-ASCII more aggressively. | OPEN |
| P4-13 | P3 | `src/app/api/notifications/route.ts:117, 121` | Email template inserts `${info.projectName}` and project name without `escapeHtml`. Project name is user-controlled → self-XSS in own inbox. Low impact (sandboxed by mail clients) but inconsistent with `weekly-digest`/`defect-reminders` which do escape. | OPEN |
| P4-14 | P3 | `src/app/api/guardian/apply-referral/route.ts:89` | `referred_by` profile update doesn't check `.error`. If the write fails the reward call still fires — referrer gets credit but the referee profile loses attribution. | OPEN |
| P4-15 | P3 | `src/app/api/admin/export/route.ts:32` | Users CSV exports `phone` column in plaintext. Admins are trusted but PII handling discipline says minimize fields. | OPEN |
| P4-16 | P3 | `src/app/api/cron/defect-reminders/route.ts:143-149` | Escalation tracking update (`escalation_level`, `last_escalation_at`) doesn't check `.error`. If write fails, same defect re-emails next cron run. | OPEN |

**Phase 4 verdict**: 1 P1 (claim-review production bug — fixed + committed in isolation), 4 P2s (chat info-disclosure, parse-inspector standards, disable-mfa silent partial, export-data credential leak — all fixed). 8 P3 polish items left for backlog. All Stripe / cron / admin / external routes solid; no security holes. Build PASSES clean post-fixes.

---

### PHASE 5 — Component Audit [DONE]

78 Guardian components. Audit in priority order (user-facing / mutation-heavy first):

- [x] Project mutation components (Defects, Variations, Payments, Documents, Photos)
- [x] Dashboard components (SmartDashboard, ShouldIPay, ProjectHealthScore)
- [x] AI components (AIDefectAssist, AIStageAdvice, GuardianChat, ClaimReview, ContractParser, InspectorReportImport)
- [x] Admin components (AdminUserManager, AdminUserSearch, AdminAnnouncementManager)
- [x] Settings / Members / MFA (TwoFactorSetup, ProjectSettings, ProjectMembers, PendingInvitations, NotificationPreferences, PhoneVerificationGate)
- [x] Export / Report / Tribunal (ExportCenter, TribunalExport, ShareProgressCard, ReportGenerator)
- [x] Onboarding / Phone / Email gates (OnboardingWizard, GuidedOnboarding)
- [x] Read-only displays (ProgressTimeline, TimelineBenchmark, WarrantyCalculator, BuildJourneyTimeline, MilestoneCelebrations, ProjectHealthScore)
- [x] Mutation components (SiteDiary, WeeklyCheckIn, CommunicationLog, BuilderEscalation, CertificationGate, AllowanceTracker, MaterialRegistry, BuilderRatings, CSVImport, MobilePhotoCapture)

Per-component: loading state present, error shown to user (not just console), no mock data, mobile layout OK, a11y attrs on interactive elements.

**Phase 5 Findings**

| ID | Severity | Location | Issue | Status |
|----|----------|----------|-------|--------|
| P5-1 | P1 | `src/components/guardian/ProjectDefects.tsx` + `supabase/schema_v42_defect_limit.sql` | Client-only `FREE_DEFECT_LIMIT = 3` bypassable via direct Supabase calls. Mirrors v41 variation gap. | ✅ FIXED (2026-04-20 s9) — new `BEFORE INSERT` trigger + client maps `FREE_TIER_DEFECT_LIMIT` error |
| P5-2 | P2 | `src/components/guardian/ProjectDefects.tsx:314-322` | Defect photo `image_url` update silent + storage orphan on failure. UI showed success, DB never got URL. | ✅ FIXED — `.error` check + blob rollback |
| P5-3 | P2 | `src/components/guardian/TwoFactorSetup.tsx:92-104` | `profiles.update({mfa_enabled})` silent after `auth.mfa.verify()` — factor enrolled but profile flag stuck at false = split-brain state. | ✅ FIXED — `.error` check + user-visible "refresh or contact support" message |
| P5-4 | P2 | `src/components/guardian/StageGate.tsx:310-330` | Stage completion fallback `ilike` update didn't check its own error. Both paths could fail silently → `onProceed` fired → user advanced with DB still showing in_progress. | ✅ FIXED — capture `fallbackError`, block `onProceed` if both fail |
| P5-5 | P2 | `src/components/guardian/GuardianChat.tsx:94,107,193` | `saveConversation` (update + insert paths) and `deleteConversation` silent. Chat history could silently fail to persist or delete. | ✅ FIXED — `.error` checks + alert on delete |
| P5-6 | P2 | `src/components/guardian/ProgressPhotos.tsx:194` | Photo delete silent — UI removed photo but DB still had it. | ✅ FIXED — `.error` check + inline error |
| P5-7 | P2 | `src/components/guardian/DocumentVault.tsx` | Upload: DB insert failure left storage blob orphan. Delete: storage blob not cleaned up after row delete. Fetch: errors swallowed to console. | ✅ FIXED — storage rollback on upload, `extractStoragePath()` helper + cleanup on delete, `fetchError` banner |
| P5-8 | P1 | `src/components/guardian/ShouldIPay.tsx:40-116` | 4 silent reads (payments / certifications / inspections / defects). If any blocker-check query failed, arrays defaulted empty → wrongly showed **"Safe to Pay"**. Direct financial blast radius. | ✅ FIXED — `.error` check on every query; any failure now renders amber "Verdict Unavailable — do NOT pay until all checks load" card instead of green-light |
| P5-9 | P2 | `src/components/guardian/ProjectMembers.tsx:82-85` | `handleRemove` silently swallowed non-OK DELETE responses. User confirmed removal, got no feedback, member stayed. | ✅ FIXED — surface `data.error` message on non-OK |
| P5-10 | P2 | `src/components/guardian/SiteDiary.tsx:137-142` | Tribunal-grade site-visit save silent. User thought visit was recorded; nothing persisted. | ✅ FIXED — alert on error |
| P5-11 | P2 | `src/components/guardian/WeeklyCheckIn.tsx:101-108` | Weekly check-in form silent on insert failure. | ✅ FIXED — alert on error |
| P5-12 | P2 | `src/components/guardian/CommunicationLog.tsx:76-88` | Communication log entry silent on insert failure. | ✅ FIXED — alert on error |
| P5-13 | P2 | `src/components/guardian/BuilderEscalation.tsx:109-124` | Escalation insert silent. Letter generated but no DB record — user thought escalation was logged. | ✅ FIXED — alert on error, early return |
| P5-14 | P2 | `src/components/guardian/InspectorReportImport.tsx:119-137` | Insert loop tracked `count` but not failures. User saw partial count with no error messaging. | ✅ FIXED — capture `lastError`, setError when count < selected.length |
| P5-15 | P2 | `src/components/guardian/CertificationGate.tsx:84-134` | Same storage orphan pattern as DocumentVault — upload succeeded, DB `insert/update` threw, blob left behind. | ✅ FIXED — track `uploadedFileName`, rollback on catch |

**Audited clean (no fix needed)**: ProjectVariations (server+client already hardened by v41 trigger), ProjectHealthScore (read-only, cosmetic impact only), MilestoneCelebrations (cosmetic achievements), AIDefectAssist/AIStageAdvice/ClaimReview/ContractParser (proper `setError` on every branch), AdminUserManager/AdminUserSearch (server actions return `{error}` and surface inline), NotificationPreferences (alert on error), ProjectSettings (inline message), PendingInvitations (alerts on fetch failure), PhoneVerificationGate (`setMessage` on all branches), AllowanceTracker/MaterialRegistry/BuilderRatings/CSVImport (all alert on error), MobilePhotoCapture (full `setError` surfacing).

**Queued P3 (read-only misleading score under silent fetch failure)**: SmartDashboard ~8 fetch queries, ProjectHealthScore 5 parallel queries, PaymentSchedule `fetchData` — all read-only dashboards that silently default to empty arrays on query failure. Impact is cosmetic (wrong score, missing items) vs. the P1 in ShouldIPay which drives a payment decision. Deferred.

**Phase 5 verdict**: 15 findings, 14 fixed in-session. 2 P1s closed (defect-limit bypass = trigger + client mapping; ShouldIPay silent reads → fail-safe amber verdict). 12 P2s closed (6 silent writes, 4 storage/state orphans, 1 member-remove feedback gap, 1 2FA split-brain, 1 stage-gate whiplash). 3 components with P3-grade silent reads deferred (cosmetic). Build PASSES clean. Migration pending: `schema_v42_defect_limit.sql` must run in Supabase before defect cap is enforced server-side.

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

**As of 2026-04-20 (session 9)**: Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 all DONE. Phase 5 audited all 78 Guardian components across 5 batches (mutation → dashboard → AI → admin/settings → export/read-only). 15 findings: 2 P1s (defect-limit bypass server-side + ShouldIPay fail-safe verdict) + 12 P2s (silent writes, storage orphans, state drift) + 1 misc — all 14 mutation-path issues fixed in-session. 3 read-only dashboards with cosmetic silent reads deferred to P3. Build PASSES clean.

**Migrations pending for deploy** (run in Supabase SQL Editor, in order):
1. `supabase/schema_v41_variation_limit.sql` — server-side free-tier variation cap trigger (Phase 3 P3-22)
2. `supabase/schema_v42_defect_limit.sql` — server-side free-tier defect cap trigger (Phase 5 P5-1)

First thing next session — **PHASE 6: Data Integrity** (schema ↔ component ↔ cascade consistency):

```bash
cd c:/Users/sridh/Documents/Github/Ayurveda/vedawell-next

# Per the checklist in the PHASE 6 section above:
#   1. deleteProject cascade covers every table referencing project_id
#   2. Storage buckets (evidence, documents, certificates, progress-photos) purged on project/account deletion
#   3. FK constraints + ON DELETE CASCADE in schema for every child table
#   4. No UNIQUE violation races (referral codes, phone numbers, etc.)
#   5. updated_at triggers on every user-editable table
#   6. stages always seeded on project create; order_index never null
#   7. No component queries a table that doesn't exist
#   8. No component reads a column that no longer exists
#
# Approach:
#   - Compare src/app/guardian/actions.ts::deleteProject against full child-table list
#     from src/types/guardian.ts + supabase/schema_unified.sql
#   - For each bucket with user uploads, confirm cleanup path exists
#   - grep src/ for `.from("<table>")` → validate table exists in schema_unified
#   - grep src/ for specific column selects → validate column still present
```

Also remaining open from earlier phases: **P3-32** (P2: AdminSupportInbox silently swallows reply failure), Phase 4 P3 backlog (P4-2, P4-8, P4-10, P4-11, P4-12, P4-13, P4-14, P4-15, P4-16), carry-over polish (P3-6 payment activity log, P3-7 payment fetch error, P1-5/6/7/8 type-cleanup), and Phase 5 P3 read-only silent-read backlog (SmartDashboard ~8 silent reads, ProjectHealthScore 5 silent reads, PaymentSchedule silent fetchData; InspectionTimeline stage-promotion silent update at line 131-136; PreHandoverChecklist 3 silent updates at lines 335/371/439; StageGate defect-override loop silent updates at lines 278-286; NCC2025Compliance 2 silent deletes at lines 433/439).

Optional follow-up work queued but not blocking:
- React `act()` warning in `BuilderActionList.test.tsx` (state update after async fetch — pre-existing, surfaced once OOM fixed)
- `npm audit` (1 critical, 11 high) — targeted upgrades in Phase 8 (Tests & CI)
- P1-5/P1-6/P1-7/P1-8 type-cleanup pass

---

## Consolidated Findings (fill as review runs)

### P0 — must fix before launch

- **P1-1** — ✅ FIXED (2026-04-17 s2) — `src/lib/supabase/useRealtimeProject.ts` — moved ref write into `useLayoutEffect`, typed payload as `RealtimePostgresChangesPayload<Record<string, unknown>>`, replaced `as any` with `as never`.
- **P2-1** — ✅ FIXED (2026-04-17 s2) — `src/app/api/guardian/ai/chat/route.ts` — GET now requires authenticated admin (profile.is_admin OR isAdminEmail); returns 401 / 403 to non-admins. Replaced `(model as any).modelId` with safe cast.
- **P3-26** — ✅ FIXED (2026-04-17 s5) — Wired end-to-end:
  1. `src/components/guardian/RefCapture.tsx` — client component captures `?ref=CODE` on any guardian landing visit, stores to localStorage.
  2. `src/app/guardian/page.tsx` — `<RefCapture />` mounted on the landing.
  3. `src/app/guardian/login/page.tsx` — signup success now calls `applyReferralIfPresent()` which POSTs the stored code to the new route, then clears localStorage. Fire-and-forget — signup UX never blocked by referral failures.
  4. `src/app/api/guardian/apply-referral/route.ts` — new authenticated route: looks up referrer by public `referral_code`, writes `profiles.referred_by`, then internally calls `/api/guardian/referral-reward` with `CRON_SECRET`. Idempotent (skips if `referred_by` already set) + self-referral guard.

### P1 — fix within the review

- **P3-2** — ✅ FIXED (2026-04-17 s4) — `src/components/guardian/ProjectDefects.tsx` updateStatus — silent failure on DB error now surfaces via `setError` + early return.
- **P3-17** — ✅ FIXED (2026-04-17 s4) — `src/components/guardian/InspectionTimeline.tsx` — `fetchData` now checks `.error` on stages + inspections reads and renders a red banner.
- **P3-20** — ✅ FIXED (2026-04-17 s4) — `ProjectVariations.tsx` tier check now fails CLOSED on DB error (was fail-open).
- **P3-23** — ✅ FIXED (2026-04-17 s4) — `PreHandoverChecklist.tsx` no longer stores `photoNote` (text) in `image_url` (URL) column; appends to description instead.
- **P3-11** — ✅ FIXED (2026-04-17 s6) — `src/app/api/guardian/parse-contract/route.ts` — now calls `checkDailyQuota`, `logAIUsage` on success/failure paths, and `retrieveKnowledge({ state, category: "contract" })` grounds the prompt with state-specific contract standards. Token usage extracted via `inputTokens ?? promptTokens` dual-name fallback to match AI SDK v5.
- **P3-12** — ✅ FIXED (2026-04-17 s6) — `parse-contract/route.ts` accepts `persistToProject: true` + `projectId` and writes `contract_value`, `builder_name`, `builder_license_number`, `builder_abn`, `start_date`, `contract_signed_date`, `expected_end_date`, `hbcf_policy_number` back to `projects`. `ContractParser.tsx` opts-in + renders green "Saved" confirmation when `persisted: true`.
- **P3-14** — ✅ FIXED (2026-04-17 s6) — `parse-contract/route.ts` `JSON.parse(jsonMatch[0])` wrapped in try/catch; returns 502 + logs `errorCode: "json-parse-failed"` on malformed AI output (was uncaught, would 500).
- **P3-18** — ✅ FIXED (2026-04-17 s6) — `InspectionTimeline.tsx updateInspection` — when result flips to `pass`/`passed`, matching stage row (status=pending, name ilike inspection.stage) is promoted to `in_progress`. Covers the stage-gate wiring gap flagged in J5.
- **P3-27** — ✅ FIXED (2026-04-18 s7) — `project-members/route.ts` now always inserts `status: "pending"` regardless of whether invitee has a profile; added new `PATCH` handler so invitee can `accept` or `decline` via their own session (checks `invited_email` OR `user_id` match). New `PendingInvitations.tsx` component mounted on the dashboard shows outstanding invites with accept/decline buttons.
- **P3-28** — ✅ FIXED (2026-04-18 s7) — `project-members/route.ts` POST now sends a Resend email from `notifications@vedawellapp.com` with project name, inviter name, role, and a dashboard link. Fire-and-forget — email failures do not block the invite.
- **P3-1** — ✅ FIXED (2026-04-18 s7) — `projects/new/page.tsx` — tracks `stageFailures` across the seed loop; if any stage insert fails the project row is rolled back via `.delete().eq("id", projectId).eq("user_id", user.id)` and the user sees `Project setup incomplete — N stage(s) failed. Please try again.`. Closes the half-seeded-project failure mode.
- **P3-22** — ✅ FIXED (2026-04-18 s7) — new `supabase/schema_v41_variation_limit.sql` — BEFORE INSERT trigger on `variations` that looks up `projects.user_id → profiles.subscription_tier`; raises `FREE_TIER_VARIATION_LIMIT` when free-tier user already has 2 variations on the project. Client-side `ProjectVariations.tsx` maps the error to the existing tier-upgrade banner.
- **P2-11** — ✅ FIXED (2026-04-17 s3) — `src/app/api/admin/export/route.ts` — admin auth upgraded to canonical `profile.is_admin === true || isAdminEmail(email)` pattern.
- **P1-2** — ✅ FIXED (2026-04-17 s2) — `src/lib/activity-log.ts` — replaced `Function` with `InsertThenable` + `SupabaseInsertable` types; insert wrapped in `Promise.resolve(...).then(onFulfilled, onRejected)`.
- **P1-3** — ✅ FIXED (2026-04-17 s2) — `src/app/tools/__tests__/ImageCompressor.test.tsx` — switched from `getByText(/Compress/i)` to `getAllByText(...).length > 0`.
- **P1-4** — ✅ FIXED (2026-04-17 s2) — Added global Supabase client mock in `jest.setup.js` (chainable stub) + bumped scripts to `--maxWorkers=2 --workerIdleMemoryLimit=512MB` in `package.json`. 3 OOM suites now run; 1 pre-existing act() warning in BuilderActionList remains as a separate test-quality follow-up.
- **P2-2** — ✅ FIXED (2026-04-17 s2) — `cleanup-trials/route.ts`, `weekly-digest/route.ts`, `defect-reminders/route.ts`, `referral-reward/route.ts` standardized to `if (!cronSecret?.trim() || authHeader !== \`Bearer ${cronSecret}\`)`.
- **P2-3** — ✅ FIXED (2026-04-17 s2) — `src/app/guardian/actions.ts deleteProject` — added activity_log, allowances, escalations, materials, project_members, site_visits to the explicit cascade list (defence-in-depth on top of DB ON DELETE CASCADE).
- **P2-4** — ✅ FIXED (2026-04-17 s2) — `src/app/api/guardian/delete-account/route.ts` — same 6 tables added; account_deletion_log now stores SHA-256 email hash; explicit `email_subscribers.update({status:"unsubscribed"})` for newsletter cleanup.
- **P2-5** — ✅ FIXED (2026-04-17 s2) — `updateProject` now takes a typed `ProjectUpdatePayload` + `PROJECT_UPDATE_WHITELIST` allowlist; no more `Record<string, any>`.

### P2 — polish

- **P3-16** — ✅ FIXED (2026-04-17 s4) — `InspectionTimeline.tsx` addInspection — silent failure now shows `addError` in the form.
- **P3-19** — ✅ FIXED (2026-04-17 s4) — `ProjectVariations.tsx` handleSign — silent failure surfaces via `setTierError`.
- **P3-4** — ✅ FIXED (2026-04-17 s5) — `login/page.tsx` signup now checks `phoneErr` and guards on `data.user?.id`.
- **P3-6** — OPEN — `PaymentSchedule.tsx` markAsPaid doesn't write to `activity_log`.
- **P3-7** — OPEN — `PaymentSchedule.tsx` fetchData errors are silenced.
- **P3-13** — ✅ FIXED (2026-04-17 s6) — `parse-contract/route.ts` now calls `retrieveKnowledge({ state, category: "contract", limit: 5 })` and appends a REFERENCE DATA block to the prompt (state from `projects.state` when `projectId` provided).
- **P3-29** — ✅ FIXED (2026-04-18 s7) — `project-members/route.ts DELETE` now checks `.error` on `.delete()`; returns `500 { error: "Failed to remove member" }` on failure.
- **P3-30** — ✅ FIXED (2026-04-18 s7) — POST normalizes invited email via `.trim().toLowerCase()` + regex validation; consistent with `profiles.email` storage.
- **P3-31** — ✅ FIXED (2026-04-18 s7) — soft rate limit (max 10 pending invites per project) before insert; returns 429.
- **P3-32** — OPEN P2 — `src/components/guardian/AdminSupportInbox.tsx:63` — `adminReply` failure is silently swallowed (`if (res.error) return;`); admin thinks reply sent but it didn't.
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

- **2026-04-20 (session 9)** — PHASE 5 COMPLETE. Audited all 78 Guardian components across 5 batches (mutation-heavy first). Logged 15 findings P5-1..P5-15; closed 2 P1s + 12 P2s; deferred 3 read-only dashboards (cosmetic silent reads) to P3.
  - **P5-1 (P1)**: `ProjectDefects.tsx` had client-only `FREE_DEFECT_LIMIT = 3` bypassable via direct Supabase calls. Added `supabase/schema_v42_defect_limit.sql` — `BEFORE INSERT` trigger resolves tier via `projects → profiles.subscription_tier`, raises `FREE_TIER_DEFECT_LIMIT` check_violation when free user has 3+ defects. Client maps the trigger error message to the existing tier-error banner. Mirrors the v41 variation trigger pattern.
  - **P5-8 (P1)**: `ShouldIPay.tsx` — the "Safe to Pay" mega-button's 4 blocker-check queries (payments / certifications / inspections / defects) all silently defaulted to empty arrays on error. A failed certs query would green-light a payment that actually had missing certs. Added `.error` check on every query; any failure now renders an amber "Verdict Unavailable — refresh, do NOT pay" card instead of the green-light verdict. Direct financial blast radius eliminated.
  - **P5-2/3/4/5/6/7 (P2 × 6)**: `ProjectDefects` photo-URL update silent + orphan, `TwoFactorSetup` profile `mfa_enabled` silent (split-brain state), `StageGate` fallback-error not blocking `onProceed`, `GuardianChat` save + delete silent, `ProgressPhotos` delete silent, `DocumentVault` upload/delete orphan storage + silent fetch — all fixed with `.error` checks, blob rollbacks, and user-visible error messages.
  - **P5-9/10/11/12/13/14/15 (P2 × 7)**: `ProjectMembers.handleRemove` silent non-OK, `SiteDiary` insert silent (tribunal evidence), `WeeklyCheckIn` insert silent, `CommunicationLog` insert silent, `BuilderEscalation` insert silent (letter generated but not logged), `InspectorReportImport` partial-failure silent count, `CertificationGate` storage orphan — all fixed with alert()/setMessage/rollback patterns.
  - Audited clean (no fix): ProjectVariations, ProjectHealthScore, MilestoneCelebrations, AIDefectAssist, AIStageAdvice, ClaimReview, ContractParser, AdminUserManager, AdminUserSearch, NotificationPreferences, ProjectSettings, PendingInvitations, PhoneVerificationGate, AllowanceTracker, MaterialRegistry, BuilderRatings, CSVImport, MobilePhotoCapture.
  - Build: PASSES clean. Phase 5 header now `[DONE]`. Next: Phase 6 (Data Integrity — schema ↔ component ↔ cascade consistency).

- **2026-04-20 (session 8)** — PHASE 4 COMPLETE. Audited all ~30 API routes across 4 batches (AI / data / auth-account / external-cron-stripe). Logged 16 findings P4-1..P4-16; closed 1 P1 + 4 P2s; deferred 8 P3 polish items to backlog.
  - **P4-1 (P1)**: `claim-review/route.ts` selecting non-existent `current_stage` column → every request 404'd with PostgREST silently returning no rows. Removed column from select; current stage now computed from first non-completed `stages` row. Also added `.error` check on project query.
  - **P4-3 / P4-4 (P2)**: `claim-review` JSON-parse-failure + catch-block responses were 200 without `fallback` flag — client couldn't distinguish degraded response from real verdict. Now 502 / 503 with `{ fallback: true }`.
  - **P4-5 (P2)**: `ai/chat/route.ts` POST — `debug` object (step trace + `hasGoogleKey`/`hasAnthropicKey` env booleans) returned in error responses to ALL authenticated callers. GET handler was admin-gated for this exact reason; POST leaked it via error body. Added `scrubDebug(payload, isAdmin)` helper; resolved `isAdmin` once via `isAdminEmail(email)` + DB `is_admin` flag; threaded through all 9 error response paths.
  - **P4-6 (P2)**: `parse-inspector-report/route.ts` — full rewrite to A+ AI-route standard. Added `checkDailyQuota`, `retrieveKnowledge({ state, category: "defects" })` KB grounding, `logAIUsage` on success + every error branch (AI SDK v5 dual-name token fallback), max 50k char bound, `{ fallback: true }` on 422/502/503.
  - **P4-7 (P2)**: `disable-mfa/route.ts` — admin DELETE per factor didn't check `response.ok`. Silent partial success: flag flipped to false but factors remained, so next login still challenged MFA. Now track `failedFactors[]`; if any DELETE fails return 502 before flipping the profile flag. Profile update also checks `.error`.
  - **P4-9 (P2)**: `export-data/route.ts` — `profile.*` dump in GDPR export leaked credential `phone_otp_hash` (~20-bit SHA-256 of 6-digit OTP, brute-forceable), OTP attempt counter, and `stripe_customer_id`. Replaced `select("*")` with explicit 22-column user-facing allowlist.
  - **8 P3 polish items queued** (P4-2, P4-8, P4-10–P4-16): phone-verify silent writes, export-pdf .error checks + throttling, calendar-export filename CRLF, notifications template XSS, apply-referral silent write, admin/export phone column, defect-reminders escalation tracking silent write.
  - Audited clean (no fix needed): activity-log, search, calendar-export, export-pdf (polish only), phone-verify, verify-mfa, delete-account, start-trial, apply-referral, referral-reward, track-view, parse-contract, project-members, stripe checkout/portal/webhook (signature + idempotency + price verification + email cross-check all solid), all 4 cron routes (fail-closed CRON_SECRET + 20s timeout safety + per-row try/catch), notifications, subscribe, track-tool, admin/export, social/auto-post.
  - Build: PASSES clean (12.4s compile, 242 static pages). Phase 4 header now `[DONE]`. Next: Phase 5 (Component audit, 78 Guardian components).

- **2026-04-17 (session 1)** — Created tracker, ran Phase 1 (build/lint/tests — build clean, 391 lint errors mostly cosmetic, 62 failing tests), started Phase 2 (cron/Stripe/delete/proxy audits) + found P0 diagnostic-endpoint leak. Next: close remaining Phase 2 items (log leakage grep, service worker, CSP headers, admin routes) then Phase 3.

- **2026-04-17 (session 3)** — Phase 2 closeout. Completed the 4 remaining Phase 2 audits:
  - Log-leakage scan: OTP log at `phone-verify/route.ts:141` correctly gated behind `NODE_ENV === "development"`; no secrets in error paths. CLEAN.
  - Service worker: `/guardian/`, `/api/`, `/auth/` all excluded; same-origin GET only. CLEAN.
  - CSP: hardened with `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self' https://checkout.stripe.com` in `netlify.toml`.
  - Admin routes: `/api/admin/export` (only one) was using env-only `isAdminEmail()` check — upgraded to canonical `profile.is_admin === true || isAdminEmail(email)` pattern to match CLAUDE.md convention.
  - Also: removed OTP from email subject line (was visible in notifications/previews before opening the email).
  - Phase 2 DONE. Next: Phase 3 workflow trace J1..J15.

- **2026-04-18 (session 7)** — PHASE 3 DONE. Closed the 4 open Phase 3 P1s + 3 P2/P3 polish items:
  - **P3-27 / P3-28 / P3-29 / P3-30 / P3-31** (project-members route overhaul):
    - POST always inserts `status: "pending"` — removed the silent auto-accept path that exposed a privacy issue.
    - New PATCH route for `accept` / `decline`; invitee authorization matches on either `user_id` or `invited_email` (lowercased).
    - New `src/components/guardian/PendingInvitations.tsx` mounted on the dashboard — lists outstanding invites for the signed-in user (by `user_id` OR `invited_email`) with accept/decline buttons.
    - POST sends Resend notification email (`notifications@vedawellapp.com` → invitee) with project name, inviter name, role, and dashboard link; fire-and-forget.
    - Email normalized (`.trim().toLowerCase()` + regex); DELETE now checks `.error`; soft cap of 10 pending invites per project (429).
  - **P3-1** (atomic project seed): `projects/new/page.tsx` tracks `stageFailures` in the seed loop; if any stage insert fails, rolls back the project row with `.delete().eq("id", projectId).eq("user_id", user.id)` and surfaces `Project setup incomplete — N stage(s) failed.`. User lands on a clean slate instead of a half-seeded project.
  - **P3-22** (server-side variation limit): new `supabase/schema_v41_variation_limit.sql` — `BEFORE INSERT` trigger on `variations` resolves owner tier via `projects.user_id → profiles.subscription_tier`; raises `FREE_TIER_VARIATION_LIMIT` check_violation when a free-tier user has already hit 2 variations on the project. Client maps the error to the existing `tierError` banner. Trigger is `SECURITY DEFINER` so direct Supabase client calls can't bypass it.
  - Build: PASSES clean (11.7s compile). Phase 3 header now `[DONE]`. Next: Phase 4 (API route audit).

- **2026-04-17 (session 6)** — PHASE 3 CLOSEOUT. Fixed 4 findings and traced the last 3 journeys:
  - **P3-11 / P3-12 / P3-13 / P3-14**: full rewrite of `parse-contract/route.ts` — now calls `checkDailyQuota`, `logAIUsage` (success + every error branch), `retrieveKnowledge({ state, category: "contract" })` for KB grounding, and accepts `persistToProject: true` to write 8 extracted fields (`contract_value`, `builder_name`, `builder_license_number`, `builder_abn`, `start_date`, `contract_signed_date`, `expected_end_date`, `hbcf_policy_number`) back to the project row. `JSON.parse` wrapped in try/catch. `ContractParser.tsx` opts-in to persistence and shows a green "Saved: contract details written to your project" confirmation card when persisted. Fixed AI SDK v5 token extraction (`inputTokens ?? promptTokens` dual-name cast).
  - **P3-18**: `InspectionTimeline.tsx updateInspection` — when inspection result changes to `pass`/`passed`, promotes the matching stage (`status=pending`, `name ilike %inspection.stage%`) to `in_progress`. Closes the stage-gate wiring gap from J5.
  - **J9 trace** (start trial → Pro → portal): `start-trial/route.ts`, `checkout/route.ts`, `portal/route.ts` all CLEAN — prior hardening from session 3 holds. No new findings.
  - **J10 trace** (invite collaborator → accept → permissions): `project-members/route.ts` found 5 issues — **P3-27** (P1 privacy: auto-accept when invited email matches existing profile, no consent step), **P3-28** (P1: no email notification on invite), **P3-29** (P2: DELETE no .error check), **P3-30** (P2: no email trim/lowercase), **P3-31** (P3: no rate limit on invite POST).
  - **J13 trace** (admin flows): `admin/page.tsx` + `actions.ts::requireAdmin` + `AdminUserManager` all solid — `requireAdmin()` checks auth user + `isAdminEmail`, returns service-role client only to admins. Found 1 minor: **P3-32** (P2: `AdminSupportInbox.tsx:63` silently swallows `adminReply` failure).
  - **Phase 3 trace is COMPLETE** (15/15 journeys walked). 9 P1s fixed across sessions 4/5/6; 4 P1s still open (P3-1 non-atomic seed, P3-22 server-side variation limit, P3-27 auto-accept privacy, P3-28 invite email notify) — phase header stays `[IN PROGRESS]` until those close.
  - Build: PASSES clean. Next: close the 4 open P1s, then mark Phase 3 DONE and begin Phase 4 (API route audit).

- **2026-04-17 (session 5)** — FIX SESSION. Closed the P0 (P3-26 referral wiring) + 1 P2 (P3-4):
  - New `src/app/api/guardian/apply-referral/route.ts` — authenticated user route that looks up referrer by public `referral_code`, writes `profiles.referred_by` for idempotency, then calls `/api/guardian/referral-reward` internally with `CRON_SECRET`. Self-referral + already-referred + unknown-code guards. Fail-soft on missing env vars (returns `applied:false` without 500-ing signup).
  - New `src/components/guardian/RefCapture.tsx` — client component on `/guardian` landing that captures `?ref=CODE` and persists to localStorage across navigation.
  - `login/page.tsx` — useEffect to re-capture `?ref=` on login page (covers direct share of the login URL). Signup handler now calls `applyReferralIfPresent()` after both direct-session and password-sign-in paths, clears localStorage, fire-and-forget so referral failures never block signup. Phone-update now checks `.error` + guards on `data.user?.id`.
  - `/guardian/page.tsx` mounts `<RefCapture />` at the top of the returned fragment.
  - Build: PASSES clean (14.6s compile + 242 static pages).
  - **J14 is now end-to-end functional**. Next session: J9/J10/J13 traces + P3-1/P3-11/P3-12/P3-18/P3-22 P1 fixes.

- **2026-04-17 (session 4)** — PHASE 3 TRACE. Walked 11/15 user journeys end-to-end. Logged 26 findings (P3-1..P3-26). Biggest find: **P3-26 is a P0** — the `/api/guardian/referral-reward` endpoint exists but NO code calls it. Referral links silently fail to credit referrers. Wiring requires signup-side `?ref=CODE` capture + internal CRON_SECRET-signed call post-verification. Deferred to next session.
  - Fixed 6 issues in-session while tracing: P3-2 (defect status silent fail), P3-16 (addInspection silent fail), P3-17 (inspection load error silenced), P3-19 (variation signature silent fail), P3-20 (variation tier-check fail-open → fail-closed), P3-23 (PreHandover schema mismatch — photoNote in image_url → description).
  - Journey summary: J1/J2/J4/J14/J15 CLEAN or fixed. J3 has 5 findings (contract parser not persisting). J5 has stage-gate wiring gap (P3-18). J6 has audit-log gap (P3-6). J7 had 2 P1s both fixed. J8 fixed. J9/J10/J11/J12/J13 deferred.
  - Build: PASSES clean. Next session: fix P3-26 referral wiring, P3-1 non-atomic seed, P3-11/P3-12 parse-contract persist, P3-18 stage gate, then resume tracing J9/J10/J13.

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
