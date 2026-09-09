---
globs: src/components/guardian/**/*.tsx
---

# Guardian Component Rules

## Client Components
- Must start with `"use client";`
- Import Supabase from `@/lib/supabase/client` (NOT server)
- Always show loading states while fetching data
- Always check `.error` on Supabase queries and show user-visible feedback
- Never use `console.error` alone — pair with `alert()` or toast for user visibility

## Data Fetching
- Fetch from Supabase, NEVER hardcode mock/fake data
- All DB writes must call Supabase (not just `setState`)
- Verify data persists after page refresh
- Use `useCallback` for fetch functions passed as deps to `useEffect`

## Error Handling Pattern
```typescript
const { data, error } = await supabase.from("table").select("*");
if (error) {
    console.error("[Component] Operation failed:", error.message);
    alert("Failed to load data. Please try again.");
    return;
}
```

## Tier Gating
- Check `subscription_tier` for Pro features
- Valid tiers: `"free"`, `"trial"`, `"guardian_pro"`
- Show upgrade prompt for free users, not just hide features
- Free limits: 1 project only — defects and variations are unlimited on every tier since schema_v52 (guide/19 §1.3)

## File Upload Pattern
```typescript
const fileName = `${projectId}/${folder}/${Date.now()}_${file.name}`;
const { error } = await supabase.storage.from("bucket").upload(fileName, file);
if (error) { alert("Upload failed"); return; }
```

## State Management
- Use `useState` + `useEffect` for data fetching
- Optimistic updates OK but must sync to DB
- Use `useRealtimeProject` hook for multi-tab sync
- Use `useOfflineSync` hook for offline-capable writes
