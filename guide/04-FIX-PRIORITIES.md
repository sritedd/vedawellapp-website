# HomeOwner Guardian — Fix Priority List

> **Last Updated**: 2026-03-19
> **Status**: All original P1/P2 priorities completed. Updated with current priorities.

---

## COMPLETED (All Original Priorities — Done)

All items from the original priority list (P1.1–P1.4, P2.1–P2.4, P3.1–P3.4) have been resolved:

- P1.1 ProgressPhotos → WORKING (Supabase Storage + DB)
- P1.2 ProjectDefects → WORKING (Full CRUD + AI assist)
- P1.3 Storage buckets → Created (schema_v13)
- P1.4 deleteProject → Cascade cleanup implemented
- P2.1 Dynamic stages → Computed from DB
- P2.2 Clickable dashboard → Stats link to project tabs
- P2.3 NotificationCenter → Computes from real data
- P2.4 Data freshness → onDataChanged refetch pattern
- P3.1 Projects pagination → `.limit(50)`
- P3.3 Image compression → Client-side before upload
- P3.4 Referral code uniqueness → Random 8-char codes

---

## CURRENT PRIORITIES (as of 2026-03-19)

### P1 — Revenue & Conversion
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 1.1 | Create yearly Stripe price ($149/yr) and wire to PricingClient | `PricingClient.tsx` | 30m |
| 1.2 | Add Stripe customer portal for subscription management | `/api/stripe/portal/route.ts` | 1h |

### P2 — AI Feature Hardening
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 2.1 | Pro-tier gating for AI chat, builder check, stage advice | All AI API routes | 1h |
| 2.2 | Seed knowledge_base with NCC/AS references for RAG | `knowledge_base` table | 2h |
| 2.3 | AI E2E tests (defect assist, chat, builder check) | `e2e/guardian-ai.spec.ts` | 2h |
| 2.4 | Monitor Gemini API usage and add fallback for rate limits | `src/lib/ai/provider.ts` | 1h |

### P3 — Data Integrity
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 3.1 | Wire MaterialRegistry to `materials` table (schema v16) | `MaterialRegistry.tsx` | 1h |
| 3.2 | Wire SiteVisitLog to `site_visits` table (schema v16) | `SiteVisitLog.tsx` | 1h |
| 3.3 | Wire PreHandoverChecklist to DB (currently localStorage) | `PreHandoverChecklist.tsx` | 1h |
| 3.4 | Confirm all schema migrations v13–v20 are applied | Supabase SQL Editor | 30m |

### P4 — Scale & Polish
| # | Task | File(s) | Est |
|---|------|---------|-----|
| 4.1 | Builder license auto-verification via ABN/QBCC APIs | New component | 3h |
| 4.2 | Offline mode with service worker for site visits | `sw.js` | 3h |
| 4.3 | Builder portal (read/write access for builders) | New pages | 5h |
| 4.4 | Real-time sync via Supabase Realtime subscriptions | Multiple components | 3h |
