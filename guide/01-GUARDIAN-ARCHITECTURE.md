# HomeOwner Guardian — Architecture Overview

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Payments**: Stripe Checkout + Webhooks
- **Hosting**: Netlify (SSR via `@netlify/plugin-nextjs`)
- **Ads**: Google AdSense

---

## Directory Structure

```
src/
├── app/guardian/
│   ├── page.tsx                 # Landing page (public)
│   ├── layout.tsx               # Error boundary wrapper
│   ├── actions.ts               # All server actions (14+)
│   ├── login/                   # Auth (sign-in, sign-up, forgot-password, Google OAuth)
│   ├── dashboard/               # Main dashboard (auth required)
│   ├── projects/
│   │   ├── page.tsx             # Projects list
│   │   ├── new/page.tsx         # Multi-step project creation
│   │   └── [id]/page.tsx        # Project detail hub (40+ tabs)
│   ├── profile/                 # User profile management
│   ├── pricing/                 # Stripe checkout (Free vs Pro)
│   ├── admin/                   # Admin dashboard (email allowlist)
│   ├── support/                 # Pro-only support chat
│   ├── refer/                   # Referral system
│   ├── journey/                 # Learning center
│   ├── faq/                     # FAQ page
│   ├── learn/[slug]/            # SEO landing pages (6 articles)
│   ├── resources/               # Resources hub
│   └── reset-password/          # Password reset flow
│
├── components/guardian/         # 40+ components
│   ├── ProgressPhotos.tsx       # Photo timeline (BROKEN - sample data)
│   ├── ProjectDefects.tsx       # Defect tracker (BROKEN - sample data)
│   ├── ProjectVariations.tsx    # Variation tracker (partially working)
│   ├── DocumentVault.tsx        # File uploads (WORKING)
│   ├── CertificationGate.tsx    # Certificate uploads (WORKING)
│   ├── ChecklistItemCard.tsx    # Checklist with photo evidence (WORKING)
│   ├── CommunicationLog.tsx     # Builder comms log (WORKING)
│   ├── WarrantyCalculator.tsx   # Warranty tracking (WORKING)
│   ├── PaymentSchedule.tsx      # Progress payments
│   ├── BudgetDashboard.tsx      # Budget vs actual
│   ├── InspectionTimeline.tsx   # Inspection booking
│   ├── NotificationCenter.tsx   # Alerts (BROKEN - sample data)
│   ├── SupportChat.tsx          # Pro support chat
│   ├── AdminSupportInbox.tsx    # Admin inbox
│   ├── AdminUserSearch.tsx      # User management
│   ├── AdminAnnouncementManager.tsx  # Announcements
│   └── ... (20+ more)
│
├── lib/guardian/
│   ├── calculations.ts          # Variation/defect math utilities
│   └── upload-validation.ts     # File upload validation (10MB, PDF/JPG/PNG/DOC)
│
├── lib/supabase/
│   ├── server.ts                # SSR Supabase client
│   ├── client.ts                # Browser Supabase client
│   └── mock.ts                  # Dev mode mock client
│
├── data/
│   ├── australian-build-workflows.json  # State workflows, checklists, certs
│   ├── guardian-competitors.ts          # 5 competitor comparison data
│   └── guardian-landing-pages.ts        # 6 SEO article definitions
│
└── types/
    └── guardian.ts               # TypeScript interfaces
```

---

## Database Schema (15+ tables)

```
profiles          — User profile, subscription tier, admin flag, referral
projects          — Build projects with builder info, contract value, dates
stages            — Construction stages per project (seeded from workflows)
checklist_items   — Checklist items per stage (seeded from workflows)
variations        — Cost variations with signatures and approval status
defects           — Building defects with severity, status, location
certifications    — Required certificates per stage
inspections       — Inspection bookings and results
documents         — Uploaded document metadata
weekly_checkins   — Builder accountability check-ins
communication_log — Builder comms (call/email/sms/visit/meeting)
announcements     — Admin banners
support_messages  — Pro user support chat
email_subscribers — Newsletter signups
```

**Schema migrations**: `supabase/schema.sql` through `schema_v12_comms_warranty.sql`

---

## Authentication Flow

1. Sign-up → Supabase Auth creates user → `handle_new_user()` trigger creates profile
2. Profile defaults: `subscription_tier='free'`, `is_admin=false`
3. Login: email/password or Google OAuth, rate-limited (5 attempts/60s)
4. Session: Supabase cookies managed by `@supabase/ssr`

---

## Subscription Tiers

| | Free | Trial | Guardian Pro |
|---|---|---|---|
| Price | $0 | $0 (admin-granted) | $14.99 AUD/mo |
| Projects | 1 | Unlimited | Unlimited |
| Defects | 3 | Unlimited | Unlimited |
| Variations | 2 | Unlimited | Unlimited |
| PDF Export | No | Yes | Yes |
| Support Chat | No | Yes | Yes |
| Cert Gates | No | Yes | Yes |

---

## Supabase Storage Buckets (Required)

| Bucket | Used By | Purpose |
|--------|---------|---------|
| `evidence` | ChecklistItemCard | Checklist photo evidence |
| `documents` | DocumentVault, ProjectVariations | Documents, signatures |
| `certificates` | CertificationGate | Certificate uploads |

**CRITICAL**: These buckets must be manually created in Supabase Dashboard with proper RLS policies. No migration file exists for this.

---

## Data Flow

```
User → Dashboard → Projects List → Project Detail Hub
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              Construction          Financial          Docs & Comms
              ├─ Stages             ├─ Payments        ├─ Document Vault
              ├─ Checklists         ├─ Budget          ├─ Comms Log
              ├─ Defects            └─ Certificates    └─ Alerts
              ├─ Inspections
              ├─ Variations
              └─ Photos
```
