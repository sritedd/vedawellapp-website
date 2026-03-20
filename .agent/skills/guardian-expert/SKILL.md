---
name: HomeOwner Guardian Expert
description: Domain expertise and coding conventions for the HomeOwner Guardian construction protection app
---

# HomeOwner Guardian — AI Skills

## Role
You are an expert in:
- **Australian residential construction** (Class 1a/1b buildings under NCC Volume 2)
- **National Construction Code (NCC/BCA) 2025** compliance
- **State construction law**: NSW Home Building Act 1989, VIC Domestic Building Contracts Act 1995, QLD QBCC Act, WA Building Act 2011
- **Home building insurance**: HBCF (NSW), DBI (VIC), QBCC Insurance (QLD), HII (WA)
- **Dispute resolution**: NCAT, DBDRV, QBCC, SAT
- **Next.js 16 / React 19 / TypeScript / Supabase / Tailwind CSS**

## Before Any Work

1. **ALWAYS read `guide/00-APP-MEMORY.md` first** — This is the app's persistent memory with current state, completed work, gaps, and roadmap
2. Check `guide/05-COMPONENT-STATUS.md` for what's working vs broken
3. Refer to the roadmap in `00-APP-MEMORY.md` Section 4 for priority order

## After Completing Work

1. Update `guide/00-APP-MEMORY.md`:
   - Move completed items from Section 4 → Section 2
   - Add new files modified
   - Note any new gaps in Section 3
2. Run `npx next build` to verify
3. Update `guide/05-COMPONENT-STATUS.md` if component statuses changed

---

## Construction Domain Knowledge

### Key Regulatory Facts (Hardcode These)
- **Cooling-off periods**: NSW 5 business days, VIC 3 clear business days, QLD 5 business days
- **Insurance thresholds**: NSW $20K, VIC $16K, QLD $3.3K, WA $20K, SA $12K
- **Warranty periods**: NSW/VIC/WA 6yr structural + 2yr non-structural, QLD 6.5yr + 6mo, SA 5yr + 1yr
- **Payment milestones** (typical HIA contract): Deposit 5%, Base 10%, Frame 15%, Lockup 35%, Fixing 25%, PC 5-10%
- **Mandatory inspections**: Footing (before pour), Frame, Pre-plasterboard (critical), Final
- **Key certificates**: EICC (electrical), Plumbing Rough-in, Waterproofing, OC/Form 21

### Australian State Regulators
| State | Regulator | Insurance | Tribunal |
|-------|-----------|-----------|----------|
| NSW | NSW Fair Trading | HBCF (icare) | NCAT |
| VIC | VBA → VBPC (Apr 2025) | DBI | VCAT / DBDRV |
| QLD | QBCC | QBCC Insurance | QBCC Dispute Resolution |
| WA | DMIRS Building Commission | HII | SAT |
| SA | Office of Technical Regulator | Builder's Indemnity | SACAT |

### "Dodgy Builder" Red Flags (Reference When Building Alerts)
- Concrete poured before inspection = **MAJOR RED FLAG**
- Demanding payment before certificates obtained = **ILLEGAL**
- "Sign here and we'll fix defects later" = **NEVER DO THIS**
- Weekend pours to avoid inspector
- Missing ceiling insulation batts = **#1 most common defect in Australia**
- "Piering costs extra" after contract signed
- Starting work without valid insurance

---

## Coding Conventions

### Architecture Rules
- **Server Components** (default) for pages — fetch data on server
- **Client Components** (`"use client"`) for interactive UI — marked explicitly
- **Server Actions** in `src/app/guardian/actions.ts` — all mutations
- **Supabase client**: `@/lib/supabase/server` for server, `@/lib/supabase/client` for browser
- **Types** in `src/types/guardian.ts` — always extend, never duplicate
- **Business logic** in `src/lib/guardian/calculations.ts` — pure functions, no React

### Database Patterns
- All tables use UUID primary keys
- User-scoped data uses `user_id` foreign key with RLS
- Project-scoped data uses `project_id` foreign key
- Timestamps are ISO strings from `created_at` columns
- Storage paths follow: `{projectId}/{category}/{timestamp}.{ext}`

### Component Patterns
- Props interface named `{Component}Props`
- Use `createClient()` from appropriate supabase lib
- Free tier enforcement: check `subscription_tier` from profiles table
- State management: `useState` + `useEffect` for data fetching
- Error handling: `setError()` state + inline error display
- Loading states: `setLoading(true/false)` around async operations

### File Upload Pattern
```typescript
const timestamp = Date.now();
const ext = file.name.split(".").pop() || "jpg";
const filePath = `${projectId}/${category}/${timestamp}.${ext}`;
await supabase.storage.from("bucket_name").upload(filePath, file);
const { data: urlData } = supabase.storage.from("bucket_name").getPublicUrl(filePath);
```

### Storage URL Extraction Pattern (for deletion)
```typescript
try {
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/object\/(?:public|sign)\/bucket_name\/(.+)/);
    if (pathMatch?.[1]) {
        await supabase.storage.from("bucket_name").remove([decodeURIComponent(pathMatch[1])]);
    }
} catch {
    console.warn("Could not parse storage URL for cleanup");
}
```

### Supabase Query Patterns
```typescript
// Exclude multiple statuses
.not('status', 'in', '(verified,rectified)')

// Count only
.select('id', { count: 'exact', head: true })

// Maybe get one result (no error if missing)
.maybeSingle()
```

### Free Tier Enforcement Pattern
```typescript
const { data: profile } = await supabase.from("profiles").select("subscription_tier, trial_ends_at, is_admin").eq("id", user.id).single();
const tier = profile?.subscription_tier || "free";
const trialActive = tier === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
const hasPro = tier === "guardian_pro" || profile?.is_admin || trialActive;

if (!hasPro) {
    // Apply free tier limits: 1 project, 3 defects, 2 variations
}
```

---

## Workflow Data Reference

The file `src/data/australian-build-workflows.json` contains:
- `buildCategories`: new_build, extension, granny_flat
- `states[]`: code, name, regulator, insuranceScheme, insuranceThreshold, warrantyPeriods, approvalAuthorities
- `workflows.{category}.{state}`: approvalPathways, stages (with inspections, certificates, dodgyBuilderWarnings, checklists, paymentMilestones)

### Stage IDs (consistent across states)
`site_start → slab → frame → [roof (WA only)] → lockup → [pre_plasterboard (NSW)] → fixing → practical_completion → warranty`

---

## Testing

- **E2E**: `npx playwright test` (Playwright, `e2e/` directory)
- **Unit**: `npx jest` (Jest, `src/components/guardian/__tests__/`)
- **Build check**: `npx next build` (must pass with exit code 0)
- **Smoke test**: `e2e/guardian-smoke.spec.ts` — basic page loads
- **Full workflow**: `e2e/guardian-full-workflow.spec.ts` — per-state testing
