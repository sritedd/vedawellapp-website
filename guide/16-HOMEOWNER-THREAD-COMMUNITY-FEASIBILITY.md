# Homeowner Thread Community — Feasibility Study (v2, app-grounded)

Last updated: 2026-04-25
Product: VedaWell Next — HomeGuardian
Feature proposal: Reddit-like homeowner thread page with Discord-style community support
Document owner: VedaWell founder

---

## Executive Summary

HomeGuardian is evaluating whether to build an in-app community where Australian homeowners currently building can ask questions, share defect photos, and get peer support. This study assesses three architectural options (native, Discord-only, hybrid) and three additional alternatives the original draft missed (subreddit, self-hosted Discourse, embedded participation in existing Facebook/Reddit communities).

**Key finding**: at zero paying customers, building any owned community is the wrong sequencing. The right path is a three-phase validation gate — start by being visible in existing communities (Phase -1, free), validate demand via a HomeGuardian subreddit (Phase 0, ~1 day), and only invest in a native build after both gates are met (Phase 1, ~4 weeks engineering). This avoids the "empty community" failure mode that kills 80% of pre-launch SaaS community projects.

**Critical Australian-specific risks** under-weighted in v1: defamation exposure under the Defamation Act uniform reform 2021 makes us liable for user-posted statements about specific builders; dodgy-builder reputation laundering creates an asymmetric incentive for bad actors to join; solo-founder moderation cannot scale past ~200 daily posts without AI assistance and trust-level systems. Mitigations are detailed in §5.4 and §8.

**Recommendation**: GO on Phase -1 immediately (already executing), GO on Phase 0 in 60-90 days, CONDITIONAL GO on Phase 1 only if validation gates in §6 are met. Estimated total engineering when all phases ship: ~4 months. Estimated infrastructure cost at 1,000 community users: ~$50/month. Estimated moderation time at 1,000 users: 2-3h/day.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [0. Reality check](#0-reality-check-read-this-before-everything-else)
- [1. Objective](#1-objective)
- [2. Business outcomes — cold-start-aware targets](#2-business-outcomes--cold-start-aware-targets)
- [3. Requirements](#3-requirements)
- [3a. Stakeholder roles](#3a-stakeholder-roles)
- [4. Feasibility options (expanded)](#4-feasibility-options-expanded)
- [5. Recommended path (revised)](#5-recommended-path-revised)
  - [5.1 App surface](#51-app-surface-when-we-build)
  - [5.2 Data model](#52-data-model-supabase)
  - [5.3 Security and RLS](#53-security-and-rls)
  - [5.4 Moderation model (Australian-grounded)](#54-moderation-model-australian-grounded)
  - [5.5 Discord integration (deprioritised)](#55-discord-integration-deprioritised)
  - [5.6 AI-first community features](#56-ai-first-community-features-new--competitive-moat)
  - [5.7 Cold-start content strategy](#57-cold-start-content-strategy-new--the-make-or-break)
- [6. Delivery plan and effort estimate](#6-delivery-plan-and-effort-estimate-revised)
- [6a. Timeline & milestones](#6a-timeline--milestones-target-dates)
- [7. Cost and operations](#7-cost-and-operations-with-real-numbers)
- [8. Risk register](#8-risk-register-australia-specific)
- [9. Measurement and experiment plan](#9-measurement-and-experiment-plan)
- [10. Go/No-Go recommendation](#10-gono-go-recommendation-revised-stage-aware)
- [11. Definition of done](#11-definition-of-done-per-phase)
- [12. Decision matrix](#12-decision-matrix-tldr-for-the-next-30-days)
- [13. Reuse map](#13-reuse-map--what-wed-build-vs-what-already-exists)
- [14. Use cases](#14-use-cases)
- [15. Action items](#15-action-items)
- [Appendix A — Differences from v1](#appendix-a--differences-from-v1)
- [Appendix B — Open questions](#appendix-b--open-questions-for-the-founder)
- [Changelog](#changelog)

> **v2 changes**: rewritten 2026-04-25 to ground every section in HomeGuardian's actual stack, current zero-customer reality, Australian legal exposure, and the 30-Red-Flags lead magnet that just shipped at [/red-flags](../src/app/red-flags/page.tsx). v2.1 adds Executive Summary, TOC, Stakeholder Roles, Timeline table, Use Cases, Action Items, and Changelog per deep-research review feedback.

---

## 0) Reality check (read this before everything else)

Three facts that change every recommendation in this document:

1. **We have zero paying customers as of 2026-04-25.** Every metric in v1 ("20% WAU community participation") implicitly assumes an existing user base. We don't have one. A community launched today launches into an empty room — and an empty community is dead on arrival.

2. **r/AusRenovation already exists.** 180k members, free, indexed by Google, established norms. Anyone we'd want in our community is already there. The first-mover question for "Australian homeowners building a new home" was answered ~5 years ago. We're not creating a category — we'd be carving niche from inside one.

3. **Solo founder, bootstrap budget, no moderation team.** An Australian builder-dispute community is one of the highest-risk content categories in the country: defamation exposure (uniform Defamation Act 2021), legal-advice grey area, dodgy-builder reputation laundering, scraping bots from competing trades and lawyers. "Daily moderation review" without a team is not a workable plan.

**Implication for this study**: the binary question isn't "build native vs Discord vs hybrid". It's *"is the right next investment a community at all, given we still have to validate demand for the product itself?"* This document now treats community-building as **conditional on hitting validation milestones first**.

---

## 1) Objective

Build a community experience that lets homeowners:
- ask questions about specific build issues
- share defects + lessons-learned with photo evidence
- get peer responses faster than from their builder
- discover HomeGuardian as the structured tool that captures it all

Strategic intent (revised):
- **Primary**: create a defensible content moat around Australian builder-dispute knowledge that Google indexes and ranks (every thread = a long-tail SEO landing page for an obscure dispute query)
- **Secondary**: lift trial-to-paid conversion via social proof
- **Tertiary**: real-time engagement / "stickiness" (lowest priority — this is what Discord is for, and we don't need to own that surface)

This study evaluates:
- a native Reddit-like thread page inside HomeGuardian
- a Discord community only
- a hybrid model
- **(NEW)** alternatives outside the native vs Discord axis: subreddit, Discourse, Circle.so, embedded participation in existing Facebook groups

---

## 2) Business outcomes — cold-start-aware targets

The v1 metrics ("20% community WAU") presuppose hundreds of active users. We don't have those. Reframed in three stages:

### 2.1 Validation gate (months 1–3 post-launch)

Before declaring "the community works":
- 50+ unique authenticated posters within 90 days
- 200+ threads with at least one reply (no orphan posts)
- median time to first reply < 24 hours
- < 5 moderation incidents per week (spam, abuse, defamation flag)
- ≥ 30% of /red-flags PDF subscribers visit `/guardian/community` once

If any of these miss by > 50%, **kill the feature** rather than feed it. A dying community actively harms the brand more than no community.

### 2.2 Growth phase (months 3–9)

After validation:
- community weekly active visitors ≥ 25% of `/guardian/*` weekly visitors
- thread participation rate ≥ 8% of WAU (not 12% — Reddit's average is ~5%)
- average replies per thread ≥ 2.5
- ≥ 50% of new threads receive Google indexation within 14 days
- search traffic to community pages ≥ 40% of total community traffic by month 9

### 2.3 Conversion (continuously measured, not gated)

- trial-to-paid lift among community-active users vs control: target +10% (v1 said +15%; honest target is lower because community users skew toward "researching, not yet committed")
- attribution: track `community → trial` and `community-thread-view → trial` separately. The threads that convert tell you which red flags are highest-value content.

---

## 3) Requirements

Core functional requirements (v1 list is correct, lightly expanded):
- create threads (title, body, **state-scoping**, build-stage tag, category)
- comment + nested replies (max depth 3 — Reddit-style infinite nesting hurts mobile)
- single-direction reaction model (upvote only — downvote drives toxicity in dispute communities)
- sort by new / top-this-week / hot
- report abuse / spam / defamation
- moderation tools for admin
- profile card (state, build stage, reputation, badges — *no real names exposed*)

Nice-to-have (re-prioritised):
- **(promoted to MVP)** image attachments — non-negotiable for a defects community
- **(promoted to MVP)** "verified homeowner" badge — gated by having an active project in HomeGuardian (kills 80% of bot/builder-shill traffic on day one)
- accepted-answer marker
- follow-thread notifications
- weekly "best discussions" digest (already have cron + email infra)
- **(NEW)** "create defect from this thread" — one-click flow that pulls thread content into a new `defects` row in the user's project

Non-functional requirements:
- mobile-first (60-70% of our PDF signups via TikTok/FB will be mobile)
- secure auth + RLS (already in stack)
- anti-spam + moderation (rate-limit infra exists at [src/lib/security/rate-limit.ts](../src/lib/security/rate-limit.ts) and [src/lib/ai/rate-limit.ts](../src/lib/ai/rate-limit.ts))
- low operational cost (solo founder)
- fit existing stack (Next.js 16 + Supabase + Netlify + Resend)
- **(NEW)** structured for Google indexability (server-rendered, sitemap inclusion, JSON-LD `DiscussionForumPosting` schema)

---

## 3a) Stakeholder roles

Different stakeholders have different incentives — naming them up front prevents accidentally optimising for the wrong audience.

| Stakeholder | Interest | Responsibilities / Touchpoints | Tier |
|-------------|----------|-------------------------------|------|
| **Founder** | Validate demand, conversion, product moat | Product decisions, moderation calls, content seeding, weekly metric review | Admin |
| **Verified Homeowner** (active HomeGuardian project) | Get fast peer answers, share evidence, find similar cases | Posts threads, answers others, marks accepted answers, reports abuse | Free / Trial / Pro |
| **Casual Visitor** (PDF subscriber, no project yet) | Research before committing, learn what to watch for | Reads threads via search, may sign up to post | Anonymous / Free |
| **Pro Subscriber** | Premium signal, better tools, priority answers | All Verified Homeowner actions + access to "AI Site Supervisor" sub-forum | Pro ($14.99/mo) |
| **Casual Australian Reddit Visitor** | Found a thread via Google, just looking | Reads only — most won't sign up. Conversion target: PDF signup, not registration | Anonymous |
| **Independent Building Inspector** (potential affiliate) | Gain referrals from clear defect cases, share expertise | Optional verified-pro badge after vetting; answers technical questions | Special role |
| **Hostile Builder / Astroturf** | Bury complaints, post fake positive reviews, identify complainants | Detected via verified-homeowner gate, AI moderation, report flow | Suspended |
| **Spammer / Bot** | Scrape leads, post link spam, sell unrelated services | Blocked by reCAPTCHA, rate limit, AI moderation | Blocked |
| **Lawyer / Solicitor** | Genuinely help vs solicit clients | Allowed if helpful; banned if cold-soliciting (against rules) | Free / Special |
| **Council / Regulator** | Reference legitimate complaints (rare) | Read-only; takedown requests honoured per legal process | External |

**Implication for product**: the verified-homeowner badge and upvote-only reaction model are designed specifically to advantage the legitimate stakeholders (Verified Homeowner, Pro Subscriber) over the hostile ones (Astroturf, Spammer). Every product decision should be evaluated against this stakeholder map.

---

## 4) Feasibility options (expanded)

The v1 doc compared 3 options. The honest list is 6.

### Option A — Native Reddit-like community (in HomeGuardian)

What: `/guardian/community` area, fully owned data + UX + moderation.

| Pros | Cons |
|------|------|
| Strongest SEO moat — every thread is a `/guardian/community/[slug]` URL we control and Google can index | Highest build effort (4-6 weeks v1 estimate is realistic) |
| Seamless with auth, tier gates (`checkProAccess`), realtime hook ([useRealtimeProject](../src/lib/supabase/useRealtimeProject.ts)), activity log, toast system | Highest ongoing moderation load |
| Direct conversion nudges to `/guardian/pricing` | Cold-start problem: empty community = abandoned community |
| Reuses ~70% of existing infra (see §13) | Solo-founder moderation realistically constrains this |

Technical feasibility: **High** — stack already supports everything. Strategic feasibility at zero customers: **Low-Medium**.

### Option B — Discord-only

What: external Discord server, app links to it.

| Pros | Cons |
|------|------|
| Fastest to launch (1 day) | Conversation data leaves the product permanently |
| Zero engineering | No SEO benefit (Discord content not indexed) |
| Real-time chat is what Discord does well | Discord is a poor fit for the audience: average Australian homeowner over 35, not Discord-native |
| | Discord moderation is harder than people think (no rich audit trail for legal incidents) |

Technical feasibility: **Very high**. Strategic value: **Low** — wrong tool for our audience.

### Option C — Hybrid (native threads + optional Discord)

What: native async thread page + optional Discord for live chat / events.

This was v1's recommendation. Still defensible if we go the build route — but only after validation.

### Option D — Subreddit (NEW)

What: launch r/HomeGuardianAU. Moderate it ourselves. Cross-link from our /red-flags PDF and blog.

| Pros | Cons |
|------|------|
| Free, instant launch | We don't own the data, the brand, or the relationship |
| Reddit's existing audience finds it organically | Reddit's algorithm decides who sees what |
| Zero infra cost | Subreddit could be killed or banned at any time |
| Reddit IS the audience — we go to them, not vice versa | Cannot tier-gate features |
| Established defamation/moderation norms | Conversion attribution is opaque |

Technical feasibility: **Trivial**. Strategic value: **High at this stage** — leverages existing 180k r/AusRenovation audience overlap, validates demand without building anything.

### Option E — Discourse self-hosted (NEW)

What: spin up a Discourse instance at `community.vedawellapp.com`.

| Pros | Cons |
|------|------|
| Mature platform, SEO-friendly out of the box | $10-30/mo hosting + setup time |
| Best-in-class moderation tooling | Separate auth (or SSO setup) |
| Active spam-fighting community + plugins | Subdomain split harms brand cohesion |
| Tier integration possible via Discourse plugins | Less integrated than native — the "create defect from thread" flow harder |

Technical feasibility: **Medium**. Strategic value: **Medium** — good middle path if native build is too expensive.

### Option F — Embed in existing comms (NEW)

What: don't build anything. Maintain visible expert presence in r/AusRenovation, r/AusFinance, "Home Owners of Australia" Facebook group, etc. Each helpful answer cross-links to /red-flags or /blog.

| Pros | Cons |
|------|------|
| Zero engineering, zero ops | Zero owned channel |
| Audience is already there | Subject to platform whims |
| Tests demand without infra | No SEO accumulation |
| **This is the marketing strategy already shipped at [scripts/red-flags-distribution.md](../scripts/red-flags-distribution.md)** | Brand-building is slow |

Technical feasibility: **N/A**. Strategic value at this stage: **Highest**. Already actively executing.

---

## 5) Recommended path (revised)

Three-phase recommendation that respects current customer count:

```
NOW (months 0-3) — Option F: be visible in existing communities
  └─ Validate demand: do answers we post actually drive PDF signups?
  └─ Track: signup attribution by source (UTM)
  └─ Decision gate: 500+ /red-flags signups before considering build

THEN (months 3-6) — Option D: launch r/HomeGuardianAU
  └─ Cross-promote from /red-flags + blog
  └─ Validate: can we sustain 5+ threads/week with quality replies?
  └─ Decision gate: 100+ subreddit subscribers, 20+ active monthly

LATER (months 6+) — Option C: native hybrid (only if D + F succeed)
  └─ Migrate the best subreddit content into /guardian/community
  └─ Keep the subreddit alive as top-of-funnel
  └─ Add Discord bridge once thread density is consistent
```

**The core principle**: don't build community infrastructure until you've proven the audience exists and is engageable on free platforms. Building too early is the most common community failure mode.

If/when we do build native (Option A/C), §5.1–5.7 below describes the architecture.

---

## 5.1 App surface (when we build)

New routes:
- `/guardian/community` — thread feed (server component, prerendered)
- `/guardian/community/new` — create thread (client component)
- `/guardian/community/[threadId]/[slug]` — thread detail + replies (server component for SEO)
- `/guardian/community/c/[category]` — category feed
- `/guardian/community/state/[state]` — state-scoped feed (NSW/VIC/QLD etc.)
- `/guardian/community/mod` — admin moderation queue

New components (estimated):
- `CommunityThreadList.tsx`
- `CommunityThreadComposer.tsx` — uses existing image upload pattern from [MobilePhotoCapture](../src/components/guardian/MobilePhotoCapture.tsx)
- `CommunityThreadCard.tsx`
- `CommunityThreadDetail.tsx` — JSON-LD `DiscussionForumPosting` for SEO
- `CommunityReplyTree.tsx` — depth-capped at 3
- `CommunityReactionBar.tsx` — upvote-only, no downvote
- `CommunityReportDialog.tsx`
- `CommunityModerationQueue.tsx` — extends pattern from `AdminSupportInbox`
- `CommunityCreateDefectButton.tsx` — NEW: one-click "log this in my project"

---

## 5.2 Data model (Supabase)

New tables:

```sql
-- Categories (seeded on migration, locked schema — not user-editable)
community_categories (
  id, slug, label, description, sort_order, is_active
)

-- Threads
community_threads (
  id UUID PK,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES community_categories(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,                          -- url-safe, generated server-side
  body TEXT NOT NULL,
  state_code TEXT CHECK (state_code IN ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')),
  build_stage TEXT,                             -- 'pre-construction'|'slab'|'frame'|'lockup'|'fixing'|'handover'|'warranty'|null
  upvote_count INT DEFAULT 0,                   -- denormalised for sort perf
  reply_count INT DEFAULT 0,                    -- denormalised
  is_locked BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,             -- soft-delete (legal req)
  is_verified_homeowner BOOLEAN DEFAULT false,  -- snapshot of poster's verification status at post time
  ai_moderation_status TEXT DEFAULT 'unchecked',-- 'pass'|'flag'|'block'|'unchecked'
  ai_moderation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Replies (and replies-to-replies)
community_posts (
  id UUID PK,
  thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  depth INT DEFAULT 0 CHECK (depth <= 3),       -- enforce nesting cap
  is_accepted_answer BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  ai_moderation_status TEXT DEFAULT 'unchecked',
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Image attachments (stored in Supabase Storage)
community_attachments (
  id UUID PK,
  thread_id UUID,
  post_id UUID,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (thread_id IS NOT NULL OR post_id IS NOT NULL)
)

-- Reactions (upvote-only)
community_reactions (
  user_id UUID,
  thread_id UUID,
  post_id UUID,
  reaction_type TEXT DEFAULT 'upvote',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, thread_id, post_id)
)

-- Reports
community_reports (
  id UUID PK,
  reporter_user_id UUID,
  thread_id UUID,
  post_id UUID,
  reason TEXT CHECK (reason IN ('spam','abuse','defamation','off-topic','misinformation','other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','dismissed','actioned')),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Thread follows (notification subscriptions)
community_thread_follows (
  user_id UUID,
  thread_id UUID,
  PRIMARY KEY (user_id, thread_id)
)

-- Moderation actions audit log (legal req — defamation defence)
community_moderation_actions (
  id UUID PK,
  admin_user_id UUID,
  action TEXT,                                  -- 'lock'|'pin'|'delete_thread'|'delete_post'|'suspend_user'|'edit'
  target_type TEXT,                             -- 'thread'|'post'|'user'
  target_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- User community profile (separate from `profiles` to keep core RLS simple)
community_profiles (
  user_id UUID PRIMARY KEY,
  display_name TEXT,                            -- pseudonym, NOT real name
  state_code TEXT,                              -- shown publicly
  is_verified_homeowner BOOLEAN DEFAULT false,  -- has active HomeGuardian project
  reputation INT DEFAULT 0,                     -- sum of own upvotes
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspension_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

Indexes:
- threads: `(category_id, created_at DESC)`, `(state_code, created_at DESC)`, `(upvote_count DESC, created_at DESC)`, `(is_pinned DESC, created_at DESC)`, partial `WHERE is_deleted=false`
- posts: `(thread_id, parent_post_id, created_at)`, partial `WHERE is_deleted=false`
- reports: `(status, created_at)` partial `WHERE status='pending'`
- moderation_actions: `(target_type, target_id, created_at)`

Total new tables: 9. Migration: `schema_v45_community.sql`.

---

## 5.3 Security and RLS

Policies (Supabase RLS, mirrors patterns from [supabase/schema_unified.sql](../supabase/schema_unified.sql)):

```sql
-- community_threads
CREATE POLICY "threads_public_read" ON community_threads FOR SELECT
  USING (is_deleted = false);
CREATE POLICY "threads_authenticated_insert" ON community_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);
CREATE POLICY "threads_owner_update" ON community_threads FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - INTERVAL '15 minutes');
-- Admin/moderation = service role only (no user policy)

-- community_posts: same pattern
-- community_reports: only admin reads, only authenticated insert
-- community_moderation_actions: service-role only (audit log)
```

Abuse controls (concrete, using existing infra):

| Control | Implementation | Reuse |
|---------|----------------|-------|
| Per-user posting rate limit | 5 threads/day, 30 replies/day, in-memory Map keyed by user_id (cold-start safe — exceeding window resets between cold-starts is acceptable for forum) | New, modelled after [export-pdf throttle](../src/app/api/guardian/export-pdf/route.ts) |
| Per-IP rate limit | 50 reads/min, 10 posts/hour | Middleware + headers from `x-forwarded-for` |
| Minimum account age | 24 hours before first post | DB check on `auth.users.created_at` |
| Verified homeowner gate (Pro feature) | `community_profiles.is_verified_homeowner` set when user has ≥ 1 active `projects` row, surfaced as badge | Cron updates daily |
| AI first-pass moderation | Each new thread/post → Gemini classification: `pass`/`flag`/`block`. Block → 422 with reason. Flag → posted but added to mod queue. | New API route, reuses [ai/provider.ts](../src/lib/ai/provider.ts) |
| reCAPTCHA v3 on first 3 posts | Score < 0.5 → reject silently | New, shipped before launch |
| Duplicate-content detection | SimHash of title+body, compared against last 30 days | New |
| Link spam | Limit external links to 2 per post; auto-flag posts with > 3 | Regex parse |

---

## 5.4 Moderation model (Australian-grounded)

**v1's MVP moderation model is dangerously light for the legal context.** Here's the realistic version.

### Australian legal exposure (CRITICAL — read before launch)

1. **Defamation Act uniform reform 2021**: as the publisher of user-generated content in Australia, **HomeGuardian is potentially liable** for defamatory statements about specific builders. A homeowner posting "Acme Builders cheated me" is a defamation lawsuit waiting to happen — and the lawsuit names *us*, not them.

2. **The "innocent dissemination" defence** requires us to prove we didn't know about the content AND we removed it promptly when notified. This means:
   - We need a published takedown policy
   - We need a written takedown process with target SLA (24h)
   - We need an audit log of every moderation action (`community_moderation_actions` table above)
   - We need to NOT actively review content before publication, OR if we do, we must catch defamation reliably (can't have it both ways)

3. **ACCC/ACMA**: misleading testimonials about products/services are illegal under Australian Consumer Law. A faked positive review of a builder posted in our community could expose us.

4. **Privacy Act 1988**: posting another person's name + complaint without their consent may breach APP 6 (use/disclosure).

### Recommended moderation model

**MVP (launch readiness)**:
- Published Community Rules at `/guardian/community/rules` covering: no naming specific builders without evidence, no professional/legal advice, mandatory disclaimer that posts are user opinions
- Takedown form on every thread/post (`Report` button)
- Admin moderation queue at `/guardian/community/mod` (extends [AdminSupportInbox](../src/components/guardian/AdminSupportInbox.tsx) pattern)
- Mandatory mod review of every report within 24h (Resend email alert to admin email)
- Automatic 30-day soft-delete retention before hard-delete (legal evidence preservation)
- AI first-pass moderation on every new post (Gemini → classify defamation/PII/spam risk)

**Phase 2 (after 100+ users)**:
- Trust levels: new user can post but content held for review; trust level rises with positive history
- Community moderators (volunteers) — 3-tier permission model
- Weekly "moderation summary" email to admin

**Solo-founder reality**: at 50 daily posts, expect 5–10 reports/week. At 200 daily posts, expect 20–30. Each report = 5–15 min of reading + decision + audit trail entry. **At 200 daily posts you're spending 10+ hours/week on moderation alone.** This is the binding constraint, not engineering effort.

### Builder-shill defence (unique to this niche)

Dodgy builders WILL join the community to:
- Post fake positive reviews of themselves
- Bury legitimate complaints with downvotes
- Astroturf "this isn't really a defect" replies
- Direct-message complainants offering to settle privately

Mitigations:
- Verified homeowner badge (gated to active HomeGuardian project) creates a clear signal
- Upvote-only model removes downvote brigading
- AI moderation prompts include "is this an unverified positive review of a named builder?"
- DM features explicitly NOT shipped (forces all communication public + auditable)
- Admin gets weekly "new accounts with > 3 builder mentions" report

---

## 5.5 Discord integration (deprioritised)

v1 had Discord as a "phase 2 nice-to-have". v2 deprioritises it further:

- The audience (Australian homeowners 35+, often first-time builders) is **not Discord-native**. WhatsApp/Facebook are their real-time channels.
- Discord adds another moderation surface for the same legal exposure
- Already low-priority should drop to "consider after community has 500+ active members"

If demand emerges, the integration is the same as v1 described — link out, optional OAuth, optional role sync. No changes there.

---

## 5.6 AI-first community features (NEW — competitive moat)

We have substantial AI infrastructure already wired ([ai/provider.ts](../src/lib/ai/provider.ts), [ai/cache.ts](../src/lib/ai/cache.ts), [ai/rate-limit.ts](../src/lib/ai/rate-limit.ts), [ai/usage-log.ts](../src/lib/ai/usage-log.ts), `knowledge_base` pgvector table). Most 2026 communities still don't use AI well. This is our differentiation.

| Feature | What it does | Reuses |
|---------|--------------|--------|
| **Similar-thread suggestions** | While typing thread title, vector-search `knowledge_base` + existing threads, show "3 similar discussions exist" — kills duplicate posts | pgvector + embedding model already used for KB retrieval |
| **AI moderation first-pass** | Every new thread/post → Gemini classifies for spam/defamation/PII/off-topic before publication | `getCheapModel()`, ai_cache |
| **Auto-tag and categorise** | Submit body text → AI suggests state, build stage, category. User can override but defaults are smart | Gemini, cached |
| **AI thread summary** | Threads with 10+ replies get an AI-generated 3-bullet summary at top: "what was asked / what was answered / what action to take" | Reuses chat AI route pattern |
| **Pro-only: "Ask the AI Site Supervisor"** | Pro-tier sub-forum where each thread also gets an AI expert reply within 5 minutes (uses `getSmartModel`, draws from `knowledge_base`) | Existing AI chat infra; gated by `checkProAccess()` |
| **Cross-link to your project** | If user has an active HomeGuardian project and the thread mentions a defect, show "Log this in your project →" CTA | `defects` table + existing project read |
| **Auto-link relevant red flags** | When new thread is posted, AI matches it to one of the 30 red flags from [/red-flags PDF](../src/app/red-flags/page.tsx). Shows "Related: Red Flag #14 — Termite barrier missing" inline. | New |
| **Weekly digest auto-generation** | Cron picks top 5 threads, AI writes 1-paragraph teaser for each, sends as weekly email. Driven by [existing weekly-digest cron](../src/app/api/cron/weekly-digest/route.ts) extension. | Existing cron + Resend |

These features are *the reason to build native* rather than launch a subreddit. None of them are possible on Reddit/Discord/Discourse.

---

## 5.7 Cold-start content strategy (NEW — the make-or-break)

**Empty communities die.** The top reason community projects fail isn't tech — it's the chicken-egg of "first 100 threads".

The 30 red flags PDF gives us a starter content advantage almost no other community has at launch:

### Seed content plan (must complete BEFORE public launch)

1. **30 anchor threads from the PDF** — one per red flag, framed as a question. "Builder poured slab without inspection — what should I do?" Each thread has a community-team account answering with the PDF action steps. Each thread is the SEO landing page for that red-flag query.

2. **20 anchor threads from existing blog posts** — convert each [BLOG_POSTS entry](../src/data/blog/posts.ts) into a "discussion" thread. Cross-link.

3. **8 state-specific welcome threads** — one per state, "Welcome NSW homeowners — common NCAT pitfalls". Pin these.

4. **Curated weekly Q&A from real Reddit/Facebook threads** — for the first 60 days, the community team posts 3 threads/week paraphrasing real questions seen in r/AusRenovation (with attribution + link). This signals to genuine users that the community is alive AND establishes the answer-format norm.

5. **Verified homeowner spotlight** — once we have 5+ verified homeowners, weekly "build journey" featured thread.

**Total seed effort**: ~80 anchor threads + 20 weekly Q&A threads in first 60 days = ~100 quality threads before the community looks alive enough to invite users to.

This effort is non-trivial (60-90 hours of writing) but it's the difference between launching a ghost town and a vibrant community.

### Distribution plan (reuse existing assets)

- Welcome email from /red-flags PDF signup includes "Discuss with other homeowners → community link" (week 2 of nurture sequence)
- Every blog post footer adds "Discuss this on the community →"
- Every cron-sent weekly digest includes 1 community thread highlight
- Footer link sitewide
- TikTok script #31 onwards: "Live Q&A with verified homeowners — discuss YOUR red flag at vedawellapp.com/community"

---

## 6) Delivery plan and effort estimate (revised)

### Phase -1: Validate without building (months 0–3, NOW)

Effort: $0, runs in parallel with everything else.

- Execute the marketing distribution plan at [scripts/red-flags-distribution.md](../scripts/red-flags-distribution.md)
- Track: do PDF signups happen? Do blog posts get traffic? Are people clicking through to /guardian?
- Decision gate: 500+ /red-flags signups → graduate to Phase 0

### Phase 0: Lightweight presence (months 3–4)

Effort: 1-2 days engineering, ongoing curation.

- Launch r/HomeGuardianAU subreddit
- Cross-promote from PDF + blog
- Cross-link in welcome email sequence
- Decision gate: 100+ subreddit members + 20+ active monthly + at least 3 organic PDF signups attributable to subreddit posts → graduate to Phase 1

### Phase 1: Native MVP (months 4–6)

Effort: 4-5 weeks engineering.

- Schema migration v45 + RLS
- Routes: feed, detail, create, mod queue
- Components: 9 new + 1 admin queue extension
- AI moderation first-pass
- Image attachments via existing storage bucket pattern
- Verified-homeowner badge
- Reports + mod queue
- Seed 80 anchor threads (parallel work, mostly content)
- Public Community Rules + takedown policy

### Phase 2: AI features (months 6-8)

Effort: 2-3 weeks engineering.

- Similar-thread suggestions
- AI thread summarisation
- Auto-tag/categorise
- "Ask the AI Site Supervisor" Pro-only sub-forum
- Cross-link to user's project / red-flag mapping

### Phase 3: Growth + Discord bridge (months 8-10)

Effort: 1-2 weeks.

- Notification + follow system
- Weekly auto-digest extension to existing cron
- Optional Discord bridge (Phase 2 of v1's plan)
- Trust levels + Phase 2 moderation

**Total when all phases shipped**: ~4 months engineering (not 4-6 weeks as v1 suggested), assuming Phase -1 + Phase 0 succeed in unlocking each subsequent phase.

---

## 6a) Timeline & milestones (target dates)

Anchored to today (2026-04-25). All dates are *targets contingent on validation gates*, not commitments.

| # | Milestone | Owner | Target date | Gate to advance |
|---|-----------|-------|-------------|-----------------|
| 1 | Wire day-3/7/14 nurture cron for /red-flags signups | Founder | 2026-05-02 | Schema v44 already shipped |
| 2 | Begin Phase -1 distribution (TikTok, Reddit, Facebook) | Founder | 2026-05-01 | [scripts/red-flags-distribution.md](../scripts/red-flags-distribution.md) ready |
| 3 | First 100 /red-flags PDF signups | — | 2026-06-15 | Phase -1 traction signal |
| 4 | First 500 /red-flags PDF signups | — | 2026-07-31 | **Validation gate 1 → unlock Phase 0** |
| 5 | Launch r/HomeGuardianAU subreddit | Founder | 2026-08-05 | Phase 0 begins |
| 6 | Subreddit moderator bot + auto-moderation rules live | Founder | 2026-08-10 | Spam defence |
| 7 | r/HomeGuardianAU 100 subscribers | — | 2026-09-30 | Organic growth signal |
| 8 | r/HomeGuardianAU 20+ active monthly posters | — | 2026-10-31 | **Validation gate 2 → unlock Phase 1** |
| 9 | Schema v45 community migration written + reviewed | Founder | 2026-11-15 | Phase 1 begins |
| 10 | RLS policies + 9 tables shipped to staging | Founder | 2026-11-22 | Schema applied |
| 11 | Routes + components MVP shippable | Founder | 2026-12-15 | Engineering 80% done |
| 12 | 80 anchor threads seeded | Founder + writer | 2026-12-20 | Cold-start mitigation |
| 13 | AI moderation first-pass live | Founder | 2026-12-22 | Quality gate before public |
| 14 | Professional indemnity insurance active | Founder | 2026-12-22 | Legal pre-launch |
| 15 | Phase 1 native MVP public launch | Founder | 2027-01-05 | Soft launch to PDF list |
| 16 | First 50 verified homeowners | — | 2027-02-28 | Engagement signal |
| 17 | Phase 2 (AI features) shipped | Founder | 2027-03-31 | Conditional on Phase 1 metrics |
| 18 | Phase 3 (growth + Discord bridge) shipped | Founder | 2027-05-31 | Conditional on Phase 2 |

**Critical path**: gates 4 and 8 are the load-bearing decisions. Missing either cancels everything downstream — and that's the *intended behaviour*.

---

## 7) Cost and operations (with real numbers)

### Engineering cost (one-time)

- Phase 1 (MVP): 200 hours @ founder time = opportunity cost of ~1 month
- Phase 2 (AI): 80 hours
- Phase 3 (growth): 60 hours
- Total: ~340 hours of focused work

### Infra cost (ongoing, monthly)

| Resource | At 100 users | At 1,000 users | At 10,000 users |
|----------|-------------|----------------|-----------------|
| Supabase (current Pro tier $25) | included | included | possibly $99 plan |
| Storage (image attachments, ~500KB avg) | <$1 | $5 | $50 |
| Resend (notification + digest emails) | included free tier | $20 | $200 |
| AI moderation (Gemini, ~$0.0001/post) | <$1 | $5 | $50 |
| AI features (summary, suggest, auto-tag) | $1 | $20 | $200 |
| **Total monthly delta** | **~$2** | **~$50** | **~$500** |

Cost is not the binding constraint. Moderation time is.

### Operational cost (ongoing)

- Moderation: 0.5h/day at 100 users → 2-3h/day at 1,000 users → 5+ FTEs needed at 10,000 users (this is NOT a side project at scale)
- Content seeding: 60-90 hours (one-time, before Phase 1 launch)
- Weekly digest curation: ~30 min/week (mostly automated)

---

## 8) Risk register (Australia-specific)

Formal Likelihood × Impact format. Likelihood: L=Low / M=Medium / H=High. Impact: L=annoyance / M=material setback / H=existential.

| # | Risk | Likelihood | Impact | Owner | Mitigation Strategy |
|---|------|:---:|:---:|-------|---------------------|
| R1 | Defamation lawsuit from a named builder | M | **H** | Founder | Published takedown policy + 24h SLA, AI pre-screen blocks builder-naming without evidence link, soft-delete audit trail, professional indemnity insurance ($800-1500/yr), `community_moderation_actions` audit table |
| R2 | Builder-shill astroturfing (fake positive reviews) | **H** | M | Founder | Verified-homeowner badge gating posts about specific builders, AI moderation prompt explicitly tests for unverified positive reviews, upvote-only (no downvote brigading), no DM features, weekly "suspicious accounts" report |
| R3 | Spam (lawyers cold-soliciting, competing trades, scrapers) | **H** | M | Founder | reCAPTCHA v3 on first 3 posts, per-user + per-IP rate limits, link-spam regex (max 2 external links), AI moderation classification |
| R4 | Empty community at launch (low content density) | **H** | **H** | Founder | 80 anchor threads seeded BEFORE public launch, 3 weekly Q&A team posts for 60 days, kill criteria documented (< 5 organic posts/week at day 60) |
| R5 | Solo-founder moderation overload past ~200 posts/day | **H** | **H** | Founder | AI moderation first-pass (Gemini), Phase 2 trust levels reduce held-for-review queue, Phase 3 community moderator program |
| R6 | Conversion lift fails to materialise | M | M | Founder | UTM tracking from signup, cohort analysis (community-active vs control), kill criteria if Phase 1 +0% conversion lift after 60 days |
| R7 | Privacy Act breach via user posting third-party info | M | M | Founder | Community Rules ban third-party identifying info, takedown SLA + form, AI moderation flags PII patterns (names + addresses + phone numbers) |
| R8 | ACCC investigation under testimonial / misleading-conduct laws | L | M | Founder | Disclaimer "user opinions, not advice", ban on incentivised reviews, no paid promotional content |
| R9 | r/AusRenovation does this better and we can't differentiate | M | M | Founder | Three structural differentiators Reddit can't match: verified-homeowner badge gated to active project, AI features (similar-thread, summary, Pro Site Supervisor), state-scoped feeds |
| R10 | Insurance premium spikes after first incident | M | M | Founder | Maintain audit log + takedown SLA evidence, build relationship with broker, budget for 50% premium increase year 2 |
| R11 | Spam attack overwhelms reCAPTCHA / rate limits | M | M | Founder | Cloudflare-style edge filtering via Netlify Edge, AI moderation as second line, lockdown mode (require email verification + 7-day account age) for emergency |
| R12 | Schema v45 migration breaks production on rollout | L | **H** | Founder | Test in Supabase staging, idempotent migrations (`IF NOT EXISTS`), rollback plan documented, deploy outside business hours |
| R13 | AI moderation false-negative lets defamation through | M | **H** | Founder | AI is *first pass only*; user reports are mandatory second line; manual mod review of ALL builder-name mentions for first 90 days; insurance covers gap |
| R14 | "Verified homeowner" gate is too strict, kills engagement | M | M | Founder | Allow non-verified posts to most categories; only state-specific dispute threads gated; bridge with "I'm researching" badge for pre-build users |
| R15 | Founder burnout from moderation + content seeding | **H** | **H** | Founder | Time-box moderation to 2h/day max; cancel feature if exceeds; budget for $30/thread writer ($2,400-4,000) for anchor content; consider AI-assisted seeding |

**Critical path risks (must mitigate before launch)**: R1, R4, R5, R12, R15.
**Insurance-covered risks**: R1, R7, R8, R10 (professional indemnity + media liability bundle ~$1,200-1,800/yr — non-negotiable).

### Insurance

Strongly recommend professional indemnity + media liability insurance before community launch. ~$1,200-1,800/year for SaaS at this scale. Non-negotiable for an Australian builder-dispute community.

---

## 9) Measurement and experiment plan

Instrumentation (extends existing GA4 + Sentry setup):

```
community_thread_created           { thread_id, category, state_code, build_stage }
community_post_created             { thread_id, post_id, depth }
community_reaction_cast            { entity_type, entity_id }
community_report_submitted         { reason }
community_thread_viewed            { thread_id, source: 'feed'|'search'|'direct'|'email' }
community_to_trial_click           { thread_id }
community_to_paid_conversion       { thread_id, days_since_first_view }
community_create_defect_clicked    { thread_id }   // unique conversion event
community_ai_summary_viewed        { thread_id }
community_ai_supervisor_consulted  { thread_id }   // Pro-only feature
```

Weekly admin dashboard (extends existing admin page):
- WAU in community (visitors, posters, reactors)
- Threads created, replies created, reaction velocity
- Median time to first reply
- Unresolved-thread ratio (threads >7 days old, no replies)
- Moderation queue depth + median resolution time
- AI moderation pass/flag/block ratio
- Trial conversion lift: community-active cohort vs control
- Top 10 highest-converting threads (these are evergreen content)

A/B test (only after baseline established):
- Show vs hide "Discuss with the community →" CTA on /red-flags landing page → measure trial conversion delta

---

## 10) Go/No-Go recommendation (revised, stage-aware)

**Recommendation as of 2026-04-25 (zero customers): NO-GO on native build. GO on Phase -1 + Phase 0 only.**

Specifically:
- **GO immediately**: Phase -1 (Option F — be visible in existing communities). Already executing via [scripts/red-flags-distribution.md](../scripts/red-flags-distribution.md).
- **GO in 60-90 days**: Phase 0 (Option D — launch r/HomeGuardianAU). Cheap, fast, validates demand without engineering.
- **CONDITIONAL GO at month 4-6**: Phase 1 native MVP (Option C — hybrid) **only if** the validation gates in §6 are met.
- **NO-GO on Phase 2+ Discord bridge** until native baseline is stable.

### Why this is more honest than v1

v1 said "GO with Hybrid". v1 was right about the architecture (Hybrid is the right model long-term) but wrong about the timing. Building native community for zero users is one of the most common pre-launch SaaS failures.

The validation-first phasing:
- Costs $0 in Phase -1 / 0
- Tells us within 90 days whether the audience exists
- Gives us seed content (real questions answered in real communities) to migrate later
- Lets us kill the project cleanly if validation fails — no built infra to rationalise keeping
- Frees engineering time for higher-leverage work in months 0–3 (which is what?)

### What to do with the freed engineering time (months 0-3)

If we're not building community, the highest-leverage work for a zero-customer SaaS is:
1. Day-3/7/14 nurture cron for /red-flags signups (we built the schema, never wired the cron) — direct trial conversion
2. Referral system (each subscriber gets a unique link, refer 3 friends → 14-day trial)
3. UTM-aware analytics dashboard (which marketing channels actually convert)
4. More blog posts on long-tail dispute queries (each one is an SEO landing for life)
5. Google Ads pilot ($30-50/day on dispute keywords)

All of these have higher expected ROI than community at zero customers.

---

## 11) Definition of done (per phase)

**Phase -1 done when**:
- 30 TikTok scripts posted
- 10+ Reddit answers posted in genuine threads (not promotional)
- 10+ Facebook group posts in 3+ groups
- ≥ 500 /red-flags PDF signups
- ≥ 50 trials started attributable to lead-magnet funnel

**Phase 0 done when**:
- r/HomeGuardianAU live with ≥ 100 subscribers
- ≥ 20 monthly active posters
- ≥ 3 PDF signups attributable to subreddit
- Subreddit moderation rules + bot live

**Phase 1 (native MVP) done when**:
- Migration v45 applied, all 9 tables live with RLS
- All routes ship with metadata + JSON-LD
- 80 anchor threads seeded
- Reports + admin queue working
- AI moderation pass-rate ≥ 80% (validated against manual sample)
- Verified-homeowner badge live
- Image attachments work via Supabase storage
- Community Rules + takedown policy published at `/guardian/community/rules`
- Professional indemnity insurance active
- Analytics events flowing to GA4
- Trial conversion lift measurable (no value yet, but instrumentation works)

**Phase 2 (AI features) done when**:
- Similar-thread suggestions work in composer
- Threads ≥ 10 replies show AI summary
- Auto-tagging suggests state + stage with ≥ 70% accuracy
- Pro-tier "AI Site Supervisor" sub-forum gated by `checkProAccess()`

**Phase 3 (growth + Discord) done when**:
- Follow + notification system live
- Weekly digest cron extended to community
- Discord bridge optional, role sync working for `guardian_pro`
- Trust levels + community moderator program active

---

## 12) Decision matrix (TL;DR for the next 30 days)

| Action | Recommendation | Effort | Risk if skipped |
|--------|---------------|--------|-----------------|
| Continue Phase -1 (existing-community presence) | **DO NOW** | Marketing time | High — main current acquisition channel |
| Wire day-3/7/14 nurture cron for /red-flags | **DO NOW** | 4-6 hours | High — schema's already shipped, missing the cron is wasted infra |
| Launch r/HomeGuardianAU | **DO IN 60 DAYS** | 1 day setup | Medium — defers validation gate |
| Native community MVP | **WAIT FOR VALIDATION** | 200+ hours | High — building too early is the #1 community failure mode |
| Discord server | **WAIT** | 1 day | Low — wrong audience for now |
| Discourse self-hosted | **DON'T** | 1 week | Low — neither/nor of native vs subreddit |

---

## 13) Reuse map — what we'd build vs what already exists

If/when we do build native community, here's what we get for free from existing infrastructure:

| Need | Existing reuse | New code |
|------|---------------|----------|
| Auth, sessions, OAuth | [src/lib/supabase/server.ts](../src/lib/supabase/server.ts), [client.ts](../src/lib/supabase/client.ts), middleware | None |
| RLS pattern | [supabase/schema_unified.sql](../supabase/schema_unified.sql) policies | New policies for 9 tables |
| Tier gating | [src/lib/ai/rate-limit.ts](../src/lib/ai/rate-limit.ts) `checkProAccess()` | None |
| Admin auth | [src/lib/admin.ts](../src/lib/admin.ts) `isAdminEmail()` + `is_admin` column | None |
| Activity log audit trail | [src/lib/activity-log.ts](../src/lib/activity-log.ts) `logActivity()` pattern | New events for moderation actions |
| Toast / modal / button system | Existing components from P9-1 toast migration | None |
| Image upload + storage | [MobilePhotoCapture.tsx](../src/components/guardian/MobilePhotoCapture.tsx) pattern | Storage bucket setup |
| Realtime updates | [useRealtimeProject.ts](../src/lib/supabase/useRealtimeProject.ts) — adapt for thread reply notifications | Hook variant |
| AI provider + cache + quota | [ai/provider.ts](../src/lib/ai/provider.ts), [cache.ts](../src/lib/ai/cache.ts), [rate-limit.ts](../src/lib/ai/rate-limit.ts), [usage-log.ts](../src/lib/ai/usage-log.ts) | New routes for moderation + summary |
| Knowledge-base RAG + embeddings | `knowledge_base` table + pgvector | Similar-thread search query |
| Email send | Resend wired via cron routes (`weekly-digest`, `defect-reminders`, `idle-users`) | New digest route |
| HTML escape | `escapeHtml` pattern in [api/notifications/route.ts](../src/app/api/notifications/route.ts) | Reuse in templates |
| Rate-limit pattern | In-memory Map with windowed cleanup, see [export-pdf throttle](../src/app/api/guardian/export-pdf/route.ts) | New per-route limits |
| Admin moderation queue UI | [AdminSupportInbox.tsx](../src/components/guardian/AdminSupportInbox.tsx) | Adapt for thread reports |
| PDF export | [src/lib/export/](../src/lib/export/) pattern | "Export thread as evidence" feature |
| Cron infrastructure | [src/app/api/cron/](../src/app/api/cron/) all routes use Bearer secret + batch + timeout-safe | New `lead-nurture`, `community-digest`, `verified-homeowner-sync` |
| Sitemap + JSON-LD SEO | [src/app/sitemap.ts](../src/app/sitemap.ts), [BreadcrumbJsonLd.tsx](../src/components/seo/BreadcrumbJsonLd.tsx) | Add community URLs + DiscussionForumPosting schema |
| Email subscriber model | [email_subscribers](../supabase/schema_v44_lead_nurture.sql) — first_name, unsub_token, sequence_stage already shipped | Hook into community welcome flow |
| Lead magnet for top-of-funnel | [/red-flags](../src/app/red-flags/page.tsx) page + PDF + signup API | Drop community CTA into welcome email |

**~70% of the infrastructure exists.** The actual delta is: 9 schema tables, ~12 components, ~6 API routes, AI moderation prompts, seed content (80 threads, mostly writing not coding).

That makes the build feasible in the timeline above — but doesn't change the strategic conclusion that we should **validate demand before spending the 4 months**.

---

## 14) Use cases

Concrete user stories grounded in the actual stakeholder map (§3a). Each illustrates how a specific persona interacts with the community at a specific moment, and what conversion path (if any) follows.

### UC-1: The pre-pour panic search

> **Persona**: Sarah, NSW, signed her contract 4 weeks ago, slab pour scheduled for Friday.
> **Trigger**: 11pm Wednesday — drives past the site, sees the slab forms but no inspection booked.
> **Search**: Googles "footing inspection skipped Australia what to do".
>
> 1. Lands on `/blog/30-red-flags-your-builder-is-dodgy` (organic search rank — Red Flag #6 directly addresses this).
> 2. Mid-article CTA → grabs free PDF at `/red-flags`.
> 3. Welcome email arrives in 60 seconds with attached PDF + link to community thread *"Concrete poured before footing inspection — what to do"*.
> 4. Reads thread, sees 6 verified-homeowner replies + an AI Site Supervisor summary + the action steps from the PDF.
> 5. Posts her own reply asking "should I escalate to NSW Fair Trading tonight or wait until morning?".
> 6. Reply arrives within 4 hours from a verified homeowner who escalated 6 months ago.
> 7. Two days later: signs up for 7-day free trial to log the defect formally.
>
> **Conversion event**: thread → trial. **Time from search to trial**: ~3 days.

### UC-2: The post-handover defect dispute

> **Persona**: Michael, VIC, handover was 3 months ago, finding cracks. Builder ghosting him.
> **Trigger**: Wants ammunition before lodging with Consumer Affairs Victoria.
> **Search**: Googles "builder won't respond defects warranty period VIC".
>
> 1. Lands on community thread (state-scoped: `/guardian/community/state/VIC`).
> 2. Sees 14 similar threads — verified homeowners who escalated to VCAT, with outcomes.
> 3. Reads the AI summary: "Most successful claims included independent structural engineer's report ($600-1,200), numbered defect log, and 21-day written notice".
> 4. Posts his own thread asking for engineer recommendations in Geelong.
> 5. Verified homeowner replies with 2 names + their experience.
> 6. Clicks "Create defect from this thread" CTA → his existing project gets the defect logged.
> 7. Three weeks later: shares his successful VCAT outcome back in the same thread, helping the next person.
>
> **Conversion event**: thread → existing-user retention + advocacy. **Engagement loop**: closed.

### UC-3: The "research mode" pre-contract visitor

> **Persona**: Priya and David, QLD, looking at builder quotes, haven't signed anything yet.
> **Trigger**: One quote is $50K cheaper. Want to know if that's a red flag.
> **Search**: Googles "cheap builder quote suspicious Australia".
>
> 1. Lands on Reddit answer R8 from `scripts/red-flags-distribution.md` (we posted in r/AusRenovation 3 weeks ago).
> 2. Clicks through to `/red-flags` PDF landing.
> 3. Downloads PDF. Reads it on the train.
> 4. Visits community to ask: "Is 30% provisional sums always a red flag, even for a small build?".
> 5. Verified homeowners reply with their experiences across price points.
> 6. Bookmarks the community for later. Doesn't sign up yet.
> 7. Six weeks later, after signing the contract: returns to community, signs up for free tier to log first defect.
>
> **Conversion event**: research → email signup → delayed user activation. **Time horizon**: 6+ weeks.

### UC-4: The Pro-tier "AI Site Supervisor" sub-forum

> **Persona**: Emma, NSW, mid-build, Pro subscriber for 4 months.
> **Trigger**: Frame inspector's report flags 3 issues she doesn't understand technically.
> **Action**: Opens Pro-only sub-forum, posts the inspector's report PDF + her question.
>
> 1. AI Site Supervisor replies within 5 minutes with a structured analysis (uses `getSmartModel()` + RAG over `knowledge_base`).
> 2. Reply explains each issue, severity, what action to demand from builder, NCC clauses cited.
> 3. Other Pro users add real-world context.
> 4. Emma uses the AI reply directly in her email to the builder.
> 5. Renews Pro subscription specifically because of this feature ("worth $14.99/mo for that one reply alone").
>
> **Conversion event**: feature use → renewal + word-of-mouth. **Pro retention driver**: validated.

### UC-5: The hostile builder attempt (defended)

> **Persona**: A builder whose business has been mentioned in 3 negative threads.
> **Trigger**: Wants to bury complaints with fake positive reviews.
> **Action**: Creates 5 fake accounts over a week, tries to post.
>
> 1. AI moderation flags accounts: similar IP range, no project, posts only about the same builder.
> 2. New-account 24h posting cooldown blocks 4/5 attempts immediately.
> 3. The 5th post (writing positive review of the builder) gets AI-flagged for "unverified positive review of named builder" → held for manual review.
> 4. Founder reviews in next moderation queue check (within 24h), sees pattern, suspends all 5 accounts, logs in `community_moderation_actions`.
> 5. Original negative threads remain visible, weighted higher by AI summary highlighting "verified homeowner experiences vs unverified opinions".
>
> **Defence outcome**: 5 fake accounts blocked, audit trail intact for legal defence.

---

## 15) Action items

Concrete next steps, ordered by sequence and owner. Update this list after every founder review.

### Immediate (this week — by 2026-05-02)

- [ ] **Founder**: Wire `lead-nurture` cron route at `src/app/api/cron/lead-nurture/route.ts` — sends day-3 / day-7 / day-14 emails to `/red-flags` signups. Schema v44 already has `sequence_stage` + `last_email_at`. (4-6 hours)
- [ ] **Founder**: Add the cron schedule entry to Netlify scheduled functions list (already established pattern from `weekly-digest`)
- [ ] **Founder**: Begin Phase -1 distribution — post first TikTok script, post first 2 Reddit answers, first Facebook group post (using [scripts/red-flags-distribution.md](../scripts/red-flags-distribution.md))

### Short-term (next 30 days — by 2026-05-25)

- [ ] **Founder**: Track UTM-tagged signups by source — add a UTM capture column to `email_subscribers` (schema v45a, ~10 mins) so attribution is queryable
- [ ] **Founder**: Set up basic GA4 dashboard tracking `/red-flags` page → trial conversion
- [ ] **Founder**: Pitch 3 Australian build-vlog YouTubers for $500 sponsorship trial — measure CPA
- [ ] **Founder**: Reach 100 PDF signups (validation milestone)

### Medium-term (60-90 days — by 2026-07-31)

- [ ] **Founder**: Reach 500 PDF signups (validation gate 1)
- [ ] **Founder**: Reach Phase 0 readiness — research subreddit naming, draft community rules, set up r/HomeGuardianAU once gate 1 passes
- [ ] **Founder**: Quote professional indemnity insurance brokers in advance (Hiscox, BizCover, Marsh)

### Conditional on Phase 0 success (by 2026-10-31)

- [ ] **Founder**: r/HomeGuardianAU 100+ subscribers (validation gate 2)
- [ ] **Founder**: Document anchor-thread spec — title format, body template, category schema
- [ ] **Founder**: Hire writer for 80 anchor threads OR commit founder weekends to Q4 2026

### Conditional on Phase 1 begin (by 2027-01-05)

- [ ] **Founder**: Schema v45 migration written + reviewed
- [ ] **Founder**: Activate professional indemnity + media liability insurance
- [ ] **Founder**: Publish Community Rules at `/guardian/community/rules`
- [ ] **Founder**: Soft-launch native MVP to PDF subscriber list before public announcement

### Continuously (every week)

- [ ] **Founder**: Review marketing channel CPA → kill bottom-2, double down on top-2
- [ ] **Founder**: Review moderation queue (when community ships) — must be < 24h SLA
- [ ] **Founder**: Update this document's Changelog when scope changes

---

## Appendix A — Differences from v1

| Section | v1 → v2 change |
|---------|----------------|
| Reality check | Added (was missing) |
| §2 Metrics | Replaced abstract WAU% targets with stage-aware targets that respect zero-customer reality |
| §4 Options | Added Subreddit, Discourse, "Embed in existing comms" |
| §5 Recommended path | Replaced single recommendation with 3-phase validation-first plan |
| §5.6 AI features | New section — primary differentiation vs alternatives |
| §5.7 Cold-start strategy | New section — addresses #1 community-failure mode |
| §6 Delivery plan | Added Phase -1 + Phase 0 validation gates |
| §7 Cost | Added monthly $ table at 3 user-count tiers |
| §8 Risks | Added Australian defamation as HIGH severity, added builder-shill defence |
| §10 Recommendation | Changed from "GO Hybrid" to stage-conditional GO |
| §12 Decision matrix | New — 30-day actionable summary |
| §13 Reuse map | New — explicit cross-reference to existing files |

## Appendix B — Open questions for the founder

1. **What's our risk appetite for defamation exposure?** Without media liability insurance, a single lawsuit could end the company. Is the community worth that even at 1% probability?
2. **Are we willing to commit to daily moderation for 12+ months?** That's the operational floor for keeping the community alive *and* defended.
3. **If validation fails (gates in §6 missed), will we actually kill the feature?** Sunk-cost bias is real. Decide the kill criteria now, not later.
4. **Do we have a content writer who can produce 80 anchor threads?** If not, who? Founder time? Hired writer ($30-50/thread × 80 = $2,400-4,000)?
5. **Is /red-flags + nurture + Google Ads going to deliver more $/hour than building community?** Honestly, almost certainly yes for the first 12 months.

---

## Changelog

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-04-25 (earlier draft) | Founder | Initial feasibility study — 3-option comparison (native / Discord / hybrid), generic SaaS metrics, 4-6 week build estimate, "GO Hybrid" recommendation. |
| 2.0 | 2026-04-25 | Claude (founder review) | Full app-grounded rewrite. Added: Reality Check (zero customers), 3 new options (subreddit, Discourse, embedded comms), cold-start metrics, 5.6 AI-first features, 5.7 cold-start strategy, Australian legal exposure (defamation, ACCC, Privacy Act), real $ cost model, builder-shill defence, validation-first phasing, decision matrix, reuse map cross-referencing existing code. Recommendation changed from "GO Hybrid" to stage-conditional GO. |
| 2.1 | 2026-04-25 | Claude (deep-research review) | Added per deep-research-report feedback: Executive Summary, Table of Contents, §3a Stakeholder Roles table, §6a Timeline & Milestones with target dates, §8 reformatted as formal Risk Register (Likelihood × Impact), §14 Use Cases (5 personas), §15 Action Items checklist, this Changelog. Document is now ~1,000 lines, ready for stakeholder review. |

> **How to update this changelog**: when any section materially changes, increment the patch version (2.1 → 2.2), add a row, summarise what changed and why. The doc is intentionally long — readers can use the TOC to navigate. Don't trim sections to "look shorter" — completeness is the value here.
