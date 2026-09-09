# 19 — Usability & Value Guide

> **Purpose**: the two findings from the 2026-09-09 user-perspective review that the owner
> agreed with — *why would anyone use it* and *is it easy to use* — turned into changes
> that are feasible in **this** codebase: each with the files it touches, an honest effort
> for one developer, a sequence, and the number that tells you whether it worked.
> Everything here re-cuts or re-words what already exists. Nothing needs a rebuild.
>
> **Date**: 2026-09-09 · **Companion**: `18-BACKLOG.md` B-19 → B-23 are the tickets; this is
> the "how" · **Status**: proposal — nothing in this file is built yet.

---

## 0. The thesis

An owner does not use a build-tracking app weekly. They open it at **the moments that cost
money**: when a progress claim lands, at each inspection point, when a variation is
proposed, and at handover — six to ten times in a build. Every one of those moments is
about the same question: *should I pay this, and can I prove why?*

So the organising idea is **the next claim**: what it is (stage, %, dollars), what must be
true before paying it (certificates, inspections, open defects), and the paper trail that
proves it. Build the product around that loop; make everything else reachable but
optional.

Three facts about the current build that this guide keeps returning to:

1. **The best feature makes the worst first impression.** `ShouldIPay.tsx` derives its
   verdict from `payments`, `certifications`, `inspections` and `defects`. All four are
   empty on day one, so a brand-new project's first verdict is **"DO NOT PAY"** — for
   having done nothing yet.
2. **Free users have the money loop and are told they don't.** `PricingClient.tsx` lists
   "No certification gates · No payment milestones · No Should I Pay?" under Free, but
   `projects/[id]/page.tsx` gates no tab by tier and the money components carry no Pro
   check. The copy hides the product's own aha from the people who most need to see it.
3. **Most of the machinery exists.** Stage-aware "What To Do Now" cards in
   `SmartDashboard.tsx`; per-stage `inspections`, `certificates`, `paymentPercentage` and
   `dodgyBuilderWarnings` in `australian-build-workflows.json`; "Site Visit Request" and
   "Payment Query" templates in `MessageTemplates.tsx`; `payments.due_date`; crons for
   digests and reminders; a `/tools` catalogue that ranks on Google. This is re-cutting,
   not building.

---

## 1. Why would anyone use it? — value

### 1.1 Lead with the money loop
**What**: the landing page, the first three feature cards, the pricing page and the first
screen after signup all say the same thing: *know exactly what to check before you pay
each progress claim, and keep the proof.* AI becomes a supporting line, not the headline.
**Why**: the current H1 is "AI-Powered Australian Construction Tracker". Nobody searches
for a tracker; they search "should I pay my builder's progress claim" and "what
certificates before frame stage payment". The feature that answers that is on the page
already — as card eight.
**How**: `src/app/guardian/page.tsx` hero + feature order; `PricingClient.tsx` copy;
`GuidedOnboarding.tsx` step 1 (see 2.4). Keep every existing feature; reorder and reword.
**Effort**: 1 day. **Measure**: landing → signup rate; "Should I Pay" card click-through.

### 1.2 Make the first verdict the aha, not an accusation
**What**: after the project wizard, land on a **"Your next claim"** screen instead of the
dashboard: *Frame stage · 20 % · $130,000. Before you pay it you should have: Frame
inspection (done? ☐), Plumbing rough-in certificate (uploaded? ☐), no open structural
defects.* Then the same `ShouldIPay` logic in a **pre-flight** framing — "Not ready to pay
yet: 2 of 3 items missing" — instead of "DO NOT PAY" in red.
**Why**: fact 1 above. The verdict is the product; the current first run punishes the
user for being new.
**How**:
- `projects/new/page.tsx`: add one question to step 2 — *Where is the build now?* (stage
  select from the seeded list; default "Not started"). On create, mark earlier stages
  `completed` and the chosen one `in_progress` (`updateStageStatus` pattern already exists
  in `e2e/setup/supabase-seed.ts`, mirror it server-side).
- `ShouldIPay.tsx`: two copy modes keyed on whether the next milestone has a
  `certificates_required` list with nothing uploaded yet → *pre-flight checklist*; once
  any evidence exists → *verdict*. Same data, same rules.
- `SmartDashboard.tsx`: "Next claim" card at the top, above "What To Do Now".
**Effort**: 2 days. **Measure**: % of new projects that view a Next-claim/verdict screen
within 10 minutes of signup (target ≥ 70 %).

### 1.3 Let the free tier reach the aha — and say so truthfully
**What**: Free = one project, the whole money loop (stage gate, payment schedule,
Should I Pay rules), **unlimited defects and photos** for that project. Pro = the things
that cost money to serve or matter at dispute time: AI claim review, AI chat, tribunal
evidence pack, PDF exports, unlimited projects, team sharing, the 1 GB vault.
**Why**: fact 2. A real pre-handover list has 30–100 items; a 3-defect cap means the free
project is abandoned exactly when the evidence would start to matter. And the pricing
copy currently lies in the product's disfavour.
**How**: `PricingClient.tsx` bullets; `supabase/schema_v52_free_tier_reshape.sql` —
drop the defect trigger from v42 and the variation trigger from v41 (keep v51's 1-project
cap); `src/lib/rate-limit.ts` unchanged (Pro checks already sit on the AI/export routes).
Update the E2E cap test (`guardian-ai.spec.ts` tier block, B-11 note in `18-BACKLOG.md`).
**Effort**: half a day + one migration. **Measure**: free → verdict → Pro conversion at
the first *real* claim; support tickets about caps (should go to zero).

### 1.4 A front door that needs no account: the Progress Claim Checker
**What**: a public page at `/tools/progress-claim-check`: *State · Contract sum · Stage
the builder is claiming for · Amount claimed* → *Expected % and $ for that stage in your
state · Certificates you should hold before paying · Inspections that should have
happened · Three questions to ask the builder* → "Save this as a project" (signup).
**Why**: this is how people will *find* the product. The site's `/tools` catalogue already
ranks; the calculations are client-side and already written; nobody else in Australia
offers this without a login. It answers the exact query an anxious owner types at
10 pm with a claim in their inbox.
**How**: new `src/app/tools/progress-claim-check/page.tsx` (+ `layout.tsx` for metadata,
mirror `tools/migraine-tracker`); register in `src/data/tool-catalog.ts` and
`tool-metadata.ts` (sitemap picks it up); data from `australian-build-workflows.json`
(`paymentPercentage`, `certificates`, `inspections`, `depositPercentage`) and
`getInsuranceConfig` / `getLicenseVerificationUrl` from `calculations.ts`. Show the
B-16 disclaimer and the "verified" date. Track with `trackToolUse("progress-claim-check")`.
**Effort**: 1–2 days. **Measure**: tool views → signups; search impressions for the
target phrases in Search Console after 6 weeks.

### 1.5 Change the stance, keep the content
**What**: the product's job is to make the owner *the client whose paper trail is
complete*, not to catch a crook. Rename, don't remove: "Dodgy builder warnings" → **"What
to check at this stage"**; "Red Flags" tab → **"Watch-outs"**; "Escalate Builder" →
**"Formal notices"**; "Tribunal Pack" → **"Evidence pack"**. Landing and onboarding copy
drop "dodgy". Blog: keep slugs (SEO), soften H1s where they call the reader's builder a
crook before anything has gone wrong.
**Why**: 18 × "dodgy", 29 × "red flag", 51 × "tribunal", 57 × "dispute" on the landing
page and blog. The owner needs this builder for forty weeks. An adversarial tool gets
abandoned — or makes the build worse. Evidence is neutral; the same features sell better
as good-client hygiene.
**How**: labels in `projects/[id]/page.tsx` (`SECTIONS`/tab map), `SmartDashboard.tsx`
(`dodgyWarnings` UI heading only — JSON key stays), `src/app/guardian/page.tsx`,
`GuidedOnboarding.tsx`; `e2e/guardian-full-workflow.spec.ts` `TAB_ALIASES` for the
renamed tabs.
**Effort**: 1 day. **Measure**: qualitative in the beta ("did you show this to your
builder?"); nothing quantitative.

### 1.6 Fit what owners are actually allowed to do
**What**: an in-app **"Your rights on site"** panel per state (reasonable times, reasonable
notice, WHS, don't direct trades — written with hedges, sourced, dated), the existing
"Site Visit Request" template surfaced next to it, and a cadence that matches reality:
**stage points**, not weeks. Weekly check-ins become optional notes; the onboarding step
that pushes them goes (2.4).
**Why**: under standard HIA/MBA contracts the builder has possession of the site. The
blog says this; the product assumes continuous access (weekly check-ins, GPS site diary,
materials register). Reframe "tracking" from the site to the money and documents the
owner fully controls.
**How**: new `RightsOnSite.tsx` in the Build section, content as a `siteAccess` block per
state in the workflow JSON (start from `red-flags-pdf.ts` item "refuses inspection access"
and the blog paragraphs); link to `MessageTemplates` "Site Visit Request".
**Effort**: 1 day + content verification (legal hedge, B-16 dates). **Measure**: none
quantitative; beta interviews.

### 1.7 Bring the builder into the loop (phase 2)
**What**: "Send this list to your builder" — a read-only page or email listing the
certificates and inspections requested for claim #N, generated from the stage gate.
**Why**: the owner's leverage works best when the builder sees the same checklist early
and calmly, not as a surprise refusal at payment time.
**How**: reuse the share infrastructure behind `ShareProgressCard.tsx` / project members
(read-only token link). **Effort**: 2 days. **Measure**: % of claims where the list was
sent before payment.

---

## 2. Is it easy to use? — usability

### 2.1 Give Guardian its own chrome
**What**: inside `/guardian/*`, no "Tools · Games · Blog", no ad slots, no achievement
toasts. A minimal header: logo, project switcher, account. The public site keeps its own
navigation.
**Why**: someone about to pay a $650k builder is looking at a "Games" link. Trust is the
whole product.
**How**: `src/components/Navbar.tsx` already uses `usePathname()` — return the Guardian
header for `/guardian` paths; confirm `/guardian` is **not** in `AD_ENABLED_PREFIXES`
(`GlobalAdSlots.tsx:26`) and remove it if it is; `src/app/guardian/layout.tsx` is the
natural home for a `GuardianHeader`. Footer trimmed to legal links.
**Effort**: half a day. **Measure**: n/a — check that no AdSense request fires on
`/guardian/*` (the E2E console check already collects requests).

### 2.2 Re-cut the five sections around the loop
**What**: keep five sections (users have muscle memory for the bar), but make one of them
**Pay**, and fold "Issues" into the others:

| Section | Tabs (in order) |
|---|---|
| **Home** | Next claim · What to do now · Watch-outs |
| **Build** | Stage Gate · Stages · Inspections · Certificates · Pre-handover · Rights on site |
| **Pay** | Progress claims (Payments) · Should I Pay · Claim Review · Variations · Budget · PC/PS |
| **Evidence** | Photos · Defects · Documents · Messages (Comms) · Site visits |
| **More** | everything else, grouped: Reports & exports · Tools · Team · Settings |

**Why**: the money features are scattered today — Payments, Claim Review and Budget under
More; Variations under Issues; Should I Pay on the dashboard. A user cannot find the loop
because it isn't a place.
**How**: one file — `SECTIONS` and the tab map in `projects/[id]/page.tsx`; update
`TAB_SECTION` in `e2e/guardian-full-workflow.spec.ts` (the state-fidelity tests will
catch a missed rename). "Red Flags", "Disputes" → Home/More as above.
**Effort**: 1 day including the E2E map. **Measure**: time from project open to a Pay tab
(should fall); "More" grid usage (should fall).

### 2.3 Make "More" a grouped, searchable drawer
**What**: group the 23 low-frequency tools by job (Money · Records · Reports · Setup), show
the six most recently used first, and wire the existing Ctrl+K search to tool names.
**How**: the `more_grid` render in `projects/[id]/page.tsx`; the global search index
already exists (Ctrl+K) — add tool labels as a result type. **Effort**: half a day.

### 2.4 Onboarding: three outcomes, not five chores
Replace the five steps in `GuidedOnboarding.tsx` (AI helper · verify licence · settings ·
upload contract · weekly check-ins) with three outcomes:

1. **Know your next claim** — done automatically by 1.2; the step just points at it.
2. **Verify the builder and their insurance** — the (now working) state licence link
   and an upload slot for the insurance certificate: the two documents that matter before
   the deposit. (`getLicenseVerificationUrl`, `STATE_INSURANCE` in `calculations.ts`.)
3. **Capture your first evidence** — one photo or defect via the camera FAB.

AI appears where it is useful (defect description, claim review), not as a step.
**Effort**: half a day. **Measure**: onboarding completion (target ≥ 60 % in the beta).

### 2.5 Cut hand-entry to what the moments need
Eleven forms is the cost side of the product; each of these removes one or makes it
automatic.

| Change | How | Effort |
|---|---|---|
| **Stage-based prompts** replace weekly check-ins | "What To Do Now" in `SmartDashboard.tsx` is already stage-aware; add a "claim due" prompt from `payments.due_date` and let the wizard's stage answer drive it | 1 day |
| **Share-to-Guardian** from the phone | PWA `share_target` in `public/manifest.json` (POST, `multipart/form-data`) → `src/app/guardian/share/route.ts` creates a draft photo/defect/message on the active project. Cookies travel with the share navigation, so auth works as normal | 2 days |
| **Paste an email** | Messages tab: paste → parsed date/sender/subject into a comms entry (no inbound email needed) | half a day |
| **Claim-due reminder** email | new `netlify/functions/cron-claim-due.mts` + `api/cron/claim-due` using `payments.due_date` 7 and 2 days out, listing what should be in hand (same data as 1.2). Pattern: `cron-defect-reminders` | half a day |
| **Import what the builder sends** | contract parser, inspector-report import and CSV import already exist — surface them at the moment they apply (contract → deposit step; inspection report → Build section) rather than under More | half a day |

**Measure**: entries created per active project per week without a form submit (share /
paste / import share of all entries).

### 2.6 Remove gamification
Achievement toasts and the locked-badge grid (`MilestoneCelebrations.tsx`) off by default
behind a setting. Keep the health score as **"Build health"** with its four sub-scores
explained in one line each. **Effort**: 1 hour.

### 2.7 Speak the owner's language
"Payment milestones" → **Progress claims**; "Certifications" → **Certificates**; "Comms" →
**Messages**; "Tribunal Pack" → **Evidence pack**; "Variations", "Defects", "Stage" stay —
they are the words on the contract. `TAB_ALIASES` in the E2E spec absorbs the renames.
**Effort**: half a day.

### 2.8 Empty states that say *when*
Every tab's empty state names the moment it becomes useful ("You'll use this at frame
stage, when the first big claim arrives") and offers the one action that starts it. The
no-fake-data spec already asserts empty states exist; this is a copy pass over them.
**Effort**: 1 day.

### 2.9 Prove the loop on a phone
The loop is used on site, on a phone. Add a `Mobile Chrome` project (375 px) to
`playwright.prod.config.ts` that runs only the loop tests (Next claim → Stage Gate →
record a claim → photo via FAB → export). **Effort**: half a day.

### 2.10 The 7.7-second first load
`/guardian` took 7.7 s on a cold hit in the 2026-09-09 check. Dynamic-import the 23
"More" tools (`next/dynamic` in `projects/[id]/page.tsx`) so the loop tabs load first;
measure LCP before and after. **Effort**: 1 day. **Measure**: p75 LCP on `/guardian` and
the project page in GA4.

---

## 3. What not to do

- **Don't add features.** The list above removes or re-cuts; the only genuinely new
  surface is the public checker (1.4), and it is made of existing calculations.
- **Don't rebuild the project page.** `SECTIONS` + the tab map is the whole navigation
  model; it is one file.
- **Don't delete tools.** Hide, group, dynamic-import. Every tool has a moment; the
  problem is that they all look equally important.
- **Don't rename the brand before the beta.** B-24 is real but it is a distraction until
  ten people have used the loop.
- **Don't ship legal copy without B-16.** Disclaimer and verified dates first.

---

## 4. Sequence

**Phase 0 — before inviting anyone (≈ 6 working days)**
2.1 chrome · 2.2 sections · 2.4 onboarding · 2.6 gamification · 2.7 vocabulary ·
1.2 first verdict · 1.3 free tier + pricing truth · 1.5 copy · 1.6 rights panel ·
plus B-16 (disclaimer/dates), B-17 (stale figures), B-18 (roles honesty) from the backlog.

**Phase 1 — during the beta (3–4 weeks, alongside interviews)**
1.4 public checker · 2.5 prompts, share-target, claim-due reminders · 2.3 More drawer ·
2.8 empty states · 2.9 mobile loop test · 2.10 first load.

**Phase 2 — only after the beta shows people returning at claim time**
1.7 builder share · AI claim review from a photo of the claim · role enforcement (the
full version of B-18) · B-24 brand and domain.

---

## 5. Measurement — the only numbers that matter

Add one helper to `src/lib/analytics.ts` next to `trackToolUse`:

```ts
export function trackGuardian(event: GuardianEvent, params?: Record<string, string | number>) { … }
type GuardianEvent =
  | "project_created" | "next_claim_viewed" | "verdict_viewed"
  | "claim_recorded" | "certificate_uploaded" | "evidence_exported" | "returned_at_claim";
```

| Question | Event(s) | Beta target (10 owners) |
|---|---|---|
| Did they reach the aha? | `next_claim_viewed` ≤ 10 min after `project_created` | ≥ 7 of 10 |
| Did they use it for money? | `claim_recorded` with ≥ 1 `certificate_uploaded` before it | ≥ 5 of 10 |
| **Did they come back?** | `returned_at_claim`: any session within ±5 days of `payments.due_date` | **≥ 5 of 10** |
| Did the paper trail matter? | `evidence_exported` | ≥ 3 of 10 by handover |

`page_views` already records signed-in sessions (user, path, session) — enough to compute
"returned at claim" server-side against `payments.due_date` without GA4. The
`returned_at_claim` number is the one that decides whether to keep building.

---

## 6. The beta, concretely

- **Who**: 10 owners with a signed contract and a build between slab and lock-up, in one
  state (the one you can visit). Owner-builder and new-home Facebook groups, the HIA/MBA
  consumer pages, local building inspectors (they meet anxious owners every day and have
  no product to recommend).
- **Offer**: free for the whole build; in return, a 15-minute call after each claim.
- **Ask, every time**: What did you open the app for? What did you do instead of the app?
  Did you show anything to the builder? What would you have paid for this week?
- **Watch**: the four numbers in §5, and the unprompted messages — the feature people ask
  for at claim time is the roadmap.
- **Stop rule**: if fewer than 3 of 10 return at their next claim after Phase 0 and Phase 1
  are live, the problem is not usability and more building will not fix it.

---

## 7. Traceability

| Guide item | Backlog |
|---|---|
| 1.3 | B-20 |
| 1.5 | B-22 |
| 1.6 | B-21 |
| 2.1, 2.6 | B-19 |
| 2.2, 2.3, 2.5, 2.7 | B-23 |
| Prerequisites | B-16, B-17, B-18, B-25 |
| 1.7, 2.10, B-24 | phase 2 |
