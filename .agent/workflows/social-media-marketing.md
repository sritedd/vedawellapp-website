---
description: how to run the social media marketing campaign automation
---

# Social Media Marketing Automation Workflow

## Prerequisites
- Node.js installed
- VedaWell Next.js project at `vedawell-next/`

## Quick Commands

### Generate Social Media Posts (content only)
```bash
cd vedawell-next
npm run social:generate
```
This creates `scripts/guardian-social-posts.md` with 34 platform-ready posts.

### Post to Bluesky (100% free)
// turbo
```bash
# Dry run (preview without posting)
npm run social:bluesky:dry

# Post today's auto-selected post
BLUESKY_HANDLE=your.bsky.social BLUESKY_APP_PASSWORD=your-app-pw npm run social:bluesky

# Post a specific post (0-4)
node scripts/post-to-bluesky.mjs --handle your.bsky.social --password your-pw --post 0

# Post ALL with 60-second delays
node scripts/post-to-bluesky.mjs --handle your.bsky.social --password your-pw --all
```

### Post to Facebook/Instagram (free via Meta Graph API)
```bash
# List available posts
npm run social:meta:list

# Dry run
npm run social:meta:dry

# Post to Facebook
FACEBOOK_PAGE_TOKEN=your-token FACEBOOK_PAGE_ID=your-id npm run social:meta

# Post a specific post
node scripts/post-to-meta.mjs --page-token "token" --page-id "id" --post 0
```

## One-Time Setup

### Bluesky Setup (5 minutes)
1. Create a Bluesky account at bsky.app
2. Go to Settings → Privacy and Security → App Passwords
3. Create a new app password
4. Use this password (not your main password) in the scripts

### Meta (Facebook/Instagram) Setup (30 minutes)
1. Go to developers.facebook.com → Create App → Business type
2. Add "Pages" product
3. Create or select your Facebook Page
4. Get a Page Access Token with `pages_manage_posts` permission
5. For Instagram: link your Instagram Business account to your Facebook Page
6. Note your Page ID (from `https://graph.facebook.com/me?access_token=YOUR_TOKEN`)

### Automated Scheduling (Windows Task Scheduler)
1. Open Task Scheduler → Create Basic Task
2. Name: "VedaWell Daily Social Post"
3. Trigger: Daily at 9:00 AM
4. Action: Start a Program
5. Program: `node`
6. Arguments: `scripts/post-to-bluesky.mjs`
7. Start in: `C:\Users\sridh\Documents\Github\Ayurveda\vedawell-next`

## Image Generation
To generate clickbait images for posts, ask the AI agent:
- "Generate a clickbait image for the Should I Pay feature"
- "Create a social media graphic about construction defects"
- Use Google AI Studio (free tier) for API-based image generation

## Content Calendar
See the full content calendar artifact for week-by-week posting schedules.
