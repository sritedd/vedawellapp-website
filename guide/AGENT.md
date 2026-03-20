# HomeOwner Guardian by VedaWell — Agent Context

> This file provides context for AI coding assistants (Amp, Cody/Sourcegraph, Cursor, Claude Code, Copilot, etc.)

---

## Project Overview

**HomeOwner Guardian** is an Australian residential construction management app that helps homeowners protect themselves during the building process. It tracks defects, variations, inspections, certifications, payments, and builder accountability — with AI-powered assistance and state-specific regulatory knowledge.

- **Product**: HomeGuardian by VedaWell
- **URL**: https://vedawellapp.com/guardian
- **Support**: support@vedawellapp.com

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS + pgvector) |
| AI | Vercel AI SDK v6, Google Gemini 2.5 Flash-Lite (free tier), Claude Sonnet (optional) |
| Payments | Stripe Checkout + Webhooks (live mode) |
| PDF | pdf-lib (server-side branded reports) |
| Email | Resend (transactional + weekly digest) |
| Hosting | Netlify (SSR via @netlify/plugin-nextjs) |
| Testing | Playwright (E2E), Jest (unit) |
| Analytics | GA4 + Google AdSense |

---

## Directory Structure

```
vedawell-next/                    # Git root (NOT parent Ayurveda/)
├── src/
│   ├── app/
│   │   ├── guardian/             # Main app routes
│   │   │   ├── page.tsx          # Landing page (public)
│   │   │   ├── layout.tsx        # Error boundary + ThemeProvider
│   │   │   ├── actions.ts        # Server actions (deleteProject, logout, cleanupTrials)
│   │   │   ├── login/            # Auth (email/password, Google OAuth)
│   │   │   ├── dashboard/        # Main dashboard (auth required)
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx      # Projects list
│   │   │   │   ├── new/page.tsx  # Multi-step project creation
│   │   │   │   └── [id]/page.tsx # Project hub (5-section nav, 40+ sub-tabs)
│   │   │   ├── pricing/          # Stripe checkout (Free vs Pro)
│   │   │   ├── admin/            # Admin dashboard
│   │   │   ├── profile/          # User profile
│   │   │   ├── refer/            # Referral system
│   │   │   └── faq/              # FAQ
│   │   │
│   │   └── api/
│   │       ├── guardian/
│   │       │   ├── ai/           # 4 AI routes (describe-defect, stage-advice, chat, builder-check)
│   │       │   ├── export-pdf/   # 6 PDF report types
│   │       │   ├── start-trial/  # Self-service 7-day trial
│   │       │   ├── referral-reward/ # +7 days per referral
│   │       │   └── phone-verify/ # Phone OTP verification
│   │       ├── stripe/
│   │       │   ├── checkout/     # Stripe Checkout session
│   │       │   ├── webhook/      # Subscription lifecycle
│   │       │   └── portal/       # Customer billing portal
│   │       ├── cron/
│   │       │   ├── cleanup-trials/ # Expire stale trials
│   │       │   └── weekly-digest/  # Branded email summaries
│   │       └── notifications/    # Stale defect reminders
│   │
│   ├── components/guardian/      # 50+ domain components
│   ├── components/               # Shared (Navbar, Toast, ThemeProvider, ScrollReveal)
│   ├── components/seo/           # BreadcrumbJsonLd, structured data
│   ├── lib/
│   │   ├── ai/                   # provider.ts, prompts.ts, cache.ts, rate-limit.ts
│   │   ├── guardian/             # calculations.ts (insurance, warranty, cooling-off logic)
│   │   ├── supabase/             # Client/server Supabase helpers
│   │   └── offline/              # offlineQueue.ts, useOfflineSync.ts (IndexedDB)
│   ├── types/guardian.ts         # All TypeScript interfaces
│   └── data/
│       ├── australian-build-workflows.json  # State workflows, stages, inspections
│       └── blog/posts.ts         # Blog content
│
├── supabase/                     # Schema migrations (v1-v26)
├── e2e/                          # Playwright E2E tests
├── guide/                        # Architecture docs & this file
├── public/sw.js                  # Service worker (offline + caching)
└── scripts/                      # SEO submission, Bing indexing
```

---

## Key Concepts

### Subscription Tiers
| Tier | Value in DB | Price | Limits |
|------|-------------|-------|--------|
| Free | `"free"` | $0 | 1 project, 3 defects, 2 variations |
| Trial | `"trial"` | $0 (7-day, one-time) | Unlimited |
| Pro | `"guardian_pro"` | $14.99/mo | Unlimited |

**Important**: The tier value `"trial"` (NOT `"guardian_trial"`) is used in the database. `trial_ends_at` controls expiry. `checkProAccess()` in `src/lib/ai/rate-limit.ts` is the server-side gate for Pro features.

### AI Tier Gating
- `describe-defect` — FREE for all users
- `stage-advice`, `chat`, `builder-check` — Pro/Trial/Admin only (via `checkProAccess()`)

### Australian States
All 8 states/territories supported: NSW, VIC, QLD, WA, SA, TAS, ACT, NT. State-specific data includes:
- Build stage workflows and inspections
- Insurance thresholds and scheme names
- Cooling-off periods (business days)
- Warranty periods (structural, non-structural, DLP)
- Dispute resolution pathways (NCAT, DBDRV, QBCC, SAT, SACAT)
- License verification URLs

### Navigation Architecture (Project Hub)
```
5 Main Sections (desktop: top bar, mobile: bottom nav)
├── Home → SmartDashboard, Pending Actions
├── Build → Stage Gate, Stages, Inspections, Certificates, NCC 2025, Timeline
├── Issues → Defects, Variations, Red Flags, Disputes, Pre-Handover
├── Evidence → Photos, Documents, Comms, Check-ins, Site Visits
└── More → Card grid: Payments, Budget, Cost Check, Builder Score, Rate Builder,
           Materials, Checklists, Export, Reports, Notifications, Alerts, Settings, Share
```

---

## Database Schema

20+ tables with RLS. Key tables:
```
profiles          — User data, subscription_tier, trial_ends_at, referral_code
projects          — User projects (state, build_category, contract_value)
stages            — Build stages per project (seeded from workflow JSON)
checklist_items   — Per-stage checklists
defects           — Defect tracking with status workflow
variations        — Contract variations with signatures
inspections       — Inspection records
certifications    — Certificate uploads
payments          — Payment milestones with cert cross-ref
documents         — DocumentVault uploads
communication_log — Builder communication records
weekly_checkins   — Builder accountability check-ins
progress_photos   — Timestamped photo evidence
materials         — Material registry
site_visits       — Site visit log (offline-capable)
pre_handover_items — 65-item pre-handover checklist
contract_review_items — Contract review checklist
builder_reviews   — Builder ratings (5-star + categories)
ai_cache          — AI response cache with TTL
knowledge_base    — pgvector embeddings for RAG
```

### Pending Migrations (run on Supabase SQL Editor)
- `schema_v21_phone_verification.sql`
- `schema_v22_prehandover.sql`
- `schema_v23_realtime.sql`
- `schema_v24_contract_builder_reviews.sql`
- `schema_v25_email_verification.sql`
- `schema_v26_security_hardening.sql` (RLS restricting sensitive columns)

---

## Security Model

### RLS (Row Level Security)
- All tables have RLS enabled
- Users can only read/write their own data (via `auth.uid() = user_id` or project ownership)
- `schema_v26` prevents users from modifying `subscription_tier`, `is_admin`, `trial_ends_at`, `referral_count` via client-side calls
- Only server-side service role can modify sensitive profile columns

### Trial System
- One-time 7-day trial (no credit card)
- `trial_ends_at` is preserved after expiry to prevent re-claims
- Cron job (`/api/cron/cleanup-trials`) downgrades expired trials to `"free"`

### Referral System
Guards against abuse:
- Self-referral blocked
- Max 10 referral rewards per user
- Same email domain blocked (custom domains only)
- Referred user must be < 7 days old

### Auth Flow
1. Email/password or Google OAuth via Supabase Auth
2. Phone OTP verification gate (required before project creation)
3. Email verification gate (required before project creation, admins/Pro exempt)

---

## Common Tasks

### Running the app
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Jest unit tests
npm run test:e2e     # Playwright E2E tests
```

### Adding a new component
1. Create in `src/components/guardian/YourComponent.tsx`
2. Import in `src/app/guardian/projects/[id]/page.tsx`
3. Add to appropriate section/tab in the navigation
4. If Pro-only, gate with tier check

### Adding an API route
1. Create in `src/app/api/guardian/your-route/route.ts`
2. Use `createRouteHandlerClient` for Supabase access
3. For Pro-only: use `checkProAccess()` from `src/lib/ai/rate-limit.ts`
4. For cron: protect with `CRON_SECRET` header check

### Adding a database table
1. Create migration: `supabase/schema_vNN_name.sql`
2. Include: CREATE TABLE, RLS enable, RLS policies, indexes, triggers
3. Add cleanup to `deleteProject()` in `src/app/guardian/actions.ts`
4. Add to Realtime if needed (schema_v23 pattern)
5. Update `guide/00-APP-MEMORY.md` with migration status

---

## Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase publishable key
SUPABASE_SERVICE_ROLE_KEY         # Server-side Supabase access
STRIPE_SECRET_KEY                 # Stripe API key
STRIPE_WEBHOOK_SECRET             # Stripe webhook verification
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
GOOGLE_GENERATIVE_AI_API_KEY      # Gemini AI
RESEND_API_KEY                    # Email sending
CRON_SECRET                       # Cron endpoint auth
```

### Optional
```
ANTHROPIC_API_KEY                 # Claude AI (optional provider)
GA_MEASUREMENT_ID                 # GA4 tracking
GA_API_SECRET                     # GA4 Measurement Protocol (server-side)
NEXT_PUBLIC_ADSENSE_CLIENT_ID     # AdSense
```

---

## Code Conventions

- **TypeScript strict mode** — no implicit `any`, explicit types on callbacks
- **Server Components by default** — `"use client"` only when needed
- **Supabase RLS** — never trust client-side tier checks alone; always verify server-side
- **Error handling** — show user-friendly messages, log errors, don't expose internals
- **Tier values** — `"free"`, `"trial"`, `"guardian_pro"` (NOT `"pro"` or `"guardian_trial"`)
- **State data** — always from `australian-build-workflows.json`, never hardcode
- **Dark mode** — all components must support light/dark via Tailwind `dark:` classes
- **Accessibility** — ARIA labels, keyboard navigation, 44px touch targets, focus-visible rings
- **Mobile-first** — bottom nav on mobile, responsive layouts throughout

---

## Known Limitations & Deferred Work

- **Builder Portal** — deferred until after June 2026
- **Certifier Integration** — deferred until after June 2026
- **Panchang** — hidden from site (calculations were inaccurate), shows "Coming Soon"
- **Yearly Stripe price** — on hold per user request
- **Push notifications** — UI exists but server-side web push not implemented (MVP placeholder)
- **Builder license auto-verification** — text field + link only, no API integration

---

## Guide Files Reference

| File | Purpose |
|------|---------|
| `guide/00-APP-MEMORY.md` | Master memory — read FIRST every session |
| `guide/01-GUARDIAN-ARCHITECTURE.md` | Tech stack, directory structure, DB schema |
| `guide/05-COMPONENT-STATUS.md` | Component status matrix (50+ components) |
| `guide/06-USER-WORKFLOW.md` | User journey map + AI workflows |
| `guide/07-TESTING-SETUP.md` | E2E test setup and known limitations |
| `guide/08-BRAND-DIFFERENTIATION.md` | Brand rename analysis |
| `guide/AGENT.md` | **THIS FILE** — AI agent context |
