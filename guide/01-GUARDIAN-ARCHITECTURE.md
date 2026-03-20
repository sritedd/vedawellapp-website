# HomeOwner Guardian — Architecture Overview

> **Last Updated**: 2026-03-20

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS + pgvector)
- **AI**: Vercel AI SDK v6, Google Gemini 2.5 Flash-Lite (free), Claude Sonnet (optional)
- **Payments**: Stripe Checkout + Webhooks (live mode)
- **Hosting**: Netlify (SSR via `@netlify/plugin-nextjs`)
- **PDF**: pdf-lib for report generation
- **Email**: Resend integration for notifications
- **Testing**: Playwright (E2E), Jest (unit)
- **Ads**: Google AdSense

---

## Directory Structure

```
src/
├── app/guardian/
│   ├── page.tsx                 # Landing page (public, ScrollReveal, AI features)
│   ├── layout.tsx               # Error boundary + ThemeProvider wrapper
│   ├── actions.ts               # Server actions (deleteProject, logout, touchLastSeen, cleanupExpiredTrials)
│   ├── login/                   # Auth (sign-in, sign-up, Google OAuth, phone mandatory)
│   ├── dashboard/               # Main dashboard (auth required, clickable stats)
│   ├── projects/
│   │   ├── page.tsx             # Projects list (limit 50)
│   │   ├── new/page.tsx         # Multi-step creation (email + phone verification gates)
│   │   └── [id]/page.tsx        # Project detail hub (5-section nav, 40+ sub-tabs)
│   ├── profile/                 # User profile management
│   ├── pricing/                 # Stripe checkout + self-service trial CTA
│   ├── admin/                   # Admin dashboard (user management, phone/email bypass)
│   ├── support/                 # Pro-only support chat
│   ├── refer/                   # Referral system (unique codes, share)
│   ├── journey/                 # Learning center
│   ├── faq/                     # FAQ page
│   ├── learn/[slug]/            # SEO landing pages (6 articles)
│   ├── resources/               # Resources hub
│   └── reset-password/          # Password reset flow
│
├── app/api/guardian/             # Guardian API routes
│   ├── ai/
│   │   ├── describe-defect/route.ts # Defect description (Gemini Flash-Lite, FREE)
│   │   ├── stage-advice/route.ts    # Stage advice (Gemini Flash-Lite, PRO)
│   │   ├── chat/route.ts            # Streaming chat (Gemini Flash / Claude, PRO)
│   │   └── builder-check/route.ts   # Builder risk assessment (Gemini Flash-Lite, PRO)
│   ├── export-pdf/route.ts      # Branded PDF export (6 report types via pdf-lib)
│   ├── start-trial/route.ts     # Self-service 7-day trial (one-time, no CC)
│   ├── referral-reward/route.ts  # +7 days trial per referral (anti-abuse guards)
│   └── phone-verify/route.ts    # Phone OTP verification (send/verify)
│
├── app/api/stripe/              # Stripe payment routes
│   ├── checkout/route.ts        # Checkout session creation
│   ├── webhook/route.ts         # Subscription lifecycle + GA4 tracking
│   └── portal/route.ts          # Customer billing portal
│
├── app/api/cron/                # Cron endpoints (CRON_SECRET protected)
│   ├── cleanup-trials/route.ts  # Expire stale trials → "free"
│   └── weekly-digest/route.ts   # Branded email summaries via Resend
│
├── components/guardian/         # 61 components
│   ├── AIDefectAssist.tsx       # AI defect description assistant (Free tier)
│   ├── AIStageAdvice.tsx        # AI stage-specific advice panel (Pro tier)
│   ├── GuardianChat.tsx         # AI streaming chat UI (Pro tier)
│   ├── SmartDashboard.tsx       # Stage-aware contextual dashboard
│   ├── ProjectDefects.tsx       # Defect CRUD + AI assist + free tier limits
│   ├── ProjectVariations.tsx    # Variation CRUD + signatures + free tier limits
│   ├── ProgressPhotos.tsx       # Photo upload + timeline/grid view
│   ├── NotificationCenter.tsx   # Computed alerts from real data
│   ├── DocumentVault.tsx        # File upload + management
│   ├── CertificationGate.tsx    # Certificate upload + stage blocking
│   ├── StageGate.tsx            # Stage completion gates (dynamic from DB)
│   ├── PaymentSchedule.tsx      # DB-backed, "Should I Pay?", cert cross-ref
│   ├── DisputeResolution.tsx    # State-specific dispute pathways + 3 templates
│   ├── DodgyBuilderAlerts.tsx   # Contextual warnings + binary actions
│   ├── NCC2025Compliance.tsx    # 25-item NCC 2025 checklist
│   ├── MobilePhotoCapture.tsx   # Camera capture + annotation + FAB + speed-dial
│   ├── OnboardingWizard.tsx     # 3-step onboarding modal
│   ├── ShouldIPay.tsx           # Green/red payment verdict on dashboard
│   ├── TimelineBenchmark.tsx    # Builder speed vs industry averages
│   ├── TribunalExport.tsx       # 10-section tribunal evidence package
│   ├── ProgressTimeline.tsx     # Gantt-style SVG timeline with stage bars
│   ├── ProjectHealthScore.tsx   # Circular gauge, 4 sub-scores
│   ├── MilestoneCelebrations.tsx # 8 achievements with animated toasts
│   ├── ShareProgressCard.tsx    # Branded share card (WhatsApp/X/native)
│   ├── PhoneVerificationGate.tsx # Phone OTP gate on project creation
│   └── ... (35+ more: admin, export, settings, checklists, ratings)
│
├── components/
│   ├── ScrollReveal.tsx         # IntersectionObserver fade-in animations
│   ├── ThemeProvider.tsx        # Dark/light/system theme
│   ├── Toast.tsx                # Global toast notification system
│   ├── Navbar.tsx               # HomeGuardian by VedaWell branding
│   └── AILaunchBanner.tsx       # AI launch announcement banner
│
├── lib/ai/                      # AI infrastructure
│   ├── provider.ts              # Model selection (Gemini free / Claude optional)
│   ├── prompts.ts               # System prompts + Zod schemas + injection defense
│   ├── cache.ts                 # Supabase ai_cache with TTL + user-scoping
│   └── rate-limit.ts            # In-memory rate limiter + checkProAccess() tier gate
│
├── lib/guardian/
│   ├── calculations.ts          # Business logic (insurance, warranty, cooling-off, etc.)
│   └── upload-validation.ts     # File upload validation (10MB, PDF/JPG/PNG/DOC)
│
├── lib/supabase/
│   ├── server.ts                # SSR Supabase client
│   ├── client.ts                # Browser Supabase client
│   ├── mock.ts                  # Dev mode mock client (localhost only)
│   └── useRealtimeProject.ts    # Supabase Realtime hook (12 tables)
│
├── lib/security/
│   └── rate-limit.ts            # Auth rate limiter (login attempts)
│
├── lib/notifications/
│   └── email-service.ts         # Resend email integration
│
├── lib/export/
│   └── pdf-export.ts            # PDF generation helpers
│
├── lib/offline/
│   ├── offlineQueue.ts          # IndexedDB mutation queue
│   └── useOfflineSync.ts        # Offline-aware write hook with auto-replay
│
├── data/
│   ├── australian-build-workflows.json  # State workflows, stages, checklists, certs, warnings
│   ├── blog/posts.ts                    # Blog posts (11+ articles)
│   ├── guardian-competitors.ts          # 5 competitor comparison data
│   └── guardian-landing-pages.ts        # 6 SEO article definitions
│
└── types/
    └── guardian.ts               # TypeScript interfaces (Project, Stage, Defect, Profile, etc.)
```

---

## Database Schema (20+ tables, migrations v1–v26)

### Core Tables
```
profiles          — User profile, subscription_tier, trial_ends_at, is_admin, referral_code, phone fields
projects          — Build projects with builder info, contract value, dates, state, build_category
stages            — Construction stages per project (seeded from workflows)
checklist_items   — Checklist items per stage (seeded from workflows)
variations        — Cost variations with signatures and approval status
defects           — Building defects with severity, status, location, override_reason
certifications    — Required certificates per stage
inspections       — Inspection bookings and results
documents         — Uploaded document metadata
weekly_checkins   — Builder accountability check-ins (status, weather, issues)
communication_log — Builder comms (call/email/sms/visit/meeting)
payments          — Payment milestones per stage (amount, status, cert cross-ref)
progress_photos   — Progress photo metadata + Supabase Storage references
materials         — Material tracking per project
site_visits       — Site visit logging per project (offline-capable)
pre_handover_items — 65-item pre-handover checklist per project
contract_review_items — Contract review checklist (optional projectId)
builder_reviews   — 5-star builder ratings + 5 categories
```

### System Tables
```
announcements     — Admin banners
support_messages  — Pro user support chat
email_subscribers — Newsletter signups
```

### AI Tables (schema v20, pgvector)
```
ai_cache          — Cached AI responses with TTL, model metadata, user-scoped keys
knowledge_base    — pgvector embeddings for RAG (NCC references, AS standards)
```

**Schema migrations**: `supabase/schema.sql` through `schema_v26_security_hardening.sql`
- v1–v20: Applied on Supabase
- v21–v26: Pending (phone verification, pre-handover, realtime, contract/builder reviews, email verification, RLS hardening)

---

## Authentication Flow

1. Sign-up → Supabase Auth creates user → `handle_new_user()` trigger creates profile
2. Profile defaults: `subscription_tier='free'`, `is_admin=false`
3. Login: email/password or Google OAuth, rate-limited (5 attempts/60s), phone mandatory
4. Session: Supabase cookies managed by `@supabase/ssr`
5. Dev bypass: localhost only, requires `dev_mode=true` cookie
6. **Phone OTP gate**: Required before project creation (PhoneVerificationGate)
7. **Email verification gate**: Required before project creation (admins/Pro exempt)
8. **Security**: RLS prevents users from modifying `subscription_tier`, `is_admin`, `trial_ends_at`, `referral_count` (schema_v26)

---

## Subscription Tiers

| | Free | Trial | Guardian Pro |
|---|---|---|---|
| Price | $0 | $0 (self-service 7-day, one-time) | $14.99 AUD/mo |
| Projects | 1 | Unlimited | Unlimited |
| Defects | 3 | Unlimited | Unlimited |
| Variations | 2 | Unlimited | Unlimited |
| AI Defect Assist | Yes | Yes | Yes |
| AI Chat / Stage Advice | No | Yes | Yes |
| AI Builder Check | No | Yes | Yes |
| PDF Export | No | Yes | Yes |
| Support Chat | No | Yes | Yes |
| Cert Gates | No | Yes | Yes |

---

## AI Architecture

```
User → Client Component → API Route → AI Provider → Gemini/Claude
                              │
                              ├── Rate Limiter (in-memory, per-user)
                              ├── Input Sanitization (stripHtml, XML delimiters)
                              ├── Auth Check (Supabase session)
                              ├── Project Ownership Verification
                              ├── Cache Check (ai_cache table, TTL-based)
                              └── Structured Output (Zod schema validation)
```

### Models
- **Cheap (default)**: `gemini-2.5-flash-lite` — FREE (1000 req/day), used for defect assist, stage advice, builder check
- **Smart (optional)**: `gemini-2.5-flash` or `claude-sonnet-4-5` (if ANTHROPIC_API_KEY set), used for chat

### Security
- XML delimiter tags (`<user_input>`) around all user-supplied content
- System prompt extraction defense in chat
- State validation against whitelist (`NSW/VIC/QLD/SA/WA/TAS/ACT/NT`)
- User-scoped cache keys (separate per user)
- Graceful degradation with fallback responses on error

---

## Supabase Storage Buckets (3)

| Bucket | Used By | Purpose |
|--------|---------|---------|
| `evidence` | ChecklistItemCard, ProgressPhotos, ProjectDefects | Photos + evidence |
| `documents` | DocumentVault, ProjectVariations | Documents, signatures |
| `certificates` | CertificationGate | Certificate uploads |

Created via `schema_v13_storage_buckets.sql` with RLS policies.

---

## Navigation Architecture (5-Section)

```
5 Main Tabs (desktop: top bar, mobile: bottom nav)
├── Home → SmartDashboard (+ ShouldIPay, MilestoneCelebrations, ProjectHealthScore),
│          Pending Actions, AI Chat (Pro), Stage Gate + AI Advice
├── Build → Stages, Checklists, Inspections, Certificates, NCC 2025, Red Flags,
│           Timeline (Gantt), Builder Speed Benchmarks
├── Issues → Defects (+ AI Assist), Variations, Disputes, Pre-Handover, Tribunal Export
├── Evidence → Photos, Documents, Comms, Check-ins, Site Visits
└── More → Card grid: Payments, Budget, Cost Check, Builder Score, Rate Builder,
           Materials, Checklists, Export, Reports, Notifications, Alerts, Settings,
           Share Progress
```

---

## Data Flow

```
User → Dashboard → Projects List → Project Detail Hub
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              Construction          Financial          Docs & AI
              ├─ Stages             ├─ Payments        ├─ Document Vault
              ├─ Checklists         ├─ Budget          ├─ Comms Log
              ├─ Defects + AI      ├─ Certificates    ├─ AI Chat
              ├─ Inspections        └─ Cost Check      └─ Notifications
              ├─ Variations
              └─ Photos
```
