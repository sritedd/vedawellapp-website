---
name: e2e-browser
description: Drive a real browser via Playwright MCP to log in and test VedaWell Guardian end to end — create a project, exercise every feature, verify persistence. Use when asked to actually test the app in a browser, verify a journey works for real, or run the live E2E plan for a state (NSW first).
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, TodoWrite
---

# Live Browser E2E — Guardian

Drives the **real UI in a real browser**. This is not the `e2e/*.spec.ts` Playwright runner
(which seeds via service role and asserts) — here you click what a user clicks.

**The plan lives in `guide/16-E2E-BROWSER-TEST-PLAN.md`. Read it first and record results there.**

## Non-negotiables

1. **Target = LIVE PROD** (`https://vedawellapp.com`) per user decision 2026-07-25 — but under
   the safety rails in `guide/17-E2E-PROD-RUN-PLAYBOOK.md` §1: all test projects named `E2E …`
   and cleaned up, never complete a Stripe payment (live mode!), touch only `e2e-*@` test
   accounts, never trigger `/api/cron/*`. Read the playbook before the browser.
2. **NSW first, completely.** Don't start VIC until every NSW box is ✅ or has a logged finding.
3. **Snapshot before clicking.** Take an accessibility snapshot and use the real ref. Never
   guess a CSS selector.
4. **Verify persistence, not the toast.** After every write, reload (or query via the Supabase
   MCP) and confirm the row survived. Optimistic UI has lied here before.
5. **Read the console on every page.** Errors/unhandled rejections/failed requests are findings.
6. **Don't fix mid-run** unless it blocks the journey. Log it, finish the journey, fix in a pass.

## MCP servers

All are already in `vedawell-next/.mcp.json` — nothing to install.

| Server | Role |
|--------|------|
| `playwright` | Primary driver: navigate, snapshot, click, type, screenshot, console |
| `supabase` | Confirm rows persisted; flip `is_admin`; clean up |
| `sentry` | Confirm the run produced no new captured errors |
| `netlify` | Only for deploy-state checks |

If browser tools appear under another prefix in the session (e.g. `browser-forms`), use whichever
browser toolset is present — the workflow is identical.

## Preflight (blockers — check before opening a browser)

```bash
cd vedawell-next
# P1: admin access is impossible without this (isAdminEmail returns [])
grep -q '^ADMIN_EMAILS=' .env.local && echo "ADMIN_EMAILS=SET" || echo "ADMIN_EMAILS=MISSING — admin surfaces unreachable"
# P2: app reads SERVICE_ROLE; e2e seed reads SECRET_KEY. Both should exist.
grep -q '^SUPABASE_SERVICE_ROLE_KEY=' .env.local && echo "SERVICE_ROLE=SET" || echo "SERVICE_ROLE=MISSING"
```

If `ADMIN_EMAILS` is missing, stop and tell the user — admin steps (4A4, admin AI quota) cannot
pass. Non-admin steps can still run against a Pro account.

Start the dev server on a fixed port and confirm it answers before driving the browser.

## Test account

Reuse the existing helper rather than inventing one — `e2e/setup/supabase-seed.ts` exports
`ensureTestUser()` (`e2e-test@vedawellapp.com`, auto-set to `guardian_pro`). Password comes from `E2E_PRO_PASSWORD` in `.env.local` — never committed.
For admin runs, flip `is_admin=true` on that profile via the Supabase MCP, and flip it back after.

## Run order

1. Read `guide/16-E2E-BROWSER-TEST-PLAN.md`.
2. `TodoWrite` a list mirroring the plan's sections (4A…4I), so progress is visible.
3. Work the NSW sections in order. Update the plan's result columns as you go —
   ✅ / ❌ / ⚠️ plus a one-line note.
4. Append every finding to the plan's §6 findings log with severity and file:line.
5. Only then run the §5 short circuit for the other 7 states.
6. Finish: update §7, fix P0/P1, correct any stale docs you disproved.

## App facts you'll need

- **Create flow**: `/guardian/projects/new` — 2 steps. Step 1 `BuildTypeSelector` (category +
  state; "Next" disabled until a category is picked). Step 2 details form.
- **Email gate**: creation is blocked unless verified / `guardian_pro` / admin /
  `email_verified_override`. Admin and Pro bypass it.
- **Nav**: 5 sections — Home, Build, Issues, Evidence, More (More is a card grid).
- **Stage counts (`new_build`)**: NSW 8, VIC 10, QLD 7, WA 8, SA 7, TAS 7, ACT 7, NT 7.
  `guide/07-TESTING-SETUP.md` still claims QLD/WA have none — that doc is **stale**.
- **Other categories**: `granny_flat` only NSW (7) and VIC (**0 — empty**); `extension` only NSW (8).
- **Tier limits are DB-enforced**: 1 project, 3 defects (v42 trigger), 2 variations (v41 trigger).
- **Builder Check returns 503 by design** — that's a pass, not a bug.
- **Admin AI quota**: `checkProAccess()` returns `tier:"admin"` → unlimited. Repeat AI calls
  must not 429; a 429 means that fix regressed.

## Cleanup

Always delete the test project at the end and confirm the cascade left no orphans
(`defects`, `variations`, `payments`, `certifications`, `stages`, `communication_log`,
`materials`, `site_visits`, `activity_log`, `project_members`, `pre_handover_items`).
Revert `is_admin` if you set it.
