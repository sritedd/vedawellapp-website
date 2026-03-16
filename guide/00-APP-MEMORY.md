# HomeOwner Guardian — App Memory

> **PURPOSE**: This is the persistent memory for the Guardian app. Every new conversation should read this file FIRST to understand current state, what's been done, and what to work on next.
>
> **LAST UPDATED**: 2026-03-16T14:45:00+11:00

---

## 1. CURRENT APP STATE

### Architecture
- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Payments**: Stripe Checkout + Webhooks
- **Hosting**: Netlify (SSR via `@netlify/plugin-nextjs`)
- **Testing**: Playwright (E2E), Jest (unit)
- **Root**: `vedawell-next/` within `c:/Users/sridh/Documents/Github/Ayurveda/`

### Database Tables (17+ tables, migrations up to v17)
```
profiles, projects, stages, checklist_items, variations, defects,
certifications, inspections, documents, weekly_checkins,
communication_log, announcements, support_messages,
email_subscribers, progress_photos, materials, site_visits
```

### Storage Buckets (3, require manual creation + RLS)
- `evidence` — Checklist photos, defect photos, progress photos
- `documents` — DocumentVault uploads, variation signatures
- `certificates` — CertificationGate uploads

### Subscription Tiers
| Tier | Price | Projects | Defects | Variations |
|------|-------|----------|---------|------------|
| Free | $0 | 1 | 3 | 2 |
| Trial | $0 (admin-granted) | ∞ | ∞ | ∞ |
| Guardian Pro | $14.99/mo | ∞ | ∞ | ∞ |

### Key Data: `src/data/australian-build-workflows.json`
- Build categories: new_build, extension, granny_flat
- States with full workflows: NSW, VIC, QLD, WA (SA has regulatory info only)
- Contains: stages, inspections, certificates, dodgy builder warnings, approval pathways, payment milestones, state-specific insurance thresholds and warranty periods

---

## 2. WHAT'S BEEN DONE (Completed Work)

### Session: 2026-03-16 — Tier 2 Features (Session D)

| Change | File(s) |
|--------|---------|
| Dispute Resolution Guide: state-specific pathways (NCAT/DBDRV/QBCC/SAT/SACAT) + 3 template letters | `DisputeResolution.tsx` |
| Dodgy Builder Alerts: contextual warnings from workflow JSON, severity classification, all-stage accordion | `DodgyBuilderAlerts.tsx` |
| Pre-Handover Checklist rewrite: localStorage persistence, 65 items, custom snags, "Create Defects" bridge | `PreHandoverChecklist.tsx` |
| Builder Accountability Score: communication/defect/variation scoring (0-100), SVG gauge, trend indicator | `AccountabilityScore.tsx` |
| New "Protect" nav section with Disputes, Builder Score, Pre-Handover tabs | `projects/[id]/page.tsx` |
| "Red Flags" tab added to Build section | `projects/[id]/page.tsx` |
| NCC 2025 Compliance: 25-item checklist (NatHERS 7-star, livable housing, condensation) | `NCC2025Compliance.tsx` |
| "NCC 2025" tab added to Build section | `projects/[id]/page.tsx` |
| Guided Onboarding: 5-step checklist, collapsible, localStorage persistence | `GuidedOnboarding.tsx` |
| Onboarding auto-shows for new projects, dismissible | `projects/[id]/page.tsx` |
| Mobile Photo Capture: camera input, annotation, upload to Supabase, "Log as Defect" | `MobilePhotoCapture.tsx` |
| Photo FAB (floating action button) on all project tabs | `projects/[id]/page.tsx` |
| Push Notification Setup: permission management, 6 preference toggles, test notification | `PushNotificationSetup.tsx` |
| Cost Benchmarking: variation price analysis vs industry benchmarks, traffic lights | `CostBenchmarking.tsx` |
| Builder Ratings: 5-star reviews, 5 category ratings, localStorage MVP | `BuilderRatings.tsx` |
| TAS/ACT/NT state support: insurance, cooling-off, warranty, license URLs, disputes | `calculations.ts`, `WarrantyCalculator.tsx`, `DisputeResolution.tsx` |
| "Cost Check" tab in Money, "Rate Builder" in Protect, "Notifications" in More | `projects/[id]/page.tsx` |

### Session: 2026-03-16 — Bug Fixes (21 bugs fixed)

#### Critical Fixes
| Bug | Fix | File(s) |
|-----|-----|---------|
| C2: Defect status not validated | `isValidStatusTransition()` from calculations lib | `ProjectDefects.tsx` |
| C3: Free tier not enforced | Tier check + limits (3 defects, 2 variations) | `ProjectDefects.tsx`, `ProjectVariations.tsx` |
| C4: deleteProject partial deletion | try/catch per table, best-effort cleanup | `actions.ts` |

#### High Fixes
| Bug | Fix | File(s) |
|-----|-----|---------|
| H1: Stale data after mutations | `onDataChanged` callback → `fetchProject` | `projects/[id]/page.tsx` |
| H2: License link always NSW | `getLicenseVerificationUrl()` per state | `projects/[id]/page.tsx` |
| H3: Project state not stored | Added `state` + `build_category` to DB + type | `guardian.ts`, `new/page.tsx`, `schema_v17` |
| H4: Hardcoded stage dropdowns | Dynamic `stages` prop from parent | `ProgressPhotos.tsx`, `ProjectDefects.tsx` |
| H5: NotificationCenter query syntax | Fixed `.not()` PostgREST filter | `NotificationCenter.tsx` |
| H6: sendReminder is no-op | Opens mailto with pre-filled defect details | `ProjectDefects.tsx` |

#### Medium Fixes
| Bug | Fix | File(s) |
|-----|-----|---------|
| M2: Referral code collision | Random 8-char unique code | `refer/page.tsx` |
| M3: No project list limit | `.limit(50)` | `projects/page.tsx` |
| M4/M5: Notification state lost | localStorage persistence | `NotificationCenter.tsx` |
| M6: Cert type truncated | 20→50 chars | `new/page.tsx` |
| M7: Cert uses template ID | Now uses DB stage UUID | `new/page.tsx` |
| M8: Dashboard counts only 'open' | Counts all non-terminal statuses | `dashboard/page.tsx` |
| M9: Negative contract value | `Math.max(0, ...)` | `new/page.tsx` |

#### Low Fixes
| Bug | Fix | File(s) |
|-----|-----|---------|
| L1: Dev bypass in prod | Restricted to localhost | `login/page.tsx` |
| L2: Preview URL leak | `revokeObjectURL` cleanup | `ProgressPhotos.tsx` |
| L3: Fragile path parsing | `new URL()` + regex with fallback | `ProgressPhotos.tsx`, `ProjectDefects.tsx` |
| L4: E2E filters too broad | Tightened 403/404 filters | `guardian-full-workflow.spec.ts` |
| L5: Stale guides | Updated component status matrix | `guide/05-COMPONENT-STATUS.md` |

### Session: 2026-03-16 — Gap Analysis Foundation (Session A)

| Change | File(s) |
|--------|---------|
| New `payments` table + RLS + indexes | `schema_v18_gap_fixes.sql` |
| New project columns: `contract_signed_date`, `handover_date`, `expected_end_date` | `schema_v18_gap_fixes.sql` |
| New stage columns: `payment_percentage`, `expected_start_date`, `expected_end_date` | `schema_v18_gap_fixes.sql` |
| Payment interface + updated Project/Stage types | `guardian.ts` |
| Contract signed date form field | `projects/new/page.tsx` |
| Payment milestone seeding from workflow JSON | `projects/new/page.tsx` |
| PaymentSchedule rewrite: DB-backed, Should I Pay?, cert cross-ref | `PaymentSchedule.tsx` |
| Payments cleanup in deleteProject | `actions.ts` |

### Session: 2026-03-16 — Smart Stage Dashboard (Session C)

| Change | File(s) |
|--------|---------|
| New SmartDashboard component: stage-aware contextual overview | `SmartDashboard.tsx` |
| Stage-specific guidance data for all 7 build stages | `SmartDashboard.tsx` |
| "What To Do Now" section with stage-relevant quick actions | `SmartDashboard.tsx` |
| Dodgy builder warnings loaded from workflow JSON per stage | `SmartDashboard.tsx` |
| Action summary cards: open defects, pending inspections, missing certs, payments due | `SmartDashboard.tsx` |
| Recent activity feed across defects, variations, communications | `SmartDashboard.tsx` |
| Construction progress timeline with current stage indicator | `SmartDashboard.tsx` |
| Tab relevance indicators: dots on stage-relevant tabs in nav bar | `projects/[id]/page.tsx` |
| Overview tab now renders SmartDashboard instead of ProjectOverview | `projects/[id]/page.tsx` |
| Insurance/cooling-off/warranty alerts integrated into SmartDashboard | `SmartDashboard.tsx` |

### Session: 2026-03-16 — Insurance, Cooling-Off, Warranty (Session B)

| Change | File(s) |
|--------|---------|
| Insurance validation: state-specific thresholds, scheme names, alerts | `calculations.ts` |
| Cooling-off countdown: business day calculator, state-specific periods | `calculations.ts` |
| Warranty proactive alerts: 30/14/7 day alerts, state-specific periods | `calculations.ts` |
| License verification: state-aware URLs and labels | `calculations.ts` |
| ProjectOverview: cooling-off countdown banner with progress bar | `ProjectOverview.tsx` |
| ProjectOverview: insurance validation alerts (missing policy, expiry) | `ProjectOverview.tsx` |
| ProjectOverview: warranty proactive alerts (structural, non-structural, DLP) | `ProjectOverview.tsx` |
| ProjectOverview: state-aware insurance label + license verify link | `ProjectOverview.tsx` |
| ProjectOverview: shows contract signed date + handover date in details | `ProjectOverview.tsx` |
| WarrantyCalculator: state-aware warranty periods (QLD 6.5yr, SA 5yr, etc.) | `WarrantyCalculator.tsx` |
| WarrantyCalculator: state-specific statutory warranty info panels | `WarrantyCalculator.tsx` |
| WarrantyCalculator: dynamic reminder milestones based on state warranty duration | `WarrantyCalculator.tsx` |

### Not Fixed (Held)
- **M1: Yearly Stripe price** — User requested hold, `pro_yearly.priceId` is empty string in `PricingClient.tsx`

### SQL Migrations Run
- ✅ `schema_v17_project_state.sql` — Adds `state` + `build_category` columns to `projects`
- ⚠️ `schema_v13_storage_buckets.sql` — Status unknown, user should confirm
- ⏳ `schema_v18_gap_fixes.sql` — **Needs to be run on Supabase** (payments table + project/stage columns)

---

## 3. GAP ANALYSIS — WHAT'S MISSING

> Full analysis in `guide/08-GAP-ANALYSIS.md` (to be created from brain artifact)

### Critical Gaps (Must fix for product-market fit)
1. ~~**No Cooling-Off Period Tracker**~~ DONE — state-specific business day countdown with progress bar
2. ~~**No Insurance Validation**~~ DONE — state thresholds, scheme names, expiry alerts
3. ~~**Payment Protection is UI-Only**~~ DONE — DB-backed payments + Should I Pay? + cert cross-ref

### High Gaps
4. ~~**No Dispute Resolution Pathway**~~ DONE — State-specific pathways (NCAT/DBDRV/QBCC/SAT/SACAT) + 3 template letters
5. **No Builder License Auto-Verification** — Just a text field + link
6. ~~**No NCC 2025 Compliance**~~ DONE — 25-item checklist (NatHERS 7-star, livable housing, condensation)
7. ~~**No Proactive Warranty Alerts**~~ DONE — 30/14/7 day alerts, state-aware periods, DLP tracking

### UX Gaps
8. ~~**40-tab overwhelm**~~ DONE — SmartDashboard with stage-relevant tabs highlighted, "What To Do Now" section
9. ~~**No guided onboarding**~~ DONE — 5-step onboarding checklist, auto-shows for new projects
10. ~~**No "What should I do now?"**~~ DONE — SmartDashboard shows stage-specific actions, tips, dodgy builder warnings
11. **Mobile not optimized** — No camera integration, tiny touch targets, no offline mode
12. ~~**Pre-Handover checklist not persisted**~~ DONE — localStorage persistence + "Create Defects" bridge to DB

### Feature Completeness: 9.0/10 | Usability: 8.5/10

---

## 4. ROADMAP — WHAT TO WORK ON NEXT

### Priority Order (Tier 1 first)

#### Tier 1: Product-Market Fit
- [x] **Smart Stage Dashboard** — Replace 40-tab overwhelm with "what matters now"
- [x] **Payment Protection Module** — DB-backed payments + Should I Pay? + cert cross-ref
- [x] **Insurance Validation** — State-specific thresholds, scheme names, expiry alerts
- [x] **Cooling-Off Countdown** — Business day calculator, state-specific periods, progress bar
- [x] **Warranty Proactive Alerts** — Structural/non-structural/DLP alerts, state-aware periods

#### Tier 2: Competitive Differentiation
- [x] **Dispute Resolution Guide** — State-specific pathways + template letters
- [x] **Dodgy Builder Alert System** — Surface existing warning data contextually
- [x] **NCC 2025 Compliance Module** — NatHERS, livable housing, condensation
- [x] **Pre-Handover → Defects Bridge** — Auto-create defects from snag list
- [x] **Builder Accountability Score** — Computed from check-ins and response times

#### Tier 3: UX Polish
- [x] **Guided Onboarding** — 5-step checklist after first project
- [x] **Progressive Tab Disclosure** — Stage-relevant tabs highlighted with dots
- [x] **Mobile-First Photo Flow** — Camera capture + annotation + FAB button
- [ ] **Offline Mode** — Service worker for site visits
- [x] **Push Notifications** — Permission management + preference toggles (MVP, app-check)

#### Tier 4: Scale & Network Effects
- [ ] **Builder Portal** — Builder read/write access
- [x] **Anonymous Builder Ratings** — 5-star reviews + 5 category ratings (localStorage MVP)
- [x] **Cost Benchmarking** — Variation price analysis vs industry benchmarks
- [x] **SA/TAS/ACT/NT Support** — All 8 states/territories now supported
- [ ] **Certifier Integration** — Direct certificate uploads

---

## 5. KEY FILES REFERENCE

### Must-Read Files for Any Session
| File | Purpose |
|------|---------|
| `guide/00-APP-MEMORY.md` | **THIS FILE** — Start here |
| `guide/01-GUARDIAN-ARCHITECTURE.md` | Tech stack, directory structure, DB schema |
| `guide/05-COMPONENT-STATUS.md` | Current component status matrix |
| `guide/06-USER-WORKFLOW.md` | User journey map (needs update) |
| `guide/07-TESTING-SETUP.md` | E2E test setup and known limitations |
| `src/types/guardian.ts` | All TypeScript interfaces |
| `src/data/australian-build-workflows.json` | State workflows, stages, warnings |
| `src/lib/guardian/calculations.ts` | Business logic utility functions |
| `e2e/guardian-smoke.spec.ts` | Smoke tests |
| `e2e/guardian-full-workflow.spec.ts` | Full E2E workflow tests |

### All 49 Components (in `src/components/guardian/`)
```
ProjectDefects.tsx          — Defect CRUD with status validation + free tier
ProjectVariations.tsx       — Variation CRUD with signatures + free tier
ProgressPhotos.tsx          — Photo upload + timeline/grid view
NotificationCenter.tsx      — Computed alerts from real data
DocumentVault.tsx           — File upload + management
CertificationGate.tsx       — Certificate upload + stage blocking
ChecklistItemCard.tsx       — Checklist with photo evidence
CommunicationLog.tsx        — Builder communication log
WarrantyCalculator.tsx      — State-aware warranty periods + proactive alerts
PaymentSchedule.tsx         — DB-backed, Should I Pay?, cert cross-ref
BudgetDashboard.tsx         — Contract vs actual (partial)
InspectionTimeline.tsx      — Inspection booking (partial)
StageGate.tsx               — Stage completion gates
StageChecklist.tsx          — Per-stage checklists
WeeklyCheckIn.tsx           — Builder accountability
MaterialRegistry.tsx        — ⚠️ UI-ONLY
SiteVisitLog.tsx            — ⚠️ UI-ONLY
PreHandoverChecklist.tsx    — localStorage + "Create Defects" bridge to DB
ContractReviewChecklist.tsx — ⚠️ UI-ONLY — needs persistence
DisputeResolution.tsx       — State-specific dispute pathways + 3 template letters
DodgyBuilderAlerts.tsx      — Contextual dodgy builder warnings from workflow JSON
AccountabilityScore.tsx     — Builder accountability score (0-100) from real data
NCC2025Compliance.tsx       — 25-item NCC 2025 compliance checklist with state notes
GuidedOnboarding.tsx        — 5-step onboarding checklist, collapsible, auto-shows
MobilePhotoCapture.tsx      — Camera capture + annotation + upload + "Log as Defect" + FAB
PushNotificationSetup.tsx   — Web push permission + 6 preference toggles (MVP)
CostBenchmarking.tsx        — Variation price analysis vs industry benchmarks
BuilderRatings.tsx          — 5-star builder reviews + 5 category ratings (localStorage MVP)
MessageTemplates.tsx        — Pre-written templates
ConstructionGlossary.tsx    — Static reference
ExportCenter.tsx            — Report export
ReportGenerator.tsx         — PDF generation
ProjectOverview.tsx         — Stats + insurance/cooling-off/warranty alerts (replaced by SmartDashboard on overview tab)
SmartDashboard.tsx          — Stage-aware contextual dashboard: "What To Do Now", dodgy warnings, action cards
ProjectSettings.tsx         — Project settings
ProjectChecklists.tsx       — Checklist viewer
BuilderActionList.tsx       — Pending action items
BuildJourneyTimeline.tsx    — Build journey
BuildTypeSelector.tsx       — Project creation selector
StateWorkflowTimeline.tsx   — State workflow view
QuestionBank.tsx            — Questions for builder
RedFlagsChecker.tsx         — Red flag checker
ReferralCard.tsx            — Referral system
ManageBillingButton.tsx     — Stripe billing
SupportChat.tsx             — Pro support
AdminUserSearch.tsx         — Admin user management
AdminUserManager.tsx        — Admin user actions
AdminAnnouncementManager.tsx — Admin announcements
AdminSupportInbox.tsx       — Admin support inbox
```

---

## 6. INSTRUCTIONS FOR FUTURE SESSIONS

1. **ALWAYS read this file first**: `guide/00-APP-MEMORY.md`
2. **Check the roadmap** (Section 4) for what to work on next
3. **After completing work**, update this file:
   - Move completed items from Section 4 → Section 2
   - Add any new gaps discovered → Section 3
   - Update the component notes if status changes
4. **Keep the gap analysis current** — Update scores as features are built
5. **Run `npx next build`** after every change session to verify
6. **Do NOT fix M1 (Stripe yearly)** until user says to proceed
