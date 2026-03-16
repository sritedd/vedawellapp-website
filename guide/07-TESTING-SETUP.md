# HomeOwner Guardian — E2E Testing Setup

## Overview

End-to-end tests using **Playwright** that test the full homeowner workflow against the real Supabase backend. No mock data in application code — all test fixtures are seeded via dedicated setup scripts.

## Test Architecture

```
e2e/
├── guardian-full-workflow.spec.ts  — 34 tests (4 states × ~9 steps)
├── guardian-smoke.spec.ts          — 19 smoke tests
└── setup/
    ├── supabase-seed.ts            — Supabase Admin API (cloud)
    ├── db.ts                       — Local Postgres helpers
    ├── local-schema.sql            — 15 tables (standalone)
    ├── global-setup.ts             — Playwright global setup
    ├── global-teardown.ts          — Playwright global teardown
    └── init-test-db.mjs            — One-time DB init script
```

## Full Workflow Tests (per state)

| Step | Test | NSW | VIC | QLD | WA |
|------|------|-----|-----|-----|-----|
| 1 | Login | ✓ | ✓ | ✓ | ✓ |
| 2 | Project visible | ✓ | ✓ | ✓ | ✓ |
| 3 | Stages seeded (8/2/0/0) | ✓ | ✓ | ✓ | ✓ |
| 4 | Stage transitions | ✓ | ✓ | skip | skip |
| 5 | Defect/variation/comms | ✓ | ✓ | ✓ | ✓ |
| 6 | Stage Gate renders | ✓ | ✓ | ✓ | ✓ |
| 7 | Materials/visits/checkins | ✓ | ✓ | ✓ | ✓ |
| 8 | Complete & close project | ✓ | ✓ | ✓ | ✓ |
| 9 | No console errors | ✓ | ✓ | ✓ | ✓ |

## Prerequisites

1. **PostgreSQL 16** installed locally (for smoke tests)
   - Database: `guardian_test` on localhost:5432
   - User/pass: postgres/postgres
2. **Supabase** `.env.local` must have `SUPABASE_SECRET_KEY` (service role)
3. **Dev server** running on localhost:3000 (playwright auto-starts via config)

## Quick Start

```bash
# One-time setup
node e2e/setup/init-test-db.mjs

# Run all tests
npx @playwright/test test

# Run single state
npx @playwright/test test guardian-full-workflow -g "NSW"

# Headed mode (see browser)
npx @playwright/test test --headed
```

## Test User

| Field | Value |
|-------|-------|
| Email | `e2e-test@vedawellapp.com` |
| Password | `E2eTestPass!2026` |
| Tier | `guardian_pro` (auto-set) |
| Created by | `ensureTestUser()` via Supabase Admin API |

## Data Flow

```
Test setup                          App (browser)
──────────                          ─────────────
supabase-seed.ts                    Supabase client
     │                                   │
     │ createTestProject()               │
     │   → projects (service role)       │
     │   → stages                        │
     │   → checklist_items               │
     │   → certifications                │
     │                                   │
     │ seedProjectData()                 │
     │   → defects, variations           │
     │   → communication_log             │
     │   → materials, site_visits        │
     │   → weekly_checkins               │
     │                                   │
     ├──────── Supabase Cloud ──────────┤
     │                                   │
     │                              RLS policies
     │                              filter by user_id
     │                                   │
     │                              UI renders
     │                              seeded data
```

## Cleanup

- `beforeAll`: Creates test user + project for the state
- `afterAll`: Deletes the project and all related data
- `cleanupE2EProjects()`: Finds all projects with name `E2E %` and deletes them
- Global teardown cleans the local `guardian_test` database

## Known Limitations

1. **Schema v13-v16 not yet run on Supabase** — some tables (materials, site_visits, progress_photos) may return 403. Tests filter these from console error checks.
2. **QLD/WA have no workflow stages** — `australian-build-workflows.json` doesn't define stages for these states. Tests verify graceful empty state.
3. **No storage tests** — photo upload, document upload not tested (requires Supabase Storage buckets from schema v13).
4. **Sequential only** — tests share DB state per state, must run single worker.
