# HomeOwner Guardian — Architecture Overview

> **Last Updated**: 2026-03-19

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
│   ├── actions.ts               # Server actions (deleteProject, logout, touchLastSeen)
│   ├── login/                   # Auth (sign-in, sign-up, forgot-password, Google OAuth)
│   ├── dashboard/               # Main dashboard (auth required, clickable stats)
│   ├── projects/
│   │   ├── page.tsx             # Projects list (limit 50)
│   │   ├── new/page.tsx         # Multi-step project creation (state + workflow seeding)
│   │   └── [id]/page.tsx        # Project detail hub (5-section nav, 40+ sub-tabs)
│   ├── profile/                 # User profile management
│   ├── pricing/                 # Stripe checkout (Free vs Pro, AI features listed)
│   ├── admin/                   # Admin dashboard (email allowlist)
│   ├── support/                 # Pro-only support chat
│   ├── refer/                   # Referral system
│   ├── journey/                 # Learning center
│   ├── faq/                     # FAQ page
│   ├── learn/[slug]/            # SEO landing pages (6 articles)
│   ├── resources/               # Resources hub
│   └── reset-password/          # Password reset flow
│
├── app/api/guardian/ai/         # AI API routes
│   ├── describe-defect/route.ts # Defect description assistant (Gemini Flash-Lite)
│   ├── stage-advice/route.ts    # Stage-specific advice (Gemini Flash-Lite)
│   ├── chat/route.ts            # Streaming chat (Gemini Flash / Claude)
│   └── builder-check/route.ts   # Builder risk assessment (Gemini Flash-Lite)
│
├── components/guardian/         # 50+ components
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
│   ├── MobilePhotoCapture.tsx   # Camera capture + annotation + FAB
│   ├── OnboardingWizard.tsx     # 3-step onboarding modal
│   └── ... (30+ more)
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
│   └── rate-limit.ts            # In-memory rate limiter
│
├── lib/guardian/
│   ├── calculations.ts          # Business logic (insurance, warranty, cooling-off, etc.)
│   └── upload-validation.ts     # File upload validation (10MB, PDF/JPG/PNG/DOC)
│
├── lib/supabase/
│   ├── server.ts                # SSR Supabase client
│   ├── client.ts                # Browser Supabase client
│   └── mock.ts                  # Dev mode mock client (localhost only)
│
├── data/
│   ├── australian-build-workflows.json  # State workflows, stages, checklists, certs, warnings
│   ├── blog/posts.ts                    # Blog posts (10+ articles including AI announcement)
│   ├── guardian-competitors.ts          # 5 competitor comparison data
│   └── guardian-landing-pages.ts        # 6 SEO article definitions
│
└── types/
    └── guardian.ts               # TypeScript interfaces (Project, Stage, Defect, Profile, etc.)
```

---

## Database Schema (20+ tables, migrations v1–v20)

### Core Tables
```
profiles          — User profile, subscription tier, admin flag, referral
projects          — Build projects with builder info, contract value, dates, state, build_category
stages            — Construction stages per project (seeded from workflows)
checklist_items   — Checklist items per stage (seeded from workflows)
variations        — Cost variations with signatures and approval status
defects           — Building defects with severity, status, location
certifications    — Required certificates per stage
inspections       — Inspection bookings and results
documents         — Uploaded document metadata
weekly_checkins   — Builder accountability check-ins (status, weather, issues)
communication_log — Builder comms (call/email/sms/visit/meeting)
payments          — Payment milestones per stage (amount, status, cert cross-ref)
progress_photos   — Progress photo metadata + Supabase Storage references
materials         — Material tracking per project
site_visits       — Site visit logging per project
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

**Schema migrations**: `supabase/schema.sql` through `schema_v20_ai.sql`

---

## Authentication Flow

1. Sign-up → Supabase Auth creates user → `handle_new_user()` trigger creates profile
2. Profile defaults: `subscription_tier='free'`, `is_admin=false`
3. Login: email/password or Google OAuth, rate-limited (5 attempts/60s)
4. Session: Supabase cookies managed by `@supabase/ssr`
5. Dev bypass: localhost only, requires `dev_mode=true` cookie

---

## Subscription Tiers

| | Free | Trial | Guardian Pro |
|---|---|---|---|
| Price | $0 | $0 (admin-granted) | $14.99 AUD/mo |
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
├── Home → SmartDashboard, Pending Actions, AI Chat (Pro), Stage Gate + AI Advice
├── Build → Stages, Checklists, Inspections, Certificates, NCC 2025, Red Flags
├── Issues → Defects (+ AI Assist), Variations, Disputes, Pre-Handover
├── Evidence → Photos, Documents, Comms, Check-ins, Site Visits
└── More → Card grid: Payments, Budget, Cost Check, Builder Score, Rate Builder,
           Materials, Checklists, Export, Reports, Notifications, Alerts, Settings
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
