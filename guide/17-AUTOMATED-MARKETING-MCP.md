# Automated Marketing — API + MCP Architecture

Last updated: 2026-06-11
Status: v1 shipped (MCP server + existing automation documented)

## 0) The honest premise

Marketing cannot be 100% automated — and the parts that can't be are the parts
that work best at zero customers (genuine Reddit answers, TikTok videos with a
human face). What CAN be automated is everything repetitive around those human
moments: daily social posting, lead nurture, SEO pings, stats collection, and
content drafting. This doc describes the full machine, what runs without you,
and the one conversational control panel (MCP) that drives it all.

```
                        ┌──────────────────────────────┐
                        │  YOU (or Claude via MCP)      │
                        │  "post to bluesky"            │
                        │  "how many signups by source" │
                        │  "draft a post about flag 6"  │
                        └──────────────┬───────────────┘
                                       │ MCP tools
                        ┌──────────────▼───────────────┐
                        │  vedawell-marketing MCP server│
                        │  scripts/mcp/marketing-server │
                        └──┬──────────┬──────────┬─────┘
              shells out to│          │ REST     │ REST
                ┌──────────▼───┐  ┌───▼─────┐ ┌──▼──────┐
                │ auto-post-   │  │Supabase │ │ Gemini  │
                │ social.mjs   │  │ (stats) │ │ (drafts)│
                └──────┬───────┘  └─────────┘ └─────────┘
                       │
         ┌─────────────┼──────────────┐
   ┌─────▼────┐  ┌─────▼─────┐  ┌─────▼─────┐
   │ Bluesky  │  │ Facebook  │  │ LinkedIn  │
   │ (AT, free)│ │ Graph API │  │ (token)   │
   └──────────┘  └───────────┘  └───────────┘

   MEANWHILE, WITHOUT ANY HUMAN:
   ─ GitHub Action  bluesky-daily      → 1 post/day, 8am AEST
   ─ GitHub Action  submit-reach       → SEO pings on every push
   ─ Netlify cron   lead-nurture       → day-3/7/14 emails, 9am AEST
   ─ Netlify cron   weekly-digest      → Mon 8am AEST, Pro/trial users
   ─ Netlify cron   idle-users         → re-engagement, daily
   ─ Netlify cron   defect-reminders   → builder SLA chasing, daily
```

## 1) What already runs hands-free (inventory)

| System | Cadence | Channel | Status |
|--------|---------|---------|--------|
| `bluesky-daily.yml` GitHub Action | Daily 8am AEST | Bluesky | LIVE (history-commit step was failing — see §5) |
| `submit-reach.yml` GitHub Action | Every push to main | IndexNow, Google/Bing sitemap pings, Wayback | LIVE |
| `cron-lead-nurture` Netlify | Daily ~9am AEST | Email (day-3/7/14 sequence for PDF leads) | LIVE (needs schema v44 applied) |
| `cron-weekly-digest` Netlify | Mon 8am AEST | Email (Pro/trial project digest) | LIVE |
| `cron-idle-users` Netlify | Daily | Email (7-day idle re-engagement) | LIVE |
| `/red-flags` lead magnet | Always-on | Email capture + PDF delivery + UTM attribution | LIVE |
| Welcome email w/ PDF | On signup | Resend | LIVE |

## 2) The MCP control panel (NEW — shipped this commit)

`scripts/mcp/marketing-server.mjs` — a stdio MCP server exposing 7 tools.
Registered in `.mcp.json` as `vedawell-marketing`. Any MCP client (this Claude
Code session, Claude Desktop, a future scheduled agent) can now drive
marketing conversationally.

| Tool | What it does | Backed by |
|------|--------------|-----------|
| `marketing_stats` | Tier counts, MRR estimate, signups 7/30d, PDF funnel, engagement | Supabase REST (service role) |
| `lead_attribution` | PDF signups by utm_source / utm_campaign over N days | Supabase REST |
| `social_queue_status` | Library size + posted/unposted per platform | `social-posts.json` + history file |
| `post_social` | Post next item to bluesky/facebook/linkedin/all (dry_run supported) | shells out to `auto-post-social.mjs` |
| `generate_post` | AI-draft a new post (Bluesky + FB variants) in brand voice | Gemini REST |
| `add_post_to_library` | Append a post to the rotation library | `social-posts.json` |
| `ping_search_engines` | IndexNow + sitemap pings + Wayback | shells out to `submit-reach.mjs` |

Design rule: **one posting code path**. The MCP server never re-implements
posting — it shells out to the same scripts the GitHub Action uses. Fixing a
bug in `auto-post-social.mjs` fixes it everywhere.

### Example conversational workflows this unlocks

- "Check signups by source this week, then draft 3 posts about whichever red
  flag got the most clicks, add the best one to the library, and dry-run it."
- "Post to Facebook now, then ping search engines."
- "How is trial conversion trending vs last month?" (marketing_stats twice,
  compare)

## 3) Channel matrix — what's automatable

| Channel | API status | Automation level | Verdict |
|---------|-----------|------------------|---------|
| Bluesky | Free AT Protocol | FULL — daily action + MCP | ✅ Automated |
| Facebook Page | Free Graph API (needs page token) | FULL once `FACEBOOK_PAGE_TOKEN` set | ⚙️ Blocked on Meta app setup |
| Instagram | Graph API, business account required | Posting possible after FB setup | ⚙️ Same blocker |
| LinkedIn | OAuth token, tight quotas | Partial (auto-post-social supports it) | ⚙️ Token needed |
| Email | Resend, fully wired | FULL — nurture + digest + idle | ✅ Automated |
| SEO / IndexNow | Free | FULL — every push | ✅ Automated |
| X/Twitter | $100+/mo API | Not worth it at $0 MRR | ❌ Skip |
| TikTok | Content Posting API needs audited business app | Manual posting only | 🙋 Human (scripts ready in red-flags-distribution.md) |
| Reddit | API exists; automation = ban risk in target subs | NEVER automate posting | 🙋 Human (10 answer templates ready) |
| YouTube | Upload API exists, but content is the bottleneck | Manual | 🙋 Human |
| Google Ads | Full API | Possible later; needs budget + landing data | 💰 Phase 2 |

The pattern: **distribution-of-text is automated; human-trust channels stay
human**. Reddit/TikTok are where a zero-customer product earns credibility —
automating those would burn the exact trust we need.

## 4) Operating rhythm (what you actually do now)

**Daily (0 min)** — machines post to Bluesky, nurture leads, chase defects.

**Weekly (~20 min, conversational via MCP):**
1. `marketing_stats` + `lead_attribution 7` — what moved?
2. `generate_post` × 2-3 on the best-performing topic → `add_post_to_library`
3. Commit `social-posts.json` so CI posters pick up the new content
4. 2 Reddit answers + 1 FB group post from the distribution pack (human, ~15 min)

**Monthly (~30 min):**
- Review `pdf_to_trial` conversion; kill weakest channel, double down on best
- Batch-record 5 TikToks from the script pack if doing video that month

## 5) Known issues / next steps

1. **bluesky-daily Action fails at the "Commit posting history" step** —
   posting succeeds (steps 6-7 green) but the workflow's git push fails
   (default GITHUB_TOKEN lacks write permission, or branch protection).
   Fix: add `permissions: contents: write` to the workflow. Until fixed, the
   actions/cache restore-key keeps rotation roughly correct anyway.
2. **FACEBOOK_PAGE_TOKEN** still pending Meta developer app approval — when
   set in Netlify + GitHub secrets, Facebook joins the daily rotation.
3. **Library depth**: `social-posts.json` has ~10 posts. At 1/day, content
   recycles every ~10 days. Use `generate_post` weekly to keep it fresh
   (target 30+ posts so recycling is monthly).
4. **Schema v44/v45 must be applied** in Supabase for nurture + attribution
   to function (see supabase/ migration files).
5. **Phase 2 candidates**: Google Ads API automation once budget exists;
   Instagram via the same Meta app; a scheduled Claude agent that runs the
   weekly rhythm autonomously via this MCP server.

## 6) Setup checklist (one-time)

- [x] `@modelcontextprotocol/sdk` installed
- [x] `scripts/mcp/marketing-server.mjs` created + boot-tested (7 tools)
- [x] `.mcp.json` entry `vedawell-marketing` added
- [ ] Env vars present in `.env` locally: `NEXT_PUBLIC_SUPABASE_URL`,
      `SUPABASE_SERVICE_ROLE_KEY`, `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`,
      `GOOGLE_AI_API_KEY` (others optional until tokens exist)
- [ ] Restart Claude Code (or `/mcp` → reconnect) to pick up the new server
- [ ] Fix bluesky-daily.yml permissions (§5.1)
- [ ] Apply schema v44 + v45 in Supabase SQL Editor
