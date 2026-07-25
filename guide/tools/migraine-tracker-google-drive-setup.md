# Migraine Tracker — sync setup

The tool lives at `/tools/migraine-tracker`. It works for everyone with **zero
setup** (data in `localStorage`). Two extra tiers need one-time configuration.

## Tier 1 — Profile sync (Supabase)  ·  needs ONE migration

Signed-in users get their log synced to their account across devices.

1. Open **Supabase → SQL Editor** and run `supabase/schema_v46_migraine_logs.sql`.
   That creates the `migraine_logs` table (one JSONB row per user) with
   user-scoped RLS. Nothing else is required — the tool already detects the
   existing Supabase session (the same Google login used for Guardian).

Verify it applied:

```sql
select tablename from pg_tables where tablename = 'migraine_logs';
-- expect one row
```

That's the whole "tracking in profile" feature. Sign in at
`/guardian/login`, and the tool's Backup tab shows "SIGNED IN / SYNCED".

## Tier 2 — Google Drive backup file  ·  needs Google Cloud + Supabase config

The **"Save a backup to Google Drive"** button writes one JSON file
(`vedawell-migraine-record.json`) into the user's own Drive and updates it on
each save. It uses the least-privilege **`drive.file`** scope — the app can only
see the single file it created, never the rest of the user's Drive.

The code is already shipped (`src/lib/tools/migraine-sync.ts`). To turn it on:

### A. Google Cloud Console (project that backs your Google OAuth client)

1. **APIs & Services → Library →** enable **Google Drive API**.
2. **APIs & Services → OAuth consent screen → Data access (scopes) →** add:
   `https://www.googleapis.com/auth/drive.file`
   - This is a **sensitive** scope. In "Testing" mode it works immediately for
     test users. To offer it to the public you must submit the consent screen
     for **verification** (Google reviews it; can take days). Until verified,
     add the accounts that need it under **Audience → Test users**.
3. Confirm your existing OAuth **Client ID** (the one Supabase already uses for
   Google login) is the one on this project — no new client is needed.

### B. Supabase

1. **Authentication → Providers → Google** is already enabled (Guardian uses it).
   No change needed there — the tool requests the Drive scope per-call via
   `signInWithOAuth({ scopes: 'drive.file' })`, so it doesn't have to be a
   provider-wide default.
2. **Authentication → URL Configuration → Redirect URLs:** make sure
   `https://vedawellapp.com/tools/migraine-tracker` (and your Netlify preview
   origin, and `http://localhost:3000/tools/migraine-tracker` for dev) are in
   the allow-list, because "Connect Google Drive" redirects back there.

### How it behaves

- First "Save to Drive" with no Drive grant → the tool calls `connectDrive()`,
  which runs a Google OAuth with the Drive scope and returns to the tool.
- After that, "Save to Drive" writes/updates the file using the session's
  `provider_token`.
- **Known Supabase limitation:** Supabase surfaces `provider_token` to the
  client only for the current session and does not refresh it. If the token has
  expired, `pushToDrive()` returns `needsConnect` and the tool re-runs the
  connect flow. So a fresh sign-in / reconnect may be needed before a Drive save
  on a long-idle session. (Profile sync in Tier 1 is unaffected — it uses the
  normal Supabase session, which does refresh.)

## What ships without any of the above

Even with nothing configured, every user still gets: local persistence, the
observation chart + figures, CSV/summary/backup-code export, email-to-self, and
restore. Tiers 1 and 2 are additive.
