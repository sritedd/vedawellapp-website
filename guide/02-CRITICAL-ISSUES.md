# HomeOwner Guardian — Critical Issues Audit

> **Original audit date**: 2026-03-10
> **Last updated**: 2026-03-19
> **Status**: ALL CRITICAL AND HIGH ISSUES RESOLVED

---

## RESOLVED ISSUES

All issues from the original audit have been fixed. This document is kept for historical reference.

### CRITICAL (All Fixed — 2026-03-11 to 2026-03-16)

| # | Issue | Resolution | Session |
|---|-------|------------|---------|
| 1 | ProgressPhotos — hardcoded SAMPLE_PHOTOS | Rewritten with Supabase Storage + progress_photos table, dynamic stages | Mar 10 |
| 2 | ProjectDefects — hardcoded INITIAL_DEFECTS | Full CRUD, status validation, free tier limits, AI defect assist | Mar 10 |
| 3 | Storage buckets not created | `schema_v13_storage_buckets.sql` created; buckets: evidence, documents, certificates | Mar 10 |
| 4 | deleteProject leaves orphaned data | try/catch per table, best-effort cascade + storage cleanup | Mar 16 |

### HIGH (All Fixed — 2026-03-10 to 2026-03-16)

| # | Issue | Resolution | Session |
|---|-------|------------|---------|
| 5 | Hardcoded stage values (lockup/frame) | Dynamic stage computation from stages table | Mar 11 |
| 6 | Dashboard stats not clickable | Wrapped in Links, null projectId handled | Mar 11 |
| 7 | NotificationCenter — hardcoded sample data | Computes alerts from real project data | Mar 10 |
| 8 | Stale data after mutations | onDataChanged callback → fetchProject refetch pattern | Mar 16 |

### MEDIUM (All Fixed — 2026-03-16)

| # | Issue | Resolution |
|---|-------|------------|
| 9 | No pagination on projects list | `.limit(50)` added |
| 10 | Yearly Stripe price not configured | **Still pending** — user requested hold |
| 11 | Referral code uniqueness | Random 8-char unique code replaces `user.id.slice(0,8)` |

### LOW (All Fixed — 2026-03-16)

| # | Issue | Resolution |
|---|-------|------------|
| 12 | Dev mode mock client | Restricted to localhost only |
| 13 | No real-time sync | Not implemented (low priority, data freshness via refetch callbacks) |

---

## CURRENT KNOWN ISSUES (as of 2026-03-19)

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | MEDIUM | Yearly Stripe price not configured | `PricingClient.tsx` — priceId is empty string |
| 2 | LOW | MaterialRegistry is UI-only (no DB persistence) | `MaterialRegistry.tsx` |
| 3 | LOW | SiteVisitLog is UI-only (no DB persistence) | `SiteVisitLog.tsx` |
| 4 | LOW | ContractReviewChecklist is UI-only | `ContractReviewChecklist.tsx` |
| 5 | LOW | PreHandoverChecklist uses localStorage only | `PreHandoverChecklist.tsx` |
| 6 | LOW | Builder license auto-verification not implemented | Manual text field + link only |
| 7 | LOW | No offline mode / service worker for site visits | PWA shell exists but no offline data |
