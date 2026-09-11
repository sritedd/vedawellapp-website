# 18 — Live Backlog

> **This is the single live queue.** Everything still open from the 2026-08 live-prod
> E2E run plus older carry-overs, in the order I'd work them.
>
> **Convention** (same as `14-FULL-APP-REVIEW.md` §10.2): when an item is done,
> ~~strike the row~~ and append `✅ FIXED <date> (<commit>)` with a one-line note on what
> actually changed. Don't delete rows — the history is the point.
>
> **Status**: 3 open · 18 done · 4 partial · created 2026-08-11 · last worked 2026-09-11
>
> **Phase 0 of `19-USABILITY-AND-VALUE-GUIDE.md` is built** (fdb81ca → c69704e, 2026-09-09)
> **plus much of Phase 1** (9f5d762 → fc69a82, 2026-09-11): AI-busy copy, grouped More,
> the migration probe, the quarterly legal checklist, the 375px loop test and claim-due
> reminder emails. Verification on the live deploy: **104/104 passed, no failures, no flakes** (38 min, 2026-09-11) — the 8-state workflow, AI and no-fake-data suites against the live deploy. The first fully clean run of this suite.
>
> **⚠ One owner action gates the beta: run `supabase/schema_v52_free_tier_reshape.sql`.**
> Until then the pricing page promises unlimited defects and prod still caps at three.
> Other owner actions: Sentry DSN + `NEXT_PUBLIC_SITE_URL` on Netlify; the whole-build
> Stripe price (B-12); the stray worktree (B-15); repo secrets for the nightly E2E workflow.
>
> 2026-09-09 review verdict: **engineering GO, paid public launch HOLD.** The ten new
> P1-product items (B-16 → B-25) are why; B-16/17/18 gate any real user, the rest gate a
> paid launch. Recommended next move is a free private beta in one state, not features.
>
> Open: **B-10** (OCR for scanned PDFs — large), **B-12** (yearly Stripe price —
> owner, 15 min), **B-14** (gov-link backstop + 3 generic links) and **B-15**
> (stray worktree — owner's call). B-2 remains partial: it needs a real `pg_dump` of prod, which is
> not reachable from this machine.
>
> Closed already and NOT repeated here: the two P0 RLS outages (v47/v48), the AI
> quota outage, the PDF-worker CSP block, the contract-parser overwrite, the Stage
> Gate certificate blindness, public storage buckets (v49), and cert-ref
> normalisation (v50). See `17-E2E-PROD-RUN-PLAYBOOK.md` §8–15.

---

## How to work this list

1. Take the top open item. One item per commit.
2. **Verify against prod, not just the type checker.** Every P0 in this codebase
   passed `tsc` and looked fine in code review — they were only caught by driving
   the real app. A green build is not evidence.
3. Force the *actual* code path. The cert-ref fix nearly produced a false pass
   because the first test hit an UPDATE branch when the bug lived in INSERT.
4. Strike the row, record the commit, push.

---

## P1 — do these first

### ~~B-1 · `projects` INSERT policy still carries the self-referential pattern~~
✅ **FIXED 2026-08-14 (schema_v51 + b2053b5)** — cap moved to
`enforce_free_project_limit()` trigger; policy reduced to `auth.uid() = user_id`.
Verified on prod: the 2nd project is now blocked by **`FREE_TIER_PROJECT_LIMIT`
(trigger)**, not `row-level security` (policy), proving the self-reference is
gone while behaviour is unchanged. `verify-write-limits.mjs` extended to cover
projects + project-impersonation; results identical pre/post. The new-project
page maps the raw trigger message to a friendly one for the bypass path.

**Effort**: 30 min · **Risk if skipped**: latent repeat of a P0

`schema_unified.sql:838` still has `(SELECT count(*) FROM projects WHERE user_id = auth.uid()) < 1`
inside the `projects` INSERT policy — the exact shape that caused infinite
recursion on `defects` and `variations` (fixed in v48). It currently *works*
(measured: 1st project allowed, 2nd correctly blocked), which is why v48
deliberately left it alone during a hotfix.

But it's the same landmine. Convert it to a `BEFORE INSERT` trigger like
`enforce_free_defect_limit()` / `enforce_free_variation_limit()`, then simplify
the policy to `auth.uid() = user_id`.

**Verify**: free user creates 1st project ✅, 2nd blocked ✅, pro/trial/admin
unlimited ✅ — via `verify-write-limits.mjs` extended to cover projects.

### ~~B-2 · `schema_unified.sql` is stale~~
⚠️ **PARTIALLY DONE 2026-08-14** — full regeneration still needs a `pg_dump` of the
live DB (no direct SQL access from here), and hand-merging 16 migrations into
1100 lines would risk a *confidently wrong* file, which is worse than a visibly
stale one. Instead: a prominent staleness banner at the top naming the four
policy sets that no longer match production, plus **SECTION 8** consolidating the
current state of every v36–v51 change (helper functions, rewritten policies,
tier triggers, private buckets, the `required_for_stage` convention).
**Remaining**: regenerate wholesale from a real dump.

**Effort**: 1–2 h · **Risk if skipped**: wrong source of truth for every future migration

Missing everything from v36 onward. Anyone reading it to understand current RLS
gets a picture that is several P0s out of date — including the policies that were
just rewritten in v47/v48/v49/v50.

Regenerate from the live database rather than hand-merging the migration files,
then diff against the v1–v50 chain to confirm nothing was missed.

---

## P2 — worth doing, not urgent

### ~~B-3 · 9 of 17 audit actions never fire~~
✅ **FIXED 2026-08-14** — emitted actions go **8 → 13 of 17**. Added the four that
carry evidentiary weight:

| Action | Why it matters |
|---|---|
| `variation.signed` | the moment the homeowner accepted a cost change — a dispute about "did you approve this?" turns on this timestamp |
| `escalation.started` / `escalation.advanced` | proves the formal process was followed, and when each step was taken |
| `inspection.scheduled` | whether a stage was signed off *before* its mandatory inspection |
| `inspection.completed` | "passed on this date" is what a progress payment is justified against |

**Deliberately still not emitted (4)**, with reasons rather than as an oversight:
`project.created` / `project.updated` / `project.deleted` — the row's existence
already evidences these, and deletion cascades the log with it, so the entry
could never be read. `payment.created` — payment milestones are seeded at project
creation, not a user action; `payment.updated` (recording a payment) is the one
that matters and already fires.

**Effort**: 2 h · **Value**: tribunal evidence completeness

### ~~B-4 · AI spec fires faster than the rate limiter~~
✅ **FIXED 2026-08-24 — 4 passed/13 failed → 17/17 green.**

**My original diagnosis in this row was wrong.** I attributed the failures to the
per-user rate limiter and wrote a retry-on-429 helper; re-running produced the
*identical* 4/13. Looking at the failure artifacts instead of assuming: every
screenshot was the **login page**. `beforeAll`'s `login()` gave the redirect 10 s,
and against prod a Netlify cold start plus a Supabase auth round trip regularly
exceeds that — so `beforeAll` threw and every authenticated test in the file
failed while the product was healthy.

Fixes: wait for hydration before filling (a not-yet-interactive React form
silently drops the value and submits empty credentials), raise the redirect wait
to 45 s, and throw a real diagnosis instead of a bare timeout. Same racy login
existed in `guardian-full-workflow.spec.ts` and was fixed there too.

The `postAI()` retry helper was kept — it is correct and cheap (only pays when a
429 actually fires), just not the blocker.

Last failure was a genuinely stale assertion: `builder-check` short-circuits to
**503 `comingSoon` ABOVE input validation**, so a Pro user never sees 400. Test
now asserts `[403, 503]` and would fail loudly if the feature were re-enabled
without revisiting it.

**Effort**: 45 min

### ~~B-5 · 4 workflow-spec failures~~
✅ **FIXED 2026-09-08 (fc56e01) — NSW 9/9 green.** Three separate causes, none of
them product defects:

1. **Per-test timeout.** The prod config had no explicit `timeout`, so the 30 s
   default applied while the spec's login wait is 45 s. Tests were killed
   mid-login and reported "Login did not complete" for logins that *had*
   succeeded — the error even named the dashboard URL it reached. This was also
   the entire source of the "flaky" results; at 120 s the flakiness vanished.
2. **Ambiguous `main` selector.** My earlier replacement for the dead
   `.min-h-[500px]` used `locator("main").last()`, but the layout has a `<main>`
   *and* the project page has one — `.last()` picked an empty one and returned 0
   characters. Now targets `main[aria-label="Project content"]` and **polls**
   until it has content rather than sampling the instant a tab is clicked.
3. **Hidden order dependency.** "Material, site visit, check-in" relied on an
   earlier test having called `seedProjectData`, so it could not be run in
   isolation and any reordering would have broken it silently. It now seeds its
   own fixture.

### ~~B-5b · 8-state run: 2 NSW failures that NSW-alone could not reproduce~~
✅ **FIXED 2026-09-08** — B-5 closed NSW at 9/9 *run on its own*. The full 8-state
suite then came back **70 passed / 1 failed / 1 flaky**, and both failures were in
NSW — the state that had just been declared green. Running a spec in isolation
does not prove it passes in the suite.

Neither was a product bug. Both were the same harness defect, and the artifacts —
not the error text — are what identified it:

| Test | What the snapshot actually showed | What it reported |
|---|---|---|
| Progress through stages | Page sat on **Home/Dashboard**; the Stages tab was never opened. The DB was correct ("3/8 stages done") | `toBeVisible failed` |
| Stage Gate renders | Project list was **empty** — "No Projects Yet" | `toBeVisible failed` |

`goToTab()` and `navigateToProject()` each returned a failure signal that **all 13
call sites discarded**. A failed navigation therefore left the test asserting
against whatever page it happened to be on, and the error named a missing element
instead of the navigation that never happened — pointing away from the cause.

Three fixes:

1. **Both helpers now throw**, naming what failed. `navigateToProject` lists the
   projects it actually saw, so an empty list says so rather than masquerading as
   a rendering fault.
2. **`openSection()` verifies the click landed.** The section strip is
   server-rendered, so its tabs are clickable *before* React hydrates — an early
   click hits a dead handler and silently does nothing. Under a full 8-state run
   the machine is loaded enough for that race to open, which is exactly why NSW
   passed alone and failed in the suite. It now checks `aria-selected` and
   retries (and accepts the click when the attribute is absent, rather than
   burning the retry budget on a control that will never report state).
3. **`cleanupE2EProjects()` is scoped per state.** It deleted *every* project
   matching `E2E %`, so one describe block's setup could destroy another's live
   project. Now `E2E NSW %`. Also added the missing `.error` check — it was
   swallowing read failures, against this repo's own database rule.

**Lesson for this backlog**: a test helper that reports failure by return value
rather than by throwing will, sooner or later, produce a failure report that
blames the wrong thing. Prefer throwing in test code.

### ~~B-5c · The "8-state" suite was testing NSW eight times~~
✅ **FIXED 2026-09-09 (7804a0a)** — the most consequential finding of this whole
E2E effort, and the suite reported **70/72 green** the entire time it was true.

`projects.state` is `TEXT DEFAULT 'NSW'` and `createTestProject()` never set the
field, so all 8 per-state describe blocks created **NSW** projects. Stage *names*
were still seeded per state from the workflow JSON, which is exactly why nothing
looked wrong: the stage assertions — the visible bulk of each state's tests —
passed legitimately, while every state-*dependent* branch ran as NSW eight times.

The clearest casualty is `getLicenseVerificationUrl()` in
`guardian/projects/[id]/page.tsx`: a `switch (state)` whose VIC, QLD and WA
branches **were never executed once**. The suite only ever reached `default:`.
Eight files read `project.state` (AI prompts, claim review, PDF export,
inspector-report parsing, overview, dashboard).

Fixes:
- `createTestProject()` sets `state: stateCode`.
- A new per-state test asserts the fixture really is that state at **both**
  levels: the stored column, *and* a state-dependent branch actually rendering
  (the licence-register link). A DB assertion alone would not have caught the UI
  half, and a UI assertion alone would not have explained why.
- Proven by disabling the seed fix and confirming the new test fails, rather than
  trusting a green run — the same "force the actual code path" rule that nearly
  let the cert-ref fix through as a false pass.

**Lesson**: a column default is a silent-failure machine in test fixtures. The
fixture looked right in every log line that named a state, because the *name* was
per-state; only the column was not. Assert the discriminator, not the label.

Directly produced **B-13**.

**Verified on the live deploy 85d10fc, 2026-09-09:** 8-state workflow suite 79 passed · 1 flaky of 80 (31 min; the flake was SA 'Stage Gate' section-click timing under load — 3/3 in isolation); AI spec AI + no-fake-data together: 23 passed · 1 skipped of 24. The one flake (SA "Stage Gate renders") was the Build-section click not registering while the page was still loading under suite load — it passed on retry and 3/3 in isolation. The new error text named that cause directly; the old harness would have reported "toBeVisible failed".

### ~~B-6 · `guardian-smoke.spec.ts` can never pass~~
✅ **FIXED 2026-08-24 (58d16de)** — retired. It seeded a LOCAL Postgres
(`guardian_test`) then asserted the cloud-backed UI showed that data, which is
architecturally impossible. Its genuinely unique assertions (no fabricated
counts, totals, or placeholder rows anywhere in the UI) were ported to
`guardian-no-fake-data.spec.ts`, which runs against Supabase like every other
spec — 7/7 green. A permanently-red spec trains people to ignore red.

### ~~B-7 · NSW payment milestones total 90%, not 100%~~
✅ **FIXED 2026-09-08 (54e59cd)** — owner's call: schedules must reconcile to 100%.

Percentages were regex-scraped from free text and took the **low end** of every
range, so NSW seeded to 90%. Not cosmetic: `contract_value` drives milestone
amounts, the budget dashboard, variation-percentage warnings and the HBCF
insurance threshold check.

Replaced parsing with **explicit authored numbers** — `paymentPercentage` on all
61 stages (0 for no-payment stages and for "combined" milestones whose payment
belongs to the preceding stage; creating a row for those double-bills), plus
`depositPercentage` for the two states whose stages deliberately stop short
because a deposit is paid up front (VIC 5%, QLD 10%), seeded as a visible
"Deposit" line.

Values respect the source data: fixed figures kept, ranges resolved *inside* the
stated range, VIC's 15% frame statutory maximum honoured.

`scripts/verify-payment-percentages.mjs` asserts all 8 states total 100% and
**runs in `npm run build`**, so a silent drift back fails the build.

**Verified through the real wizard on prod** (QLD — the hardest case, needing the
new deposit line):

```
 25%  $162,500  Enclosed / Lockup      10%  $65,000  Site Start
 20%  $130,000  Frame Stage            10%  $65,000  Deposit
 20%  $130,000  Fixing Stage          ----  --------
 15%   $97,500  Practical Completion   100%  $650,000  TOTAL  ✅
```

Totals 100% ✅ · equals contract value exactly ✅ · deposit line present ✅

The PaymentSchedule gap notice is kept but reworded as an **anomaly detector** —
it now fires only for projects seeded before this fix, or if a milestone was
later edited or removed.

---

## P3 — polish

### ~~B-8 · Certificate gate reads as contradictory~~
✅ **FIXED 2026-08-24 (8f64696)** — the static state-wide list is now visually and
textually separated from the current stage's actual gate, so the green banner and
the ⬜ list no longer read as contradicting each other.

**Effort**: 20 min

A green "You may proceed with the progress payment" banner sits directly above a
list of 8 unchecked ⬜ certificates. The banner is about the *current stage's*
requirements; the list is a static state-wide reference. Both correct, but a
stressed homeowner will read them as conflicting. Separate them visually or
retitle the list.

### ~~B-9 · Orphaned storage sweep~~
✅ **FIXED 2026-08-24 (8f64696) + 2026-09-08 — see the second half.**

The route (`POST /api/cron/storage-sweep`) landed in 8f64696, but **no scheduled
function ever called it**, so for two weeks the sweep never ran once and orphans
kept accumulating. Adding an API route is not the same as shipping a cron; the
schedule is the feature. `netlify/functions/cron-storage-sweep.mts` now invokes
it weekly (Sun 2am AEST).

Worth generalising: anything added under `src/app/api/cron/` needs a matching
`netlify/functions/cron-*.mts` or it is dead code that type-checks.

**Effort**: 1 h

`deleteProject()` and `delete-account` both clear storage correctly (verified).
Only deletions *outside* those paths leave files. Now hygiene rather than
exposure, since the buckets are private (v49).

Add a cron that lists bucket prefixes and removes any whose project no longer
exists.

### B-10 · Scanned PDFs can't be parsed
**Effort**: large (needs OCR)

Real inspection reports are often scanned images with no text layer — the sample
PCI report extracted only image data. The component already guards this
(`fullText.trim().length < 50`) so it degrades to a message rather than feeding
garbage to the AI. Supporting them needs OCR (Tesseract, or a vision model).

### ~~B-11 · Free-tier caps never clicked as a real free user~~
✅ **VERIFIED 2026-09-08** — logged into prod as `e2e-free@` in a real browser and
hit both caps for real, rather than inferring from string-matching:

| Cap | Result |
|---|---|
| 4th defect (cap 3) | *"Free plan allows 3 defect reports. Upgrade to Guardian Pro for unlimited."* + working Upgrade link ✅ |
| 2nd project (cap 1, now via the v51 **trigger**) | *"Free plan allows 1 project. Upgrade to Guardian Pro for unlimited projects."* — stays on the form ✅ |

No raw Postgres text (`FREE_TIER_*`, `row-level security`, `violates`) reached
the user in either case, which was the specific risk of moving enforcement into
triggers.

### B-12 · Yearly Stripe price still absent
**Effort**: 15 min (owner)

`pro_yearly.priceId` is `""`, so the button shows "Coming Soon". The webhook
already allowlists `STRIPE_YEARLY_PRICE_ID`, so creating the price and setting
the env var is all that's needed.

### ~~B-13 · Four states are sent to the wrong licence regulator~~
✅ **FIXED 2026-09-09 (4f81123)** — and it was much worse than four states.

Verifying the four fallback URLs meant verifying the whole map, and **every
licence-register link in the product was dead or wrong, in all 8 states**: five
404s (QLD, TAS, ACT, NT and SA's CBS page), NSW and WA redirecting to generic
department landing pages, SA's "register" pointing at the planning portal, and
VIC's regulator having become the Building and Plumbing Commission. There were
**three separate copies** of the map (`projects/[id]/page.tsx`,
`calculations.ts`, `BuilderRatings.tsx`), each rotten differently, plus a
hardcoded NSW fallback in `GuidedOnboarding`. The "Verify License" CTA — the
onboarding step whose whole purpose is checking the builder is licensed — did
not work anywhere.

| State | Now links to | Verified how |
|---|---|---|
| NSW | `verify.licence.nsw.gov.au/home/Trades` | 200, content |
| VIC | `bpc.vic.gov.au/find-and-check-a-practitioner` | real Chrome (WAF blocks curl) |
| QLD | `my.qbcc.qld.gov.au/…/qbcc-licensee-register` | 200 |
| WA | `wa.gov.au/service/…/find-registered-building-service-provider` | 200, content |
| SA | `secure.cbs.sa.gov.au/OccLicPubReg/` | real Chrome — title "Licence Search" |
| TAS | `cbos.tas.gov.au/…/search-licensed-occupations` | 200 |
| ACT | `accesscanberra.act.gov.au/business-and-work/public-registers` | 200, content |
| NT | `nt.gov.au/…/check-if-your-builder-is-registered` | real Chrome — title matches |

What changed:
- **One map.** `getLicenseVerificationUrl()` in `calculations.ts` is the only
  source; the project page, onboarding step 2 and BuilderRatings all read it.
- **The 8 insurance-check links** (`STATE_INSURANCE.verifyUrl`, on the overview
  and dashboard) had the same rot: same treatment. NT's scheme text was also
  wrong — the HBCF stopped issuing policies in 2012; NT cover is a fidelity fund
  certificate (nt.gov.au).
- **The journey page's `usefulLinks` / `regulatorUrl` JSON, `DisputeResolution`,
  and two blog links**: 24 dead or redirected URLs replaced with verified ones.
- **E2E**: the state-fidelity test expects all 8 register hosts explicitly, with
  no fallback — a missing state can no longer pass by landing on another
  state's regulator.

**Lesson**: a "central" map is only central if nothing else duplicates it, and a
link that returned 200 two years ago is not evidence today. See B-14.

### 🟡 B-14 · Government links rot — backstop shipped; 3 links still generic
🟡 **PARTLY 2026-09-09 (971a4b3)** — `scripts/check-gov-links.mjs` + `.github/workflows/gov-links.yml`, monthly and on any PR touching the link files. First run: 62 links, 35 ok, 2 redirected, 25 behind firewalls, 0 dead. The three generic complaint links remain.

**Effort**: 1 h
**Found**: 2026-09-09, during B-13

Three links have no verified *specific* replacement and currently land on a
generic-but-correct page rather than a 404: the NSW Fair Trading complaint form
(the old URL now redirects to "who we are"), WA building complaints (redirects
to the department landing page), and ACT building complaints (points at the
building hub). VMIA's DBI policy-verification host (`dbi.vmia.vic.gov.au`) did
not resolve from this machine at all — VIC's insurance check points at the BPC
DBI page instead; re-check from another network.

Backstop: a `scripts/check-gov-links.mjs` that fetches every `gov.au` URL in
the workflow JSON and guardian source with a browser user-agent and fails on
404 / DNS errors (WAF 403s need a real browser — list them, don't fail).
Government sites restructure every couple of years; this class of defect will
recur, and nothing in the app notices until a homeowner clicks.

### B-15 · Jest was running the whole suite twice
**Effort**: 5 min (owner: decide on the worktree)

A leftover git worktree lives *inside* the repo at
`.claude/worktrees/folder-location-344dd0` (detached at `c97d9a0`, 9.7 MB,
git-excluded). Jest's ignore list did not cover it, so every suite ran twice and
"16 failed / 240 passed" was really 8 / 120. Fixed the ignore pattern in
`jest.config` (4f81123). The worktree itself is untouched — remove it with
`git worktree remove` if it is not someone's WIP.

The remaining ~60 real failures are all `Cannot read properties of undefined
(reading 'getUser')` — Supabase-client mocks that pre-date the auth check — i.e.
P8-3 from the April review, not product defects.

## P1-product — launch readiness, from the 2026-09-09 user-perspective review

> **How to work these**: `19-USABILITY-AND-VALUE-GUIDE.md` — files, effort, sequence and a
> measure for every item below, plus the beta script.
>
> Engineering is verified; these are the reasons the product is **not** ready as a paid
> public launch. Owner decisions are marked. Full reasoning is in the 2026-09-09 session
> transcript; the short version: a private free beta with ~10 owners mid-build in one
> state, product cut to the money loop (project → stage gate → claim → Should I Pay →
> evidence export), and the metric is "do they come back at the next progress claim".

### ~~B-16 · Legal content has no disclaimer and no "last verified" dates~~
✅ **FIXED 2026-09-09/11 (d3d9d34, 7d21342, b37ca55)** — `LegalNotice` on Stage Gate, Should I Pay, Claim Review, exports and the rights panel, linking `/guardian/legal-notice`; `lastVerified` + `source` on every insurance, cooling-off and licence-register entry, rendered by `VerifiedAt`; `guide/LEGAL-REVIEW-CHECKLIST.md` is the hour-a-quarter pass (next due 2026-12-09).

**Effort**: 3 h · **Blocks**: any real user

The product's differentiator is state-specific legal rules, and they drift: every
regulator link was dead (B-13), NT's scheme was wrong since 2012, and more below. Add a
general "general information, not legal advice" notice (only the tribunal pack has one
today), a `lastVerified` date on each rule in `calculations.ts` and the workflow JSON
that the UI shows ("verified Sep 2026"), and a quarterly review task.

### ~~B-17 · Known-stale legal figures~~
✅ **FIXED 2026-09-09 (7d21342)** — SA threshold $12,000 → $20,000 (read on sa.gov.au in a browser); VIC Home Warranty from 1 Jul 2026 with DBI for earlier contracts; TAS scheme described as legislated-not-yet-proclaimed; TAS cooling-off citation fixed; **ACT cooling-off corrected to none** — the app had told ACT owners they had five days to cancel, which is the most dangerous shape of error. All eight states sourced and dated.

**Effort**: 2 h once verified · **Blocks**: any real user in the affected states

- **SA building indemnity insurance threshold**: app says $12,000; the SA Government
  page (sa.gov.au, building-indemnity-insurance) says the threshold rose to **$20,000
  from 10 November 2025**. Fetch is WAF-blocked; confirm in a browser, then change
  `STATE_INSURANCE.SA.threshold`.
- **VIC**: BPC states Victoria is moving from Domestic Building Insurance to Home
  Warranty for new eligible work; app still says DBI only. Verify commencement.
- **TAS**: Home Warranty Insurance was legislated in 2023 (contracts > $20,000); app says
  "voluntary insurance". Verify whether the scheme has commenced.
- **Cooling-off citations**: TAS cites "Building Act 2016" (the contracts act is the
  Residential Building Work Contracts and Dispute Resolution Act 2016); ACT cites
  "Building Act 2004". Verify both — either may have no statutory cooling-off at all.

### ~~B-18 · Member roles are cosmetic — and the UI promises the opposite~~
✅ **FIXED 2026-09-09 (9fa7814) — option B.** The invite offers read-only only; existing collaborator rows are labelled honestly; members opening a shared project see a banner saying they can see everything and change nothing. Option A (grant collaborator writes by role) stays phase 2.

**Effort**: 4 h to enforce, 30 min to remove · **Blocks**: public launch (per `13-CONSUMER-LAUNCH-CHECKLIST`)

The invite UI offers "Collaborator (add & edit)" and "Viewer (read-only)". At the
database level every accepted member is **read-only** (v47 policies: members SELECT;
writes are owner-only). A collaborator invited to edit hits RLS errors. Either grant
collaborators INSERT/UPDATE on the project tables and hide owner-only controls from
viewers, or remove the collaborator option and call the feature "share read-only".

### ~~B-19 · Guardian chrome shows Tools · Games · Blog above a construction-evidence tool~~
✅ **FIXED 2026-09-09 (fdb81ca, 8367f79, 2f3afcc)** — Guardian header (Dashboard · Projects · Support · Beta), legal-only footer, no launch banner, its own `<title>`, and four pages that still called themselves "🛠️ VedaWell Tools" under the global header. Achievements off by default with a per-browser toggle.

**Effort**: 1 h

The site nav (Tools, Games, Blog, theme toggle) renders above the project page. A
homeowner about to pay a $650k builder is looking at a "Games" link. Give `/guardian/*`
its own minimal chrome. Same family: the "Achievement Unlocked" toasts and locked-badge
grid on the dashboard read as a hobby app on a stressful, expensive build — make them
opt-in or remove.

### 🟡 B-20 · Free tier cannot demonstrate the value
🟡 **CODE DONE 2026-09-09 (07767e6) — MIGRATION NOT RUN.** Pricing copy tells the truth and `schema_v52` drops the defect/variation caps, but the probe on 2026-09-11 shows **v52 has not been run**: prod still blocks the 4th defect and 3rd variation while the page says unlimited. Zero external users, so nothing is broken for anyone — **but it must be run before the beta.** `node e2e/setup/verify-write-limits.mjs` is the check.

**Effort**: 2 h · **Owner decision**

Free = 1 project, 3 defects, 2 variations. A real pre-handover list has 30–100 items, so
free users never reach the moment where paying makes sense. Proposed flip: free =
unlimited logging; Pro = the money features (Should I Pay, claim review, tribunal pack,
PDF exports). Caps live in the v51/v42/v41 triggers — one migration.

### ~~B-21 · The product doesn't model site-access rights~~
✅ **FIXED 2026-09-09 (6441378)** — `RightsOnSite` tab in Build: six principles, the state regulator with its verified date, and a copy-ready visit request pre-filled with the builder and address. Weekly check-ins dropped from onboarding (daaa265).

**Effort**: 1 day

Under standard HIA/MBA contracts the builder has possession of the site; owners inspect
at reasonable times with reasonable notice, subject to WHS, and may not direct trades.
The blog says this; the product doesn't. Weekly on-site check-ins, a GPS site diary and a
materials register assume access most owners don't have. Add a per-state "your access
rights" panel and a visit-request notice template; reframe "tracking" from the site to
the money and documents the owner fully controls (claims, certificates, variations,
inspections, comms, PCI list).

### ~~B-22 · Adversarial framing~~
✅ **FIXED 2026-09-09 (7dacd5c, 4ebb46a)** — Red Flags → Watch-outs, Escalate Builder → Formal notices, Tribunal Pack → Evidence pack, the dashboard panel → "What to check at this stage" in amber; the landing hero leads with the claim and the unsourced "$40,000+ / fight back" lines are gone. Blog H1s untouched (SEO slugs) — a later pass.

**Effort**: 1 day of copy · **Owner decision**

Landing + blog: "dodgy" ×18, "red flag" ×29, "tribunal" ×51, "dispute" ×57. An owner
needs a working relationship with the builder for ~40 weeks; a tool that assumes an
adversary on day one gets abandoned or makes the build worse. Evidence is neutral —
"be a good client with a complete paper trail" sells the same features.

### 🟡 B-23 · Surface area: 49 tools, 11 hand-entry forms
🟡 **MOSTLY DONE 2026-09-09/11** — five sections re-cut around **Pay** (7dacd5c), onboarding to four outcomes (daaa265), the wizard's "Where is the build now?" and the pre-flight first verdict (4152a21, c69704e), "More" grouped into Money · Records · Reports & exports · Setup (f446a8f), claim-due reminder emails (fc69a82) and the public Progress Claim Checker at /tools/progress-claim-check (245f380). Still open: share-to-Guardian, paste-an-email, surfacing the importers at the moment they apply (§2.5), empty states that say *when* (§2.8), dynamic imports for the first load (§2.10).

**Effort**: 2 days · **Owner decision**

Cut the default experience to the money loop; everything else stays reachable behind
"More". Reduce required logging to the stage-based cadence that matches real access
(5–6 inspection points + progress claims).

### B-24 · Brand and domain
**Owner decision**

`08-BRAND-DIFFERENTIATION` stalled at "awaiting decision" on the homeguardian.ai
collision. The larger trust problem is the neighbourhood: a construction-dispute tool
next to Ayurveda, migraine and birth-chart tools on vedawellapp.com. Its own name and
domain (their Option B) is the fix; not before the beta, but before anyone pays.

### 🟡 B-25 · Small launch hygiene
🟡 **PARTLY 2026-09-09/11 (fdb81ca, e1eae0a)** — support link in the Guardian header and footer, a Beta label in the header and footer, and the legal notice made publicly readable (it was 307-ing to login while the public claim checker linked to it). **Owner still to do: set NEXT_PUBLIC_SITE_URL and the Sentry DSN on Netlify**, and add the repo secrets the nightly E2E workflow needs.

**Effort**: 1 h

Set `NEXT_PUBLIC_SITE_URL` on Netlify (still open in `13-CONSUMER-LAUNCH-CHECKLIST`);
confirm the Sentry DSN is set; a support path for beta users; label the product "beta"
in onboarding and billing until B-16/B-17/B-18 are done.

---

## Deliberately NOT in this backlog

- **Builder Check** — intentionally 503 `comingSoon` until real data sources
  (ABN Lookup, state licence registers) are integrated. Marketing copy no longer
  advertises it.
- **Panchang rebuild** — roadmap item, unrelated to Guardian.
- **`schema_v46_migraine_logs`** — the migraine tracker works on localStorage;
  only cross-device sync needs it.
