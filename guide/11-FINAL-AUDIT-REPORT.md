# HomeOwner Guardian — Final Security & AI Audit Report

> **Date**: 2026-03-24
> **Auditor**: Senior Developer + Security Specialist (Oracle-assisted deep review)
> **Scope**: Post-fix codebase — security, bugs, AI architecture, cost analysis
> **Verdict**: Previous P0 fixes are solid. 7 remaining bugs + AI architecture needs grounding before it's production-worthy.

---

## PART 1: REMAINING BUGS & SECURITY GAPS

### ✅ Previously Fixed (Confirmed Working)
| Item | Status |
|------|--------|
| Stripe priceId allowlist (fail-closed) | ✅ Fixed properly |
| Stripe webhook user verification + price check | ✅ Fixed properly |
| Service worker — no private data caching | ✅ Fixed — v3, /guardian/** excluded |
| OTP not logged in production | ✅ Fixed |
| Phone verify — transparent email-based flow | ✅ Fixed (identity_verified) |
| Start-trial uses service-role client | ✅ Fixed |
| Cron uses POST + Bearer auth, fail-closed | ✅ Fixed |
| Admin uses service-role client | ✅ Fixed |
| Admin emails from env var (no hardcoded fallback) | ✅ Fixed |
| Security headers (HSTS, X-Frame, nosniff, Referrer, Permissions) | ✅ Fixed |
| Dashboard parallelized queries | ✅ Fixed |
| touchLastSeen throttled 15min | ✅ Fixed |
| AI env var accepts both names | ✅ Fixed |
| proxy.ts is valid Next.js 16 middleware | ✅ Confirmed (not a bug) |

---

### 🔴 STILL BROKEN — Runtime Bugs

#### BUG-1: AI Cache Is Effectively Non-Functional
**File**: `src/lib/ai/cache.ts:10-14, 39-55`
**Issue**: `getCached()` reads cache using anon key + **empty cookies** (no user session). But `ai_cache` table RLS requires `authenticated` role. Result: **every cache read returns null**. You're paying full inference cost on every request while believing caching works.
**Impact**: Wasted AI API costs, performance degradation
**Fix**: Use service-role client for both reads AND writes. Cache is server-side infra, not a user-facing table.

#### BUG-2: AI Cache Is a Security Vulnerability
**File**: `supabase/schema_v20_ai.sql` (RLS policies)
**Issue**: `ai_cache` RLS allows ANY authenticated user to read/write ALL cache entries. Cache keys include user-scoped data (defect descriptions, project context). One user can read another user's cached AI responses.
**Impact**: Cross-tenant data leakage via cache, cache poisoning
**Fix**: Remove all authenticated-user policies from `ai_cache`. Make it service-role-only.

#### BUG-3: Phone Verification Can False-Success
**File**: `src/app/api/guardian/phone-verify/route.ts:241-250`
**Issue**: Updates `identity_verified` column but doesn't check the update result. If this column doesn't exist in the DB (migrations not applied), the write silently fails but the API returns `{ success: true }`.
**Impact**: Users appear verified when they're not
**Fix**: Check the update result. If `error`, return 500.

#### BUG-4: `isAIAvailable()` Can Lie
**File**: `src/lib/ai/provider.ts:67-68`
**Issue**: Returns `true` if ONLY `ANTHROPIC_API_KEY` is set. But `getCheapModel()` (used by defect-assist, stage-advice, builder-check) requires Google. These routes check `isAIAvailable()`, get true, then crash calling `getGoogle()`.
**Impact**: Runtime crash on cheap AI routes if only Anthropic is configured
**Fix**: Split into `isCheapAIAvailable()` (requires Google) and `isSmartAIAvailable()` (requires either).

#### BUG-5: Stripe Creates Duplicate Customers
**File**: `src/app/api/stripe/checkout/route.ts:39-48`
**Issue**: Uses `customer_email` on every checkout, which creates a new Stripe Customer each time. If a user subscribes, cancels, and re-subscribes, they'll have multiple Stripe customers. Webhook lookups by `stripe_customer_id` will only find the latest.
**Impact**: Billing reconciliation issues, orphaned subscriptions
**Fix**: Before creating checkout, check if `profiles.stripe_customer_id` exists. If yes, use `customer` param instead of `customer_email`.

#### BUG-6: Login Redirect Parameter Mismatch
**Files**: `src/proxy.ts:73` sets `redirectTo`, `src/app/guardian/login/page.tsx` reads `redirect`, `projects/new/page.tsx` uses `returnTo`
**Issue**: Three different redirect parameter names across the app. Protected route redirects don't reliably send users back.
**Impact**: Users lose context after login
**Fix**: Standardize on one param name (`returnTo`) everywhere.

#### BUG-7: Builder Check Generates Reports from Zero Data
**File**: `src/app/api/guardian/ai/builder-check/route.ts:113-123`
**Issue**: `abnData = null`, `licenseData = null`, `reviews = null`. The AI generates a "builder risk report" from ZERO real external data. Users are paying Pro money for hallucinated builder intelligence.
**Impact**: Trust destruction, potential legal liability
**Fix**: Either integrate real data sources (ABN Lookup API, state license APIs, Google Places API) or disable the feature with a clear "coming soon" message.

---

### 🟡 SECURITY — Still Open

#### SEC-1: No Webhook Idempotency
**File**: `src/app/api/stripe/webhook/route.ts`
**Issue**: No event deduplication. If Stripe retries a webhook (which it does on timeouts), the handler processes it again. This could grant/revoke access multiple times.
**Fix**: Add `stripe_webhook_events(event_id PRIMARY KEY, processed_at, type)` table. Check before processing.

#### SEC-2: No CSP Header
**File**: `next.config.ts`
**Issue**: Good security headers exist but no Content-Security-Policy. The app uses `dangerouslySetInnerHTML` for JSON-LD and inline scripts.
**Fix**: Add restrictive CSP with explicit domains for Google Analytics, Stripe, Supabase, AdSense.

#### SEC-3: AI Fallbacks Mask Real Failures
**Files**: `stage-advice/route.ts:154`, `describe-defect/route.ts:117`
**Issue**: On ANY error (auth, DB, provider, quota), these routes return 200 with a fallback response. This makes it impossible to detect outages, quota exhaustion, or configuration errors.
**Fix**: Return `503` for provider errors, `500` for internal errors. Include `{ fallback: true, reason: "..." }` if keeping degraded responses.

#### SEC-4: GA4 Measurement Protocol Payload Is Wrong
**File**: `src/app/api/stripe/webhook/route.ts:13-40`
**Issue**: Uses `client_id: userId` but GA4 requires a GA client_id (from `_ga` cookie), not a user ID. Events may not be attributed correctly.
**Fix**: Use a stable pseudo-anonymous ID or pass a proper GA client_id.

---

## PART 2: AI ARCHITECTURE — COST & EFFECTIVENESS ANALYSIS

### Current AI Cost Structure

| Feature | Model | Cost | Tier | Cache TTL | Daily Limit |
|---------|-------|------|------|-----------|-------------|
| Defect Assist | Gemini 2.5 Flash-Lite | **FREE** | All users | 24hr (broken) | 1000 req/day shared |
| Stage Advice | Gemini 2.5 Flash-Lite | **FREE** | Pro only | 7 days (broken) | 1000 req/day shared |
| Builder Check | Gemini 2.5 Flash-Lite | **FREE** | Pro only | 3 days (broken) | 1000 req/day shared |
| AI Chat | Gemini Flash OR Claude Sonnet | **$0 or $$$** | Pro only | None | None |
| Embeddings | OpenAI text-embedding-3-small | **$0.02/1M tokens** | Unused | N/A | N/A |

### 🔴 Critical AI Issues

#### AI-1: ALL Caching Is Broken
As detailed in BUG-1, cache reads always return null. Every AI request hits the model. At 50 users × 5 requests/day = 250 requests/day against the 1,000/day Gemini free tier limit. **You'll hit quota in 4 days of moderate usage.**

#### AI-2: No Usage Tracking or Cost Monitoring
Zero visibility into:
- Requests per feature per day
- Cache hit rate (currently 0%)
- Tokens consumed
- Latency
- Error/fallback rate
- Cost per user

**You can't optimize what you can't measure.**

#### AI-3: Chat Can Be Extremely Expensive
- Accepts up to 50 messages × 4000 chars each = **200K chars** per request
- No token budgeting, no conversation summarization
- If Claude Sonnet is configured, each chat turn could cost $0.10-0.50+
- 10 active chat users × 20 turns/day = $20-100/day in AI costs

#### AI-4: Builder Check Is Hallucination-Only
Generates risk assessments from zero real data. This is worse than useless — it's dangerously misleading for homeowners making $500K financial decisions.

#### AI-5: Knowledge Base Exists But Is Unused
25 entries exist in `knowledge_base` covering NCC, Australian Standards, state regulations. The embedding model is configured. But **no retrieval pipeline exists**. AI prompts don't pull from the knowledge base at all.

#### AI-6: No AI Quota/Rate Limiting Per User
The in-memory rate limiter only prevents rapid-fire (5-second window). There's no daily limit per user. One user could exhaust the entire Gemini free tier quota in an hour.

---

### ✅ AI Features That Should Be Added (Cost-Effective)

#### 1. Fix Cache → Instant 70% Cost Reduction
**Priority**: CRITICAL
**Effort**: S (< 2 hours)

Switch `ai_cache` to service-role read/write. This alone will eliminate most redundant API calls. Stage advice with 7-day TTL means ~50 unique stage+state combinations are cached and reused across ALL users.

**Expected impact**: 70-80% reduction in AI API calls.

#### 2. Simple Knowledge Base Retrieval (No Embeddings Needed)
**Priority**: HIGH
**Effort**: M (1-2 days)

Before every AI call, query `knowledge_base` by `state`, `category`, and keyword matching:
```sql
SELECT content, source_reference FROM knowledge_base
WHERE state = $1 OR state IS NULL
AND category IN ($2, 'general')
ORDER BY relevance_score DESC LIMIT 5
```

Inject retrieved snippets into the system prompt. This grounds AI responses in real Australian Standards and NCC references instead of relying on model training data.

**Expected impact**: Dramatically better answer quality. Eliminates most hallucinations about specific AS numbers, state thresholds, and regulatory details.

#### 3. AI Usage Telemetry Table
**Priority**: HIGH
**Effort**: S (< 1 day)

```sql
CREATE TABLE ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  feature text NOT NULL, -- 'defect-assist', 'stage-advice', 'chat', 'builder-check'
  model text NOT NULL,
  cache_hit boolean DEFAULT false,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  success boolean DEFAULT true,
  error_code text,
  created_at timestamptz DEFAULT now()
);
```

This gives you: cost per user, feature popularity, cache effectiveness, error rates, and data to decide when to upgrade from free tier.

#### 4. Per-User Daily AI Quotas
**Priority**: HIGH
**Effort**: S

| Tier | Daily AI Requests | Chat Messages |
|------|------------------|---------------|
| Free | 5 (defect assist only) | 0 |
| Trial | 20 | 10 |
| Pro | 50 | 30 |
| Admin | Unlimited | Unlimited |

Check against `ai_usage_log` count for today. Return `429` with upgrade CTA when exceeded.

#### 5. Chat Token Budgeting
**Priority**: HIGH
**Effort**: S-M

- Keep only last 8-12 messages in context
- Set `maxTokens: 1000` on output
- Default to Gemini Flash (not Claude Sonnet)
- Only escalate to Claude for complex reasoning if you have budget

**Expected impact**: 80% chat cost reduction.

#### 6. Progress Claim Review AI (Highest-Value New Feature)
**Priority**: MEDIUM-HIGH
**Effort**: M

The killer AI feature that doesn't exist yet. When a builder submits a payment claim:
- Query: payments, certificates, inspections, defects for that stage
- AI checks: is the stage complete? certificates uploaded? critical defects open?
- Output: PAY / HOLD / DISPUTE with specific reasons

This uses data the app already has. No external APIs needed. Uses cheap Gemini Flash-Lite. Massive user value.

#### 7. Ground Builder Check in Real Data (or Disable It)
**Priority**: MEDIUM
**Effort**: M-L

Options (in order of effort):
1. **Disable it** — return "coming soon" (S, today)
2. **ABN Lookup API** — free Australian government API, real business registration data (M)
3. **State license verification APIs** — some states have public APIs (L)
4. **Google Places API** — real reviews/ratings (M, costs $0.02/request)

Until at least option 2 is done, the feature is misleading.

#### 8. Expand Knowledge Base
**Priority**: MEDIUM
**Effort**: S-M

Current: 25 entries. Should have 100-200+ covering:
- All 8 states' specific regulations
- Common defect types with AS references
- Payment schedule rules per state HBA
- Insurance requirements per state
- Dispute resolution procedures
- Pre-handover checklist items with regulatory backing

This is data entry work, not engineering. Can be done by a domain expert or AI-assisted research.

---

## PART 3: PRIORITY ACTION PLAN

### This Week (Critical)
| # | Item | Type | Effort |
|---|------|------|--------|
| 1 | Fix AI cache (service-role R/W, lock down RLS) | Bug + Security | S |
| 2 | Fix phone-verify false-success (check update errors) | Bug | S |
| 3 | Fix isAIAvailable() split for cheap vs smart | Bug | S |
| 4 | Disable builder-check until grounded | Trust | S |
| 5 | Standardize login redirect param | Bug | S |
| 6 | Add AI usage telemetry table | Observability | S |

### Next Sprint
| # | Item | Type | Effort |
|---|------|------|--------|
| 7 | Fix Stripe customer reuse | Bug | S-M |
| 8 | Add webhook idempotency table | Security | S |
| 9 | Implement KB retrieval for AI prompts | AI Quality | M |
| 10 | Add per-user AI quotas | Cost Control | S |
| 11 | Chat token budgeting (8 turns, Flash default) | Cost Control | S-M |
| 12 | Add CSP header | Security | S-M |
| 13 | Stop AI silent fallbacks (return 503) | Reliability | S |

### Following Sprint
| # | Item | Type | Effort |
|---|------|------|--------|
| 14 | Progress Claim Review AI feature | Revenue | M |
| 15 | Expand knowledge base to 100+ entries | AI Quality | S-M |
| 16 | Integrate ABN Lookup API for builder-check | AI Quality | M |
| 17 | AI chat history persistence | Feature | S-M |

---

## SCORES (Post-Fix)

| Category | Previous | Current | Notes |
|----------|----------|---------|-------|
| Security | 4/10 | **7/10** | Major fixes done; cache leak + no CSP remain |
| AI Effectiveness | — | **3/10** | Cache broken, no grounding, fake builder check |
| AI Cost Efficiency | — | **2/10** | Zero caching, no quotas, no monitoring |
| Performance | 6/10 | **8/10** | Dashboard parallel, touchLastSeen throttled |
| SaaS Readiness | 5/10 | **7/10** | Stripe customer dupes + no webhook idempotency |
| Observability | 3/10 | **3/10** | Still no error tracking, no AI telemetry |
| Code Quality | 7/10 | **8/10** | Cleaner patterns, service-role separation |
| **Overall** | **C+** | **B-** | Security improved; AI is the weakest link now |

---

## THE AI COST-EFFECTIVENESS VERDICT

**Current state**: You're running AI features that look impressive but are:
- ❌ Not grounded in real data (hallucination risk)
- ❌ Not cached (paying full price every time)
- ❌ Not metered (no idea what it costs)
- ❌ Not rate-limited per user (one user can burn quota)
- ❌ Generating fake builder reports from zero evidence

**To make AI truly cost-effective**:
1. **Fix cache** → 70% cost reduction immediately
2. **Add KB retrieval** → dramatically better quality at zero extra AI cost
3. **Add quotas** → prevent abuse
4. **Add telemetry** → know what to optimize
5. **Default to Gemini Flash** → 95% cheaper than Claude for chat
6. **Build Progress Claim Review** → the AI feature users will actually pay for

The path from "AI-enabled" to "truly AI-powered" is: **ground it in real data, measure it, and focus on the one feature (payment protection) that directly saves homeowners money.**
