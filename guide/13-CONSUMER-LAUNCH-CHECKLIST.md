# HomeGuardian Consumer Launch Checklist

> Based on the documented product flow in `guide/12-PROCESS-MAP.md` and the current implementation review across Guardian auth, billing, collaboration, and security flows.
>
> **Last updated**: 2026-04-09 (post security fix commit `d10ff64`)

## Current Verdict

- Consumer launch readiness: `8/10`
- Recommendation: `Private beta ready now — all security blockers resolved, all migrations applied`
- Remaining before public launch: `Role permissions for collaborators/viewers, set NEXT_PUBLIC_SITE_URL env var`

## 1. Must-Fix Before Public Launch

### Resolved (2026-04-09)

- [x] **Enforce MFA on the server for destructive actions.** Server-side AAL2 check added to `deleteProject` (actions.ts) and `delete-account/route.ts`. If user has TOTP enabled but session is not aal2, deletion is blocked with 403.
- [x] **Require server-validated MFA proof before project deletion.** `ProjectSettings.tsx` now calls the `deleteProject` server action (which checks AAL) instead of doing client-side Supabase deletes.
- [x] **Require server-validated MFA proof before account deletion.** `delete-account/route.ts` checks `mfa.getAuthenticatorAssuranceLevel()` before proceeding. Profile page has MFA gate UI in the delete modal.
- [x] **Stop relying on client-side `mfaVerified` UI state for security decisions.** Client-side MFA gate remains for UX (prompting the code entry) but the server enforces AAL2 independently. A stolen session without MFA re-verification cannot delete.
- [x] **Make the identity verification flow honest.** Renamed from “Verify Your Phone” to “Verify Your Identity” in `PhoneVerificationGate.tsx`. UI now explains OTP goes to email. Success message says “Identity verified!” not “Phone verified!”.
- [x] **Prevent phone number overwrite without re-verification.** Profile save detects phone changes and calls `reset-for-phone-change` action in `phone-verify/route.ts` to clear `identity_verified`. User must re-verify on next project creation.
- [x] **Make collaboration work for accepted members.** `projects/[id]/page.tsx` now falls back to checking `project_members` if user is not the owner. Tracks `memberRole` state. RLS migration `schema_v40` adds SELECT policies for accepted members on projects and all project-scoped tables.
- [x] **Replace Origin trust in Stripe URLs.** Both `checkout/route.ts` and `portal/route.ts` now use `process.env.NEXT_PUBLIC_SITE_URL || “https://vedawellapp.com”` instead of `req.headers.get(“origin”)`.
- [x] **Enable RLS on exposed tables.** `schema_v39` enables RLS on `account_deletion_log` and `stripe_webhook_events` (Supabase security alert fix).

### Still Open

- [x] **~~Run all pending DB migrations (v21-v40).~~** All 20 migrations applied in Supabase as of 2026-04-09.
- [ ] **Define and enforce role permissions for owner, collaborator, and viewer.** The client tracks `memberRole` but doesn't use it to restrict UI. Viewers should be read-only (hide Settings, disable defect/variation creation); collaborators should not delete projects. The `memberRole` state is wired up but unused — needs conditional rendering.
- [x] **~~Re-run a focused security pass on all destructive and admin-affecting routes.~~** Verified: all cron routes use fail-closed `!cronSecret || authHeader !== Bearer` + POST-only. Builder-check returns 503. All destructive actions (project delete, account delete) enforce server-side MFA. Stripe redirect URLs use server-side base URL.
- [x] **~~Verify “Security: Guards & Policies” claims in `12-PROCESS-MAP.md` match code.~~** MFA enforcement, identity verification, phone overwrite prevention, collaboration access, Stripe redirect — all verified against current code.
- [ ] **Set `NEXT_PUBLIC_SITE_URL` env var on Netlify** to `https://vedawellapp.com`. Code has safe fallback but env var should be explicit.

## 2. Safe For Private Beta

- [ ] Restrict access to invited testers, known users, or a waitlist.
- [ ] Clearly label the product as beta in Guardian marketing, onboarding, and billing flows.
- [x] ~~Avoid positioning the app as a verified compliance or identity product until the verification flow is fixed.~~ Flow now honestly labeled “Identity Verification” with email OTP.
- [x] ~~Avoid promising full collaboration until accepted members can actually access project pages.~~ Members can now load shared projects. All migrations including v33+v40 applied.
- [ ] Keep the disabled `builder-check` behavior as-is — returning “coming soon” is safer than hallucinated reports.
- [ ] Use the beta to validate the core value loops: project setup, defect logging, evidence capture, payment review, export, and dashboard usage.
- [ ] Track real user friction around onboarding, upload flows, and project setup.
- [ ] Confirm free, trial, and paid tier boundaries behave as intended under real usage.
- [ ] Manually monitor account deletion, trial upgrades, and Stripe lifecycle events for every beta user.
- [ ] Add a support path for beta users who get stuck in auth, verification, or billing.
- [ ] Make sure privacy and deletion expectations are conservative and accurate during beta.

## 3. Nice-To-Have After Launch

- [ ] Improve launch confidence with better observability for auth, billing, AI, and destructive actions.
- [ ] Add stronger product analytics around funnel steps described in [12-PROCESS-MAP.md](file:///c:/Users/sridh/Documents/Github/Ayurveda/vedawell-next/guide/12-PROCESS-MAP.md#L233-L275).
- [ ] Tighten AI cost and quality controls beyond launch-blocking fixes.
- [ ] Expand the knowledge base and continue grounding AI outputs in real Australian standards and state-specific data.
- [ ] Add richer team workflows once collaborator access and permissions are correct.
- [ ] Improve billing polish, portal UX, and recovery flows after the redirect/security basics are fixed.
- [ ] Add stronger admin tooling and audit visibility for sensitive actions.
- [ ] Expand offline/realtime confidence only after the core security and trust boundaries are stable.
- [ ] Add more polished consumer onboarding copy and launch messaging once the trust model is solid.

## Launch Rule

- **Public launch**: only after role permissions are enforced for viewers/collaborators and `NEXT_PUBLIC_SITE_URL` is set on Netlify. Everything else is done.
- **Private beta**: ready now. All security blockers resolved, all migrations applied. Label as beta and constrain to invited users.
- **Nice-to-have work**: should not delay launch once Sections 1 and 2 are complete.
