# HomeOwner Guardian — Fix Priority List

> **Last Updated**: 2026-03-20
> **Status**: All original and secondary priorities completed. Only deferred/on-hold items remain.

---

## COMPLETED (All Priorities — Done)

### Original Priorities (P1–P3)
- P1.1 ProgressPhotos → WORKING (Supabase Storage + DB)
- P1.2 ProjectDefects → WORKING (Full CRUD + AI assist)
- P1.3 Storage buckets → Created (schema_v13)
- P1.4 deleteProject → Cascade cleanup (all tables + storage)
- P2.1 Dynamic stages → Computed from DB
- P2.2 Clickable dashboard → Stats link to project tabs
- P2.3 NotificationCenter → Computes from real data
- P2.4 Data freshness → onDataChanged refetch pattern
- P3.1 Projects pagination → `.limit(50)`
- P3.3 Image compression → Client-side before upload
- P3.4 Referral code uniqueness → Random 8-char codes

### Revenue & Conversion
| # | Task | Status |
|---|------|--------|
| 1.1 | Yearly Stripe price | **ON HOLD** — user requested hold |
| 1.2 | Stripe customer portal | **DONE** — ManageBillingButton + /api/stripe/portal |
| 1.3 | Self-service 7-day trial | **DONE** — /api/guardian/start-trial + PricingClient CTA |

### AI Feature Hardening
| # | Task | Status |
|---|------|--------|
| 2.1 | Pro-tier gating for AI routes | **DONE** — `checkProAccess()` in rate-limit.ts |
| 2.2 | Seed knowledge_base | **DONE** — 25 entries (NCC, AS standards, state regs) |
| 2.3 | AI E2E tests | **DONE** — 12 tests in `e2e/guardian-ai.spec.ts` |
| 2.4 | Gemini API fallback | DEFERRED — monitoring manually |

### Data Integrity
| # | Task | Status |
|---|------|--------|
| 3.1 | MaterialRegistry → DB | **DONE** — `materials` table (schema v16) |
| 3.2 | SiteVisitLog → DB + offline | **DONE** — `site_visits` table + IndexedDB queue |
| 3.3 | PreHandoverChecklist → DB | **DONE** — `pre_handover_items` table (schema v22) |
| 3.4 | ContractReviewChecklist → DB | **DONE** — `contract_review_items` table (schema v24) |
| 3.5 | BuilderRatings → DB | **DONE** — `builder_reviews` table with auto-migration (schema v24) |
| 3.6 | Schema migrations v1–v20 applied | **DONE** |

### Scale & Polish
| # | Task | Status |
|---|------|--------|
| 4.1 | Builder license auto-verification | DEFERRED — manual text field + link only |
| 4.2 | Offline mode | **DONE** — IndexedDB queue + enhanced service worker |
| 4.3 | Builder portal | DEFERRED — not before June 2026 |
| 4.4 | Real-time sync | **DONE** — Supabase Realtime on 12 tables |

### Security Hardening (Session I — 2026-03-19)
| # | Task | Status |
|---|------|--------|
| 5.1 | Fix checkProAccess() tier check | **DONE** — "guardian_trial" → "trial" |
| 5.2 | Fix trial loop exploit | **DONE** — keep trial_ends_at on cleanup |
| 5.3 | RLS hardening (schema_v26) | **DONE** — restrict sensitive column updates |
| 5.4 | Referral anti-abuse | **DONE** — self-referral, cap, domain, age checks |

---

## REMAINING (On Hold / Deferred)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Yearly Stripe price | ON HOLD | User requested hold |
| 2 | Builder license auto-verification | DEFERRED | Manual text + link for now |
| 3 | Builder portal | DEFERRED | Not before June 2026 |
| 4 | Certifier integration | DEFERRED | Not before June 2026 |
| 5 | Panchang rebuild | DEFERRED | Needs real astronomical calculations |
| 6 | Run schemas v21–v26 on Supabase | PENDING | Must be done manually in SQL Editor |
| 7 | Server-side web push notifications | DEFERRED | UI exists, server not implemented |
