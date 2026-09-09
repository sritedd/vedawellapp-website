# VedaWell — HomeOwner Guardian

> Australian homeowner construction monitoring SaaS ($14.99/mo)

## Architecture

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Payments**: Stripe Checkout + Webhooks (live mode)
- **AI**: Google Gemini 2.5 Flash-Lite (free tier), Claude Sonnet (optional)
- **Email**: Resend (domain: vedawellapp.com)
- **Hosting**: Netlify SSR (`@netlify/plugin-nextjs`)
- **Git root**: `vedawell-next/` (NOT the parent `Ayurveda/` directory)

## Directory Structure

```
src/app/guardian/          → Guardian app pages (server components)
src/app/api/               → API routes (stripe, cron, AI, guardian)
src/components/guardian/   → Client components ("use client")
src/lib/supabase/          → Supabase client (server.ts, client.ts)
src/lib/ai/                → AI provider, cache, rate-limit
src/data/                  → Static data (blog posts, build workflows)
src/types/                 → TypeScript types
supabase/                  → SQL migrations (schema_v1-v36)
guide/                     → App memory, component status, audit reports
```

## Critical Rules

### Database
- ALWAYS check `.error` on every Supabase query — never ignore failures
- NEVER use `.upsert()` on `profiles` table from client code (RLS WITH CHECK blocks tier/admin fields)
- Use `.update({fields}).eq("id", userId)` for profile updates
- Every new table MUST have RLS enabled with user_id scoping
- Service role key ONLY in API routes, never in client components

### Auth & Security
- All `/guardian/*` pages must check `supabase.auth.getUser()` → redirect to login if null
- Pro-only features: use `checkProAccess()` from `src/lib/rate-limit.ts`
- Valid tiers: `"free"`, `"trial"`, `"guardian_pro"` (NOT "guardian_trial")
- Admin check: `profile.is_admin === true || isAdminEmail(user.email)`
- Validate `returnTo` params start with `/guardian/` (open redirect prevention)
- Cron routes: fail-closed `if (!cronSecret?.trim() || ...)` pattern

### Components
- Server components by default, `"use client"` only when needed
- Show user-visible errors (alert/toast), not just console.error
- No hardcoded mock/fake data — always fetch from DB
- DB writes must persist (not local state only)
- Loading states: spinner or skeleton for all async operations

### Styling
- Tailwind utility classes only
- Design tokens: `text-primary`, `bg-muted`, `border-border`, `text-foreground`
- Card pattern: `className="card"` (defined in globals.css)
- Responsive: `md:grid-cols-2`, `md:grid-cols-4`

### Email Senders (Resend)
- `noreply@vedawellapp.com` — OTP, verification
- `notifications@vedawellapp.com` — alerts, digests, reminders
- `hello@vedawellapp.com` — welcome, newsletters
- `support@vedawellapp.com` — support replies (Gmail inbox)

### Stripe
- Monthly price: `STRIPE_MONTHLY_PRICE_ID` env var
- Webhook verifies signature, checks idempotency via `stripe_webhook_events` table
- Checkout reuses existing `stripe_customer_id` from profile

### AI Routes
- All AI routes: check quota (`checkDailyQuota`), log usage (`logAIUsage`), inject KB context (`retrieveKnowledge`)
- Quotas (per day, two separate pools): **ai** free=5 / trial=20 / pro=50 / admin=unlimited; **chat** free=0 / trial=10 / pro=30 / admin=unlimited
- Free users get ONE lifetime chat preview (`checkFreeChatAllowance`) — counts successful chat sends ever, including past trial/Pro usage (intentional)
- Only `success=true` rows count against quotas (failed AI calls don't burn allowance)
- `checkProAccess()` returns `tier: "admin"` for admins so quota lookups hit the admin pool
- `isCheapAIAvailable()` for Gemini routes, `isAIAvailable()` for Claude routes
- Return `503 { fallback: true }` on AI errors, never silent 200

## Subscription Tiers
| Tier | Price | Projects | AI/day | Chat/day |
|------|-------|----------|--------|----------|
| Free | $0 | 1 | 5 | 0 (+1 lifetime preview) |
| Trial | $0 (7-day, one-time) | Unlimited | 20 | 10 |
| Guardian Pro | $14.99/mo | Unlimited | 50 | 30 |

## Netlify Deployment
- Base directory: `""` (empty — repo root IS app root)
- Build: `npm run build`, publish: `.next`
- `NEXT_PUBLIC_SUPABASE_URL` must be manually set (Netlify extension sets wrong var)

## Key References
- Full app memory: `guide/00-APP-MEMORY.md`
- Component status: `guide/05-COMPONENT-STATUS.md`
- Build workflows: `src/data/australian-build-workflows.json`
- Schema reference: `supabase/schema_unified.sql`

@.claude/rules/api-routes.md
@.claude/rules/components.md
@.claude/rules/database.md
@.claude/rules/pr-checklist.md
