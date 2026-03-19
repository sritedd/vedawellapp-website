# Brand Differentiation Analysis

> **Last Updated**: 2026-03-19
> **Status**: Analysis complete — awaiting decision

---

## The Problem

**homeguardian.ai** is an existing Australian company (NDIS registered, multi-award-winning) that sells **fall detection devices** for seniors. They own the domain, have Google sitelinks, and rank well for "HomeGuardian" searches.

Our product is called **"HomeOwner Guardian"** — a construction tracking app. The name collision creates:
1. **SEO confusion** — Google may associate our content with fall detection
2. **Brand dilution** — Users searching "HomeGuardian" find the wrong company
3. **Legal risk** — Potential trademark issues if they protect "HomeGuardian" in software
4. **Trust erosion** — Users who find the wrong site may assume we're copying them

---

## Current Brand Usage (150+ instances)

| Variant | Count | Where |
|---------|-------|-------|
| HomeOwner Guardian | 150+ | Page titles, meta, hero, blog, emails, PDFs, FAQ, AI prompts |
| Guardian (standalone) | 35+ | Feature names (Guardian Chat), AI prompts, landing pages |
| HomeGuardian | 2 | Guide docs only (not production) |
| Home Guardian | 0 | Not used |

**Critical files** (most impactful for rename):
- `src/app/page.tsx` — Homepage hero
- `src/app/layout.tsx` — Global meta/SEO
- `src/data/blog/posts.ts` — 85+ blog references
- `src/lib/ai/prompts.ts` — AI model identity
- `src/lib/notifications/email-service.ts` — User emails
- `public/manifest.json` — PWA metadata
- All `src/app/guardian/*/page.tsx` — 7+ page titles

---

## Options

### Option A: Keep "HomeOwner Guardian" (Do Nothing)
- **Pros**: No work, existing SEO indexed, users already know the name
- **Cons**: Brand confusion persists, SEO competition with homeguardian.ai
- **Risk**: Low-medium (they're in a different market — fall detection vs construction)

### Option B: Rename to "BuildGuard" or "BuildGuardian"
- **Pros**: Clear construction context, no brand conflict, memorable
- **Cons**: 150+ file changes, SEO reindexing needed, users may be confused
- **Domains**: buildguard.com.au / buildguardian.com.au (check availability)
- **Effort**: 4-6 hours (find-replace + URL redirect strategy)

### Option C: Rename to "VedaWell Build" or "VedaWell Construction"
- **Pros**: Leverages parent brand, no conflict, simple
- **Cons**: Long name, less memorable, "VedaWell" not construction-associated
- **Effort**: 4-6 hours

### Option D: Emphasize "by VedaWell" suffix (Minimal Change)
- **Pros**: Minimal work, clarifies distinction, keeps recognition
- **Cons**: Doesn't fully resolve SEO conflict
- **Change**: "HomeOwner Guardian" → "HomeOwner Guardian by VedaWell" everywhere
- **Effort**: 2 hours

### Option E: Rename to "SiteGuard" or "BuildShield"
- **Pros**: Short, distinctive, construction-focused
- **Cons**: Same effort as Option B, new domain needed
- **Effort**: 4-6 hours

---

## Recommendation

**Option D (short-term) + Option B (long-term)**

1. **Now**: Ensure "by VedaWell" appears in all critical SEO locations (page titles, meta descriptions, JSON-LD). This is partially done already.
2. **Later**: If the product gains traction, consider a full rename to something like "BuildGuard" with proper 301 redirects.

The brand conflict is **low severity** because:
- Different markets (fall detection vs construction tracking)
- Different target audiences (seniors/carers vs homeowners building)
- Our URL is `/guardian` under vedawellapp.com, not a standalone domain
- Google already indexes us correctly for "vedawell" + construction terms

**Action items if proceeding with rename:**
- [ ] Check domain availability for preferred name
- [ ] Plan 301 redirect strategy for `/guardian` → new path
- [ ] Update all 150+ brand instances
- [ ] Resubmit sitemap to GSC
- [ ] Update Stripe product name
- [ ] Notify existing users via email

---

## Decision

**Status**: Awaiting user decision. No code changes made for rename — this is analysis only.
