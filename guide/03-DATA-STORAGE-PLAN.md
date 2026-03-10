# HomeOwner Guardian — Data & Storage Architecture

## Current State

### Database (Supabase PostgreSQL)
All user data stored in Supabase PostgreSQL with Row-Level Security (RLS).

**Data isolation**: Every table chains ownership through `projects.user_id = auth.uid()`.
Nested tables (stages, checklist_items, etc.) verify ownership via JOIN to projects.

### File Storage (Supabase Storage)
Three buckets required (may not be created yet):
- `evidence` — Checklist photo evidence
- `documents` — Documents, variation signatures
- `certificates` — Certification uploads

**File naming conventions used in code**:
- Signatures: `signatures/{projectId}/{variationId}_{type}.png`
- Certificates: `{projectId}/certs/{timestamp}_{filename}`
- Documents: `{projectId}/{timestamp}_{filename}`
- Evidence: `{projectId}/{stageId}/{itemId}_{timestamp}.{ext}`

---

## Capacity Planning

### Current Usage (< 10 users)
- Database: ~100 rows across all tables — negligible
- Storage: Minimal uploads — well within Supabase free tier (1GB)

### At 100 Users
| Resource | Estimate | Supabase Free Tier |
|----------|----------|--------------------|
| Database rows | ~10,000 | 500MB (plenty) |
| Storage files | ~2,000 files | 1GB limit — tight |
| Bandwidth | ~5GB/mo | 2GB/mo — EXCEEDED |
| Auth users | 100 | 50,000 (plenty) |
| API requests | ~50K/mo | Unlimited |

**Bottleneck at 100 users**: Storage bandwidth (2GB free) will be exceeded with photo evidence.

### At 1,000 Users
| Resource | Estimate | Action Needed |
|----------|----------|---------------|
| Database | ~100K rows | Upgrade to Pro ($25/mo) |
| Storage | ~20K files / 20GB | Upgrade to Pro (100GB included) |
| Bandwidth | ~50GB/mo | Pro tier covers this |

### Recommended Storage Strategy

**Phase 1 (Now — < 100 users)**: Use Supabase Storage as-is
- Create buckets with proper RLS
- Enforce 10MB file limit (already in code)
- Compress images client-side before upload

**Phase 2 (100-1,000 users)**: Upgrade Supabase to Pro ($25/mo)
- 100GB storage, 250GB bandwidth included
- Sufficient for this scale

**Phase 3 (1,000+ users)**: Consider external storage
- Cloudflare R2 (no egress fees, S3-compatible)
- Or Netlify Blobs (built into hosting)
- Keep Supabase for DB + Auth only

---

## Netlify Blobs (Alternative Storage)

Netlify offers built-in blob storage at no extra cost for deployed sites.
Could replace Supabase Storage for file uploads.

**Pros**:
- No egress fees (served from Netlify CDN)
- No bucket creation needed
- Simple API: `getStore().set(key, data)`

**Cons**:
- Tied to Netlify hosting
- Less mature than Supabase Storage
- No built-in image transformations

**Recommendation**: Stay with Supabase Storage for now. Migrate to Cloudflare R2 if storage costs become significant.

---

## Storage Bucket Setup (Required SQL)

Run this in Supabase SQL Editor to create storage buckets:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('evidence', 'evidence', true),
  ('documents', 'documents', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for evidence bucket
CREATE POLICY "Users can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence');

CREATE POLICY "Users can delete own evidence"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Similar policies for documents and certificates buckets
-- (Repeat pattern for each bucket)
```

---

## Data Cleanup on Project Deletion

Current `deleteProject()` misses these tables/resources:

| Resource | Currently Deleted? | Fix |
|----------|--------------------|-----|
| checklist_items | Yes (manual) | Use CASCADE |
| stages | Yes (manual) | Use CASCADE |
| variations | Yes (manual) | Use CASCADE |
| defects | Yes (manual) | Use CASCADE |
| certifications | Yes (manual) | Use CASCADE |
| documents | **NO** | Add to deletion |
| inspections | **NO** | Add to deletion |
| weekly_checkins | **NO** | Add to deletion |
| communication_log | **NO** | Add to deletion |
| Storage files | **NO** | List + delete from bucket |

**Note**: Most tables already have `ON DELETE CASCADE` on the `project_id` FK, so deleting the project row itself should cascade. The manual deletions in `actions.ts` are redundant (but harmless). The real gap is storage file cleanup.
