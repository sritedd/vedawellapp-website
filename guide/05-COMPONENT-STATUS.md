# HomeOwner Guardian — Component Status Matrix

> **Last Updated**: 2026-03-16

## Status Legend
- WORKING: Fully functional with DB integration
- PARTIAL: Some features work, others need improvement
- UI-ONLY: Renders but no backend logic

---

## Core Components

| Component | Status | DB Integrated | File Upload | Notes |
|-----------|--------|---------------|-------------|-------|
| ProgressPhotos | WORKING | Yes | Yes | Supabase Storage + progress_photos table, dynamic stages |
| ProjectDefects | WORKING | Yes | Yes | Full CRUD, status validation, free tier limits, mailto reminders |
| ProjectVariations | WORKING | Yes | Yes | Full CRUD, signature upload, free tier limits |
| DocumentVault | WORKING | Yes | Yes | Full CRUD + Supabase Storage upload |
| CertificationGate | WORKING | Yes | Yes | Certificate upload + stage blocking |
| ChecklistItemCard | WORKING | Yes | Yes | Photo evidence upload to `evidence` bucket |
| CommunicationLog | WORKING | Yes | No | Full CRUD for builder comms |
| WarrantyCalculator | WORKING | Reads handover_date | No | Calculates warranty expiry, shows reminders |
| PaymentSchedule | UI-ONLY | No | No | Static payment milestone display |
| BudgetDashboard | PARTIAL | Reads variations | No | Shows contract vs actual, needs real payment data |
| InspectionTimeline | WORKING | Yes | No | Dynamic stage from project data |
| NotificationCenter | WORKING | Yes | No | Computes alerts from real data, localStorage persistence |
| StageGate | WORKING | Yes | No | Dynamic stage computation from DB |
| StageChecklist | WORKING | Yes | No | Dynamic stage computation from DB |
| WeeklyCheckIn | WORKING | Yes | No | Full CRUD for weekly check-ins |
| MaterialRegistry | UI-ONLY | No | No | Static material tracking |
| SiteVisitLog | UI-ONLY | No | No | Static visit logging |
| PreHandoverChecklist | UI-ONLY | No | No | Static checklist |
| MessageTemplates | UI-ONLY | No | No | Pre-written templates (no send) |
| ContractReviewChecklist | UI-ONLY | No | No | Static pre-contract review |
| ConstructionGlossary | WORKING | No | No | Static content (intentionally) |
| ReportGenerator | WORKING | Reads data | No | PDF generation via lib/export |
| ExportCenter | WORKING | Reads data | No | Export hub |

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
| /guardian | WORKING | Landing page with JSON-LD |
| /guardian/login | WORKING | Full auth flow |
| /guardian/dashboard | WORKING | Clickable stats, state-aware license, announcement |
| /guardian/projects | WORKING | Lists user projects (limit 50) |
| /guardian/projects/new | WORKING | Multi-step creation, state saved, workflow seeding |
| /guardian/projects/[id] | WORKING | 40+ tabs, dynamic stages, stale data callbacks |
| /guardian/profile | WORKING | Profile CRUD |
| /guardian/pricing | PARTIAL | Monthly works, yearly price not configured |
| /guardian/admin | WORKING | Comprehensive analytics |
| /guardian/support | WORKING | Pro-only gate + chat |
| /guardian/refer | WORKING | Referral system with unique codes |
| /guardian/journey | WORKING | Learning center |
| /guardian/faq | WORKING | FAQ content |
| /guardian/resources | WORKING | Resource links |

---

## Summary

- **WORKING**: 22 components, 12 pages
- **PARTIAL**: 1 component (BudgetDashboard), 1 page (Pricing)
- **UI-ONLY**: 5 components (need DB integration for production)
