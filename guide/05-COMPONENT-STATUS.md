# HomeOwner Guardian — Component Status Matrix

> **Last Updated**: 2026-03-19

## Status Legend
- WORKING: Fully functional with DB integration
- PARTIAL: Some features work, others need improvement
- UI-ONLY: Renders but no backend logic

---

## Core Components

| Component | Status | DB Integrated | File Upload | Notes |
|-----------|--------|---------------|-------------|-------|
| ProgressPhotos | WORKING | Yes | Yes | Supabase Storage + progress_photos table, dynamic stages |
| ProjectDefects | WORKING | Yes | Yes | Full CRUD, status validation, free tier limits, mailto reminders, AI defect assist |
| ProjectVariations | WORKING | Yes | Yes | Full CRUD, signature upload, free tier limits |
| DocumentVault | WORKING | Yes | Yes | Full CRUD + Supabase Storage upload |
| CertificationGate | WORKING | Yes | Yes | Certificate upload + stage blocking |
| ChecklistItemCard | WORKING | Yes | Yes | Photo evidence upload to `evidence` bucket |
| CommunicationLog | WORKING | Yes | No | Full CRUD for builder comms |
| WarrantyCalculator | WORKING | Reads handover_date | No | State-aware warranty periods, proactive 30/14/7 day alerts |
| PaymentSchedule | WORKING | Yes | No | DB-backed, "Should I Pay?" logic, cert cross-ref |
| BudgetDashboard | PARTIAL | Reads variations | No | Shows contract vs actual, needs real payment data |
| InspectionTimeline | WORKING | Yes | No | Dynamic stage from project data |
| NotificationCenter | WORKING | Yes | No | Computes alerts from real data, localStorage persistence |
| StageGate | WORKING | Yes | No | Dynamic stage computation, "All Clear" wired with onProceed |
| StageChecklist | WORKING | Yes | No | Dynamic stage computation from DB |
| WeeklyCheckIn | WORKING | Yes | No | Full CRUD for weekly check-ins |
| MaterialRegistry | WORKING | Yes | No | DB-backed via `materials` table (schema v16) |
| SiteVisitLog | WORKING | Yes | No | DB-backed via `site_visits` table (schema v16) |
| PreHandoverChecklist | PARTIAL | No | No | localStorage persistence + "Create Defects" bridge to DB |
| MessageTemplates | UI-ONLY | No | No | Pre-written templates (no send) |
| ContractReviewChecklist | UI-ONLY | No | No | Static pre-contract review |
| ConstructionGlossary | WORKING | No | No | Static content (intentionally) |
| ReportGenerator | WORKING | Reads data | No | PDF generation via pdf-lib |
| ExportCenter | WORKING | Reads data | No | Export hub, DB-backed |

---

## AI Components (Added 2026-03-18)

| Component | Status | Model | Tier | Notes |
|-----------|--------|-------|------|-------|
| AIDefectAssist | WORKING | Gemini 2.5 Flash-Lite | Free | Rewrites defect descriptions with NCC references, severity, recommendations |
| AIStageAdvice | WORKING | Gemini 2.5 Flash-Lite | Pro | Stage-specific advice, checklist, documents, payment guidance |
| GuardianChat | WORKING | Gemini 2.5 Flash | Pro | Streaming chat with project context (stages, defects, variations) |

### AI API Routes

| Route | Method | Model | Cache TTL | Notes |
|-------|--------|-------|-----------|-------|
| `/api/guardian/ai/describe-defect` | POST | Cheap (Flash-Lite) | 1hr | Structured output with DefectAnalysisSchema |
| `/api/guardian/ai/stage-advice` | POST | Cheap (Flash-Lite) | 7 days | State-validated, cached per stage+state |
| `/api/guardian/ai/chat` | POST | Smart (Flash/Claude) | None | Streaming, project-scoped, ownership verified |
| `/api/guardian/ai/builder-check` | POST | Cheap (Flash-Lite) | 3 days | ABN/license validation (stubs), risk assessment |

### AI Infrastructure

| File | Purpose |
|------|---------|
| `src/lib/ai/provider.ts` | Model selection: Gemini Flash-Lite (free) / Claude Sonnet (optional) |
| `src/lib/ai/prompts.ts` | System prompts with Zod schemas, XML injection defense |
| `src/lib/ai/cache.ts` | Supabase ai_cache table, user-scoped keys, TTL expiry |
| `src/lib/ai/rate-limit.ts` | In-memory rate limiter, shared across routes |

---

## UX Components (Added 2026-03-16)

| Component | Status | Notes |
|-----------|--------|-------|
| SmartDashboard | WORKING | Stage-aware contextual dashboard, "What To Do Now", dodgy warnings |
| DisputeResolution | WORKING | State-specific pathways (NCAT/DBDRV/QBCC/SAT/SACAT) + 3 templates |
| DodgyBuilderAlerts | WORKING | Contextual warnings from workflow JSON, binary "OK/Issue" actions |
| AccountabilityScore | WORKING | Builder score (0-100) from real data, SVG gauge |
| NCC2025Compliance | WORKING | 25-item checklist with binary toggles, localStorage |
| GuidedOnboarding | WORKING | 5-step checklist, auto-shows for new projects |
| MobilePhotoCapture | WORKING | Camera capture + annotation + upload + "Log as Defect" + FAB |
| PushNotificationSetup | WORKING | Web push permission + 6 preference toggles (MVP) |
| CostBenchmarking | WORKING | Variation price analysis vs industry benchmarks |
| BuilderRatings | WORKING | 5-star reviews + 5 category ratings (localStorage MVP) |
| OnboardingWizard | WORKING | 3-step modal for first-time Guardian users |
| ScrollReveal | WORKING | IntersectionObserver-based fade-in animations |
| Toast | WORKING | Global toast notification system, auto-dismiss |

---

## Admin Components

| Component | Status | Notes |
|-----------|--------|-------|
| AdminUserSearch | WORKING | Search + filter + project counts |
| AdminUserManager | WORKING | Grant trial, set tier, revoke |
| AdminAnnouncementManager | WORKING | Create/dismiss announcements |
| AdminSupportInbox | WORKING | Split-panel inbox with reply |

---

## Auth & Profile Components

| Component | Status | Notes |
|-----------|--------|-------|
| Login page | WORKING | Email/password, Google OAuth, rate limiting, localhost-only dev bypass |
| Profile page | WORKING | Edit name, phone, role, password |
| SupportChat | WORKING | Pro-only, real-time-ish messaging |
| ReferralCard | WORKING | Copy link, share stats, unique random referral codes |

---

## Pages Status

| Page | Status | Notes |
|------|--------|-------|
| /guardian | WORKING | Landing page with AI features, ScrollReveal, JSON-LD |
| /guardian/login | WORKING | Full auth flow |
| /guardian/dashboard | WORKING | Clickable stats, state-aware license, announcements |
| /guardian/projects | WORKING | Lists user projects (limit 50) |
| /guardian/projects/new | WORKING | Multi-step creation, state saved, workflow seeding |
| /guardian/projects/[id] | WORKING | 5-section nav (Home/Build/Issues/Evidence/More), AI chat tab |
| /guardian/profile | WORKING | Profile CRUD |
| /guardian/pricing | PARTIAL | Monthly works, yearly price not configured, AI features listed |
| /guardian/admin | WORKING | Comprehensive analytics |
| /guardian/support | WORKING | Pro-only gate + chat |
| /guardian/refer | WORKING | Referral system with unique codes |

---

## Summary

- **WORKING**: 35+ components, 11 pages, 4 AI routes
- **PARTIAL**: 2 components (BudgetDashboard, PreHandoverChecklist), 1 page (Pricing)
- **UI-ONLY**: 2 components (MessageTemplates, ContractReviewChecklist)
