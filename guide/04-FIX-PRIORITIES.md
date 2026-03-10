# HomeOwner Guardian — Fix Priority List

## Priority 1: Make Core Features Work (CRITICAL)

### P1.1 — Fix ProgressPhotos (photo capture & storage)
**File**: `src/components/guardian/ProgressPhotos.tsx`
**What**: Replace sample data with real Supabase integration
- Remove `SAMPLE_PHOTOS` hardcoded array
- Fetch photos from `defects` or new `progress_photos` table
- Wire file input `onChange` to upload to Supabase Storage `evidence` bucket
- Save photo metadata to database
- Add camera capture support (`capture="environment"` for mobile)
- Compress images client-side before upload (< 2MB)
**Est**: 2-3 hours

### P1.2 — Fix ProjectDefects (defect tracking + photos)
**File**: `src/components/guardian/ProjectDefects.tsx`
**What**: Replace sample data with real Supabase CRUD
- Remove `INITIAL_DEFECTS` hardcoded array
- Accept `projectId` prop, fetch defects from database
- Wire "Add Photo" button to file upload
- Persist create/update/delete operations to Supabase
- Display photos in defect detail view
**Est**: 3-4 hours

### P1.3 — Create Storage Bucket Setup
**File**: `supabase/schema_v13_storage_buckets.sql`
**What**: SQL to create and secure storage buckets
- Create `evidence`, `documents`, `certificates` buckets
- Add RLS policies for authenticated uploads
- Add public read policies (or signed URLs)
**Est**: 30 minutes

### P1.4 — Fix Project Deletion (cascade + storage cleanup)
**File**: `src/app/guardian/actions.ts` → `deleteProject()`
**What**: Complete cascade + file cleanup
- Add deletion for: documents, inspections, weekly_checkins, communication_log
- List and delete all storage files under `{projectId}/` prefix
- Better: rely on DB CASCADE and just clean storage
**Est**: 1 hour

---

## Priority 2: Fix UX Issues (HIGH)

### P2.1 — Dynamic Stage Values
**File**: `src/app/guardian/projects/[id]/page.tsx`
**What**: Read current stage from project data instead of hardcoding
- Compute `currentStage` from stages table (first non-completed stage)
- Compute `nextStage` from the stage after current
- Pass dynamic values to StageGate, StageChecklist, CertificationGate, InspectionTimeline
**Est**: 1-2 hours

### P2.2 — Clickable Dashboard
**File**: `src/app/guardian/dashboard/page.tsx`
**What**: Make stats interactive
- Wrap stats cards in `Link` to project detail with appropriate tab
- Handle null `projectId` (show "Create your first project" CTA)
- Add hover states to stat cards
**Est**: 1 hour

### P2.3 — Fix NotificationCenter
**File**: `src/components/guardian/NotificationCenter.tsx`
**What**: Replace sample data with computed alerts
- Query upcoming warranty deadlines, follow-up dates, insurance expiry
- Show real notifications from project data
- No need for a notifications table — compute on the fly
**Est**: 1-2 hours

### P2.4 — Data Freshness
**File**: `src/app/guardian/projects/[id]/page.tsx`
**What**: Refetch data when relevant
- Use `useRouter().refresh()` after mutations
- Or lift state and pass refetch callbacks to child components
- Add error states for failed fetches
**Est**: 1-2 hours

---

## Priority 3: Scale & Polish (MEDIUM)

### P3.1 — Projects Pagination
- Add `limit(20)` + offset pagination or cursor-based
- Add "Load more" button or infinite scroll

### P3.2 — Yearly Stripe Price
- Create yearly price in Stripe Dashboard ($149/yr)
- Add price ID to `PricingClient.tsx`

### P3.3 — Image Compression
- Add client-side image compression before upload
- Target: < 2MB per photo (from max 10MB)
- Use browser Canvas API or `browser-image-compression` library

### P3.4 — Referral Code Uniqueness
- Use `nanoid(8)` instead of `user.id.slice(0,8)`
- Add unique constraint check on generation

---

## Implementation Order

| Step | Task | Time | Blocked By |
|------|------|------|------------|
| 1 | P1.3 Storage buckets SQL | 30m | Nothing |
| 2 | P1.1 Fix ProgressPhotos | 2-3h | Step 1 |
| 3 | P1.2 Fix ProjectDefects | 3-4h | Step 1 |
| 4 | P1.4 Fix deleteProject | 1h | Nothing |
| 5 | P2.1 Dynamic stages | 1-2h | Nothing |
| 6 | P2.2 Clickable dashboard | 1h | Nothing |
| 7 | P2.3 Fix NotificationCenter | 1-2h | Nothing |
| 8 | P2.4 Data freshness | 1-2h | Nothing |

**Total estimated**: ~12-16 hours
