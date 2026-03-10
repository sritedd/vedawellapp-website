# HomeOwner Guardian — Critical Issues Audit

Audit date: 2026-03-10

---

## SEVERITY: CRITICAL (App-breaking, users cannot complete core tasks)

### 1. ProgressPhotos — No Database Integration
**File**: `src/components/guardian/ProgressPhotos.tsx`
- Component initializes with `SAMPLE_PHOTOS` hardcoded array (3 mock photos)
- `useState(SAMPLE_PHOTOS)` — all data is in-memory, lost on refresh
- File input (`type="file"`) exists but `onChange` handler never processes files
- No Supabase Storage upload, no database persistence
- **Impact**: Users cannot save construction progress photos — a core feature

### 2. ProjectDefects — Sample Data, Non-functional Photo Button
**File**: `src/components/guardian/ProjectDefects.tsx`
- Initializes with `INITIAL_DEFECTS` hardcoded mock data
- "Add Photo" button renders `📸 Add Photo` but has NO `onClick` handler
- `photos: string[]` and `rectificationPhotos: string[]` defined in interface but never used
- Create/update/delete operations only modify in-memory state, nothing persists
- **Impact**: Users cannot track real defects — the #1 use case of the app

### 3. Storage Buckets Not Created
**Location**: Supabase Dashboard (no migration file exists)
- Code references 3 buckets: `evidence`, `documents`, `certificates`
- If buckets don't exist, ALL file uploads silently fail
- No bucket creation SQL in any schema migration
- No RLS policies for storage buckets
- **Impact**: Document uploads, certificate uploads, photo evidence — all potentially broken

### 4. Project Deletion Leaves Orphaned Data
**File**: `src/app/guardian/actions.ts` → `deleteProject()`
- Deletes: checklist_items, stages, variations, defects, certifications ✓
- Does NOT delete: `documents`, `communication_log`, `inspections`, `weekly_checkins`
- Does NOT clean up Supabase Storage files (uploaded PDFs, photos, signatures remain forever)
- No transaction wrapper — partial failure leaves data inconsistent
- **Impact**: Deleted projects leave orphaned records and storage bloat. User reported "junk data loaded" after deleting and recreating projects.

---

## SEVERITY: HIGH (Major UX problems, features feel broken)

### 5. Hardcoded Stage Values Throughout Project Detail
**File**: `src/app/guardian/projects/[id]/page.tsx`
- `StageGate` hardcoded: `currentStage="lockup"`, `nextStage="Fixing"` (line ~400)
- `StageChecklist` hardcoded: `currentStage="frame"` (line ~405)
- `CertificationGate` hardcoded: `currentStage="lockup"` (line ~415)
- `InspectionTimeline` hardcoded: `currentStage="Lockup"` (line ~421)
- TODO comment exists acknowledging the issue
- **Impact**: All stage-dependent features show wrong data for every project except one coincidentally at lockup stage

### 6. Dashboard Stats Not Clickable
**File**: `src/app/guardian/dashboard/page.tsx`
- Stats cards (Contract Value, Variations, Open Defects, Projected Total) display data but have no `onClick` or `href`
- Quick Actions link to `projectId` which can be `null` if user has no projects (broken link)
- **Impact**: Dashboard feels static and non-interactive

### 7. NotificationCenter — Hardcoded Sample Data
**File**: `src/components/guardian/NotificationCenter.tsx`
- Uses sample notification data, not fetched from database
- No notification table exists in schema
- **Impact**: Alerts feature is completely non-functional

### 8. Stale Data in Project Detail
**File**: `src/app/guardian/projects/[id]/page.tsx`
- Variations and defects fetched ONCE on component mount
- No refetch when switching tabs or after mutations
- Errors silently caught — user sees empty state without explanation
- **Impact**: Users see outdated information, confusion after edits

---

## SEVERITY: MEDIUM (Missing features, scale concerns)

### 9. No Pagination on Projects List
**File**: `src/app/guardian/projects/page.tsx`
- Single query fetches ALL projects, no `limit()` or offset
- Will degrade at 50+ projects per user
- **Impact**: Performance risk at scale

### 10. Yearly Stripe Price Not Configured
**File**: `src/app/guardian/pricing/PricingClient.tsx`
- Yearly price ID is empty string: `priceId: ""`
- Shows "Coming soon" fallback
- **Impact**: Cannot sell yearly subscriptions ($149/yr)

### 11. Referral Code Uniqueness
**File**: `src/app/guardian/refer/page.tsx`
- Referral code = `user.id.slice(0, 8)` — first 8 chars of UUID
- Low collision probability but not guaranteed unique
- **Impact**: Edge case — two users could get same referral code

---

## SEVERITY: LOW (Polish, nice-to-have)

### 12. Dev Mode Mock Client
- `MockSupabaseClient` in `src/lib/supabase/mock.ts` allows bypassing auth
- Only active when `NODE_ENV=development` AND `dev_mode=true` cookie
- **Impact**: Safe for now, but should be removed before production hardening

### 13. No Real-time Sync
- No Supabase Realtime subscriptions
- Data only refreshes on page reload
- **Impact**: Multi-device usage shows stale data
