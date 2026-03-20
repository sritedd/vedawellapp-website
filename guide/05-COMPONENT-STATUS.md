# HomeOwner Guardian — Component Status Matrix

> **Last Updated**: 2026-03-20

## Status Legend
- WORKING: Fully functional with DB integration
- PARTIAL: Some features work, others need improvement
- UI-ONLY: Renders but no backend logic
- STATIC: Intentionally static content (no DB needed)

---

## Core Components (DB-integrated)

| Component | Status | DB Table(s) | File Upload | Notes |
|-----------|--------|-------------|-------------|-------|
| ProjectDefects | WORKING | defects | Yes | Full CRUD, status validation, free tier limits, AI assist |
| ProjectVariations | WORKING | variations | Yes (signatures) | Full CRUD, signature upload, free tier limits |
| ProgressPhotos | WORKING | progress_photos | Yes | Supabase Storage + dynamic stages |
| DocumentVault | WORKING | documents | Yes | Full CRUD + Supabase Storage |
| CertificationGate | WORKING | certifications | Yes | Certificate upload + stage blocking |
| ChecklistItemCard | WORKING | checklist_items | Yes | Photo evidence upload |
| CommunicationLog | WORKING | communication_log | No | Full CRUD for builder comms |
| InspectionTimeline | WORKING | inspections, stages | No | Booking + results from DB |
| StageGate | WORKING | inspections, certifications, defects | No | Dynamic requirements from DB |
| StageChecklist | WORKING | stages, checklist_items | No | Dynamic from DB |
| WeeklyCheckIn | WORKING | weekly_checkins | No | Full CRUD |
| PaymentSchedule | WORKING | payments | No | DB-backed, "Should I Pay?", cert cross-ref |
| MaterialRegistry | WORKING | materials | No | DB-backed via schema v16 |
| SiteVisitLog | WORKING | site_visits | No | DB-backed + offline mode (IndexedDB queue) |
| PreHandoverChecklist | WORKING | pre_handover_items | No | DB-backed (schema v22), 65 items, "Create Defects" bridge |
| ContractReviewChecklist | WORKING | contract_review_items | No | DB-backed (schema v24), optional projectId prop |
| BuilderRatings | WORKING | builder_reviews | No | DB-backed (schema v24), auto-migrated from localStorage |
| NotificationCenter | WORKING | Multiple (reads) | No | Computed alerts, localStorage persistence |
| WarrantyCalculator | WORKING | Reads handover_date | No | State-aware periods, 30/14/7 day proactive alerts |
| BudgetDashboard | PARTIAL | Reads variations | No | Shows contract vs actual, needs real payment sum |

---

## Dashboard & Insights Components

| Component | Status | Notes |
|-----------|--------|-------|
| SmartDashboard | WORKING | Stage-aware contextual dashboard, "What To Do Now", dodgy warnings, activity feed |
| ShouldIPay | WORKING | Green/red payment verdict from payments + certs + inspections + defects |
| ProjectHealthScore | WORKING | Circular SVG gauge, 4 sub-scores (build/defects/inspections/engagement) |
| MilestoneCelebrations | WORKING | 8 achievements with animated slide-in toasts, localStorage dedup |
| AccountabilityScore | WORKING | Builder score (0-100) from real data, SVG gauge |
| TimelineBenchmark | WORKING | Stage-by-stage dual bar charts, builder pace vs industry averages |
| ProgressTimeline | WORKING | Gantt-style SVG timeline with stage bars, inspections, today line |

---

## AI Components

| Component | Status | Model | Tier | Notes |
|-----------|--------|-------|------|-------|
| AIDefectAssist | WORKING | Gemini 2.5 Flash-Lite | Free | Rewrites defect descriptions with NCC refs, severity |
| AIStageAdvice | WORKING | Gemini 2.5 Flash-Lite | Pro | Stage-specific advice, checklist, documents |
| GuardianChat | WORKING | Gemini 2.5 Flash | Pro | Streaming chat with project context |

### AI API Routes

| Route | Method | Model | Tier | Cache TTL |
|-------|--------|-------|------|-----------|
| `/api/guardian/ai/describe-defect` | POST | Flash-Lite | Free | 1hr |
| `/api/guardian/ai/stage-advice` | POST | Flash-Lite | Pro | 7 days |
| `/api/guardian/ai/chat` | POST | Flash/Claude | Pro | None |
| `/api/guardian/ai/builder-check` | POST | Flash-Lite | Pro | 3 days |

### AI Infrastructure

| File | Purpose |
|------|---------|
| `src/lib/ai/provider.ts` | Model selection: Gemini Flash-Lite (free) / Claude Sonnet (optional) |
| `src/lib/ai/prompts.ts` | System prompts with Zod schemas, XML injection defense |
| `src/lib/ai/cache.ts` | Supabase ai_cache table, user-scoped keys, TTL expiry |
| `src/lib/ai/rate-limit.ts` | In-memory rate limiter + `checkProAccess()` tier gate |

---

## UX & Feature Components

| Component | Status | Notes |
|-----------|--------|-------|
| DisputeResolution | WORKING | State-specific pathways (NCAT/DBDRV/QBCC/SAT/SACAT) + 3 templates |
| DodgyBuilderAlerts | WORKING | Contextual warnings from workflow JSON, binary "OK/Issue" actions |
| NCC2025Compliance | WORKING | 25-item checklist with binary toggles, localStorage |
| GuidedOnboarding | WORKING | 5-step checklist, auto-shows for new projects |
| MobilePhotoCapture | WORKING | Camera capture + annotation + FAB speed-dial ("Report Defect" + "Progress Photo") |
| TribunalExport | WORKING | 10-section evidence package, state-specific tribunal contacts |
| ShareProgressCard | WORKING | Branded progress card with WhatsApp/X/native share |
| PushNotificationSetup | WORKING | Web push permission + 6 preference toggles (MVP, no server push) |
| CostBenchmarking | WORKING | Variation price analysis vs industry benchmarks |
| OnboardingWizard | WORKING | 3-step modal for first-time Guardian users |
| PhoneVerificationGate | WORKING | Phone OTP gate on project creation |

---

## Export & Reports

| Component | Status | Notes |
|-----------|--------|-------|
| ExportCenter | WORKING | Hub for PDF downloads via `/api/guardian/export-pdf` |
| ReportGenerator | WORKING | PDF generation via pdf-lib |
| `/api/guardian/export-pdf` | WORKING | 6 report types: full, defects, variations, payments, dispute, summary |

---

## Auth, Profile & Verification

| Component | Status | Notes |
|-----------|--------|-------|
| Login page | WORKING | Email/password, Google OAuth, phone mandatory, rate limiting |
| Profile page | WORKING | Edit name, phone, role, password |
| PhoneVerificationGate | WORKING | 6-digit OTP, 10min expiry, 5 attempts max |
| SupportChat | WORKING | Pro-only messaging |
| ReferralCard | WORKING | Copy link, share stats, unique random codes |
| ManageBillingButton | WORKING | Opens Stripe customer portal |

---

## Admin Components

| Component | Status | Notes |
|-----------|--------|-------|
| AdminUserSearch | WORKING | Search + filter + project counts + phone/email bypass/reset buttons |
| AdminUserManager | WORKING | Grant trial, set tier, revoke, phone/email management |
| AdminAnnouncementManager | WORKING | Create/dismiss announcements |
| AdminSupportInbox | WORKING | Split-panel inbox with reply |

---

## Static / Reference Components

| Component | Status | Notes |
|-----------|--------|-------|
| ConstructionGlossary | STATIC | Intentionally static reference content |
| MessageTemplates | UI-ONLY | Pre-written templates (no send functionality) |
| QuestionBank | STATIC | Questions reference for builder meetings |
| RedFlagsChecker | STATIC | Red flag reference checker |
| ProjectOverview | WORKING | Stats + insurance/cooling-off/warranty (replaced by SmartDashboard on overview tab) |

---

## Other Components

| Component | Status | Notes |
|-----------|--------|-------|
| ScrollReveal | WORKING | IntersectionObserver fade-in animations |
| Toast | WORKING | Global toast notification system, auto-dismiss |
| ThemeProvider | WORKING | Dark/light/system theme |
| BuildTypeSelector | WORKING | Project creation build type picker |
| StateWorkflowTimeline | WORKING | State workflow visual timeline |
| BuildJourneyTimeline | WORKING | Build journey visual |
| ProjectChecklists | WORKING | Checklist viewer |
| ProjectSettings | WORKING | Project settings editor |
| BuilderActionList | WORKING | Pending action items list |

---

## Cron & Background Routes

| Route | Schedule | Notes |
|-------|----------|-------|
| `/api/cron/cleanup-trials` | Daily | Expires stale trials → "free" (preserves trial_ends_at) |
| `/api/cron/weekly-digest` | Weekly | Branded HTML email summaries via Resend for Pro/trial users |
| `/api/notifications` | On-demand | Stale defect email reminders |

---

## Summary

- **WORKING**: 57+ components, 16 pages, 4 AI routes, 5 Guardian API routes, 3 Stripe routes, 2 cron routes
- **PARTIAL**: 1 component (BudgetDashboard)
- **UI-ONLY**: 1 component (MessageTemplates)
- **STATIC**: 3 components (ConstructionGlossary, QuestionBank, RedFlagsChecker — intentionally no DB)
