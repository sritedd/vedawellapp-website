# HomeOwner Guardian — Component Status Matrix

## Status Legend
- WORKING: Fully functional with DB integration
- PARTIAL: Some features work, others broken
- BROKEN: Uses sample data or non-functional
- UI-ONLY: Renders but no backend logic

---

## Core Components

| Component | Status | DB Integrated | File Upload | Notes |
|-----------|--------|---------------|-------------|-------|
| ProgressPhotos | BROKEN | No | No | Hardcoded SAMPLE_PHOTOS, file input not wired |
| ProjectDefects | BROKEN | No | No | Hardcoded INITIAL_DEFECTS, photo button no-op |
| ProjectVariations | PARTIAL | Yes (read) | Yes (signatures) | Signatures upload works, but create/update may be in-memory |
| DocumentVault | WORKING | Yes | Yes | Full CRUD + Supabase Storage upload |
| CertificationGate | WORKING | Yes | Yes | Certificate upload + stage blocking |
| ChecklistItemCard | WORKING | Yes | Yes | Photo evidence upload to `evidence` bucket |
| CommunicationLog | WORKING | Yes | No | Full CRUD for builder comms |
| WarrantyCalculator | WORKING | Reads handover_date | No | Calculates warranty expiry, shows reminders |
| PaymentSchedule | UI-ONLY | No | No | Static payment milestone display |
| BudgetDashboard | PARTIAL | Reads variations | No | Shows contract vs actual, needs real payment data |
| InspectionTimeline | PARTIAL | Yes | No | Hardcoded currentStage |
| NotificationCenter | BROKEN | No | No | Hardcoded sample notifications |
| StageGate | PARTIAL | Yes | No | Hardcoded currentStage/nextStage |
| StageChecklist | PARTIAL | Yes | No | Hardcoded currentStage |
| WeeklyCheckIn | WORKING | Yes | No | Full CRUD for weekly check-ins |
| MaterialRegistry | UI-ONLY | No | No | Static material tracking |
| SiteVisitLog | UI-ONLY | No | No | Static visit logging |
| PreHandoverChecklist | UI-ONLY | No | No | Static checklist |
| MessageTemplates | UI-ONLY | No | No | Pre-written templates (no send) |
| ContractReviewChecklist | UI-ONLY | No | No | Static pre-contract review |
| ConstructionGlossary | WORKING | No | No | Static content (intentionally) |
| ReportGenerator | PARTIAL | Reads data | No | PDF generation via lib/export |
| ExportCenter | PARTIAL | Reads data | No | Export hub |

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
| Login page | WORKING | Email/password, Google OAuth, rate limiting |
| Profile page | WORKING | Edit name, phone, role, password |
| SupportChat | WORKING | Pro-only, real-time-ish messaging |
| ReferralCard | WORKING | Copy link, share stats |

---

## Pages Status

| Page | Status | Notes |
|------|--------|-------|
| /guardian | WORKING | Landing page with JSON-LD |
| /guardian/login | WORKING | Full auth flow |
| /guardian/dashboard | PARTIAL | Stats not clickable, announcement works |
| /guardian/projects | WORKING | Lists all user projects |
| /guardian/projects/new | WORKING | Multi-step creation with workflow seeding |
| /guardian/projects/[id] | PARTIAL | 40+ tabs, many use hardcoded stages |
| /guardian/profile | WORKING | Profile CRUD |
| /guardian/pricing | PARTIAL | Monthly works, yearly price missing |
| /guardian/admin | WORKING | Comprehensive analytics |
| /guardian/support | WORKING | Pro-only gate + chat |
| /guardian/refer | WORKING | Referral system |
| /guardian/journey | WORKING | Learning center |
| /guardian/faq | WORKING | FAQ content |
| /guardian/resources | WORKING | Resource links |

---

## Summary

- **WORKING**: 15 components, 10 pages
- **PARTIAL**: 7 components, 3 pages
- **BROKEN**: 3 components (ProgressPhotos, ProjectDefects, NotificationCenter)
- **UI-ONLY**: 5 components (need DB integration)

The 3 BROKEN components are the most user-facing features (photos, defects, notifications).
The 5 UI-ONLY components are lower priority but should be wired up for production.
