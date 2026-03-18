# HomeOwner Guardian — E2E Testing Setup

> **Last Updated**: 2026-03-19

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
| 1 | Login | Y | Y | Y | Y |
| 2 | Project visible | Y | Y | Y | Y |
| 3 | Stages seeded (8/2/0/0) | Y | Y | Y | Y |
| 4 | Stage transitions | Y | Y | skip | skip |
| 5 | Defect/variation/comms | Y | Y | Y | Y |
| 6 | Stage Gate renders | Y | Y | Y | Y |
| 7 | Materials/visits/checkins | Y | Y | Y | Y |
| 8 | Complete & close project | Y | Y | Y | Y |
| 9 | No console errors | Y | Y | Y | Y |

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

1. **QLD/WA have no workflow stages** — `australian-build-workflows.json` doesn't define stages for these states. Tests verify graceful empty state.
2. **No storage tests** — photo upload, document upload not tested end-to-end (requires Supabase Storage buckets).
3. **No AI tests** — AI features (defect assist, chat, builder check, stage advice) not yet covered in E2E tests. Planned for `e2e/guardian-ai.spec.ts`.
4. **Sequential only** — tests share DB state per state, must run single worker.

## Schema Migrations Required

All migrations v1–v20 should be applied on production Supabase before running full E2E tests:

| Migration | Tables/Changes |
|-----------|---------------|
| v1–v12 | Core tables (profiles, projects, stages, defects, etc.) |
| v13 | Storage buckets (evidence, documents, certificates) + progress_photos |
| v14–v15 | Bug fixes (order_index, status constraints, override_reason) |
| v16 | materials, site_visits tables; weekly_checkins extensions |
| v17 | project state + build_category columns |
| v18 | payments table, project/stage date columns |
| v19 | Policy fixes (DROP IF EXISTS before CREATE) |
| v20 | pgvector, ai_cache, knowledge_base tables + RLS |
