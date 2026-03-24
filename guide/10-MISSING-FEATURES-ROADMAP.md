# HomeOwner Guardian — Missing Features & Product Roadmap

> **Date**: 2026-03-20
> **Purpose**: Features that should have been there + what will make this a must-have SaaS
> **Core insight**: Homeowners don't buy "project management" — they buy **protection** from overpaying, missing defects, and being stonewalled by builders.

---

## THE HONEST TRUTH

The app is feature-rich but is still a **single-player tracker** when home building is a **multi-person, high-stakes financial decision**. Here's what's genuinely missing, ranked by how embarrassing the gap is:

---

## 🔴 CRITICAL — "Should Have Been There Day One"

### 1. Multi-User / Family Sharing
**The gap**: A $500K build involves partners, parents, inspectors, solicitors. Right now only one person can see anything.

**What to build**:
- Invite spouse/family by email
- 3 roles: Owner (full control), Collaborator (add/edit), Viewer (read-only)
- Shared defects, photos, payments, comms, documents
- Per-project invitations (not account-wide)

**Why it matters**: Without this, the product feels like a personal diary, not a protection system. Partners will create separate accounts and duplicate data.

**Effort**: L (new DB tables: `project_members`, invitation flow, permission checks on all queries)

---

### 2. Activity / Audit Log
**The gap**: The app positions around disputes, accountability, and tribunal evidence — but there's no record of who changed what and when.

**What to build**:
- Auto-log: defect created/edited, payment status changed, certificate uploaded, variation signed, stage advanced, communication logged
- Show: timestamp, user, action, old→new values
- Immutable (append-only, never deleted)
- Exportable for tribunal evidence packs

**Why it matters**: "Tribunal-ready evidence export" without an audit trail is a half-truth.

**Effort**: M (new `activity_log` table, triggers or app-level logging, UI timeline component)

---

### 3. Global Search
**The gap**: 50+ components, 20+ tables of data, but no way to search "where did I log that cracked tile?" across defects, photos, documents, comms, and payments.

**What to build**:
- Search bar in project header
- Searches: defects, variations, documents, communications, certificates, payments, photos (by description), site visits
- Results grouped by type with deep links

**Why it matters**: The app collapses under its own feature richness without search. Users with 30+ defects and 100+ photos can't find anything.

**Effort**: M (server-side full-text search across tables, or Supabase text search)

---

### 4. Defect Aging & SLA Tracking
**The gap**: Defects have status and severity, but no concept of *how long* they've been open, whether the builder responded, or what the next escalation step is.

**What to build**:
- Days open counter (from reported_date)
- Overdue badge (>14 days open = yellow, >30 = red)
- Builder response tracking (notified? acknowledged? scheduled?)
- Escalation state machine: Reported → Reminder Sent → Formal Notice → Dispute Filed
- Auto-reminder emails at 7/14/30 days

**Why it matters**: Recording defects is only half the value. The other half is **resolving them**. Right now the app helps log problems but not chase them.

**Effort**: M (add columns to defects table, escalation logic, automated reminders)

---

### 5. Account Deletion & Data Export
**The gap**: No way for users to delete their account or export their data. This is a legal requirement in many jurisdictions and a basic SaaS expectation.

**What to build**:
- Account deletion: remove all user data (projects, files, profile) with confirmation
- Data export: download all project data as JSON/CSV zip
- 30-day grace period before permanent deletion

**Why it matters**: Trust. Users with $500K of contract data need to know they own it.

**Effort**: S-M

---

### 6. Complete State Workflows (QLD, WA, SA, TAS, ACT, NT)
**The gap**: Only NSW and VIC have full stage workflows with checklists, inspections, and certificates. QLD/WA/SA/TAS/ACT/NT have regulatory info but **no construction stages defined**.

**What to build**:
- QLD: QBCC-specific stages (site prep → slab → frame → enclosed → fixing → completion)
- WA: Building Commission stages
- SA/TAS/ACT/NT: Generic residential stages with state-specific certificates
- At minimum: 6-8 stages per state with checklists

**Why it matters**: The app claims "all 8 states/territories supported" but a QLD user creates a project and gets **zero stages**. That's a broken first experience.

**Effort**: M (research + data entry into australian-build-workflows.json, no code changes needed)

---

## 🟡 HIGH-VALUE — "This Is Why I'll Pay $14.99/mo"

### 7. Progress Claim / Invoice Review AI
**The single highest-conversion feature possible.**

When a builder sends a progress claim, the AI checks:
- Is this stage actually marked complete?
- Are required certificates uploaded?
- Are there unresolved critical/major defects at this stage?
- Are all claimed variations approved and signed?
- Is the amount consistent with the contract schedule?

Output: **PAY ✅ / HOLD ⚠️ / DISPUTE ❌** with a pre-drafted response email.

**Why it matters**: This directly protects money. A homeowner who avoids one $20K overpayment has paid for 111 years of Guardian Pro.

**Effort**: M-L (ties together payments, certificates, defects, variations data with AI analysis)

---

### 8. Site Diary / Evidence Mode
**The gap**: Site visits are logged but not evidence-grade. Photos exist but lack context.

**What to build**:
- One-tap "Site Visit" mode that captures:
  - Auto timestamp
  - GPS location (with permission)
  - Weather snapshot (via free API like OpenWeather)
  - Room/area/trade tags
  - Voice note transcription (via Web Speech API)
  - Before/after photo comparison
- Link every photo to a defect, stage, or variation
- Generate a timestamped site visit report

**Why it matters**: It turns phone photos into defensible evidence. "I took this photo of the cracked slab at 2:14pm on March 15 at GPS -33.8688, 151.2093, weather: 32°C sunny" is tribunal-grade evidence.

**Effort**: M-L

---

### 9. One-Tap Builder Escalation
**The gap**: Template letters exist but the escalation *workflow* doesn't.

**What to build**:
- "Builder not responding?" button on any open defect
- Auto-tracks: days since last contact, number of attempts
- Escalation ladder:
  1. Friendly reminder (email/SMS template)
  2. Formal written notice (references HBA section)
  3. Fair Trading complaint draft
  4. Tribunal application summary
- Each step auto-logged in communication log with timestamp

**Why it matters**: This is the real-world problem. Builders ghost homeowners. The app should make escalation effortless.

**Effort**: M

---

### 10. Contract PDF Upload + AI Parsing
**What to build**:
- Upload building contract PDF
- AI extracts: contract sum, stage names, payment percentages, PC/PS allowances, key dates, builder details, insurance numbers
- Auto-populate project fields
- Highlight unusual clauses or missing protections

**Why it matters**: Nobody wants to manually type in 15 fields from a 40-page contract. This is the "wow" onboarding moment.

**Effort**: L (PDF text extraction + AI structured output, edge cases with scanned documents)

---

### 11. PC/PS Allowance Tracker
**Very Australian, very homeowner-relevant.**

**What to build**:
- Track Prime Cost and Provisional Sum allowances from contract
- Record actual selection prices
- Show blowout: "Kitchen appliances: $8,000 allowance → $12,500 actual = $4,500 over"
- Cumulative budget drift chart
- AI suggestions for where to save

**Why it matters**: PC/PS blowouts are the #1 surprise cost for first-time builders. Tracking them is worth the subscription alone.

**Effort**: M (new table, UI, ties into variations/budget)

---

### 12. AI Chat History Persistence
**The gap**: AI chat conversations vanish on page reload. Users can't reference previous advice.

**What to build**:
- Save chat threads to DB (new `ai_conversations` table)
- List past conversations with timestamps
- Continue previous threads
- Reference AI advice in defect reports or dispute packs

**Effort**: S-M

---

### 13. Inspector Report Import → Auto-Create Defects
**What to build**:
- Upload private building inspector PDF report
- AI extracts: defect descriptions, severity, locations, recommendations
- One-click "Create All Defects" from extracted items
- Link inspector report as evidence on each defect

**Why it matters**: Many homeowners hire private inspectors. Right now they have to manually re-type every finding.

**Effort**: M (PDF parsing + AI + batch defect creation)

---

## 🔵 TABLE STAKES — SaaS Infrastructure Gaps

### 14. 2FA / MFA
- TOTP authenticator app support via Supabase Auth
- Critical for a product managing $500K+ of financial data
- **Effort**: S

### 15. Server-Side Notification Preferences
- Move from localStorage to DB
- Email + in-app notification toggles per category
- Defect reminders, payment due, certificate expiry, warranty deadlines
- **Effort**: S

### 16. Web Push Notifications (Real)
- Implement actual web push via service worker
- Replace the current placeholder UI
- Key triggers: defect overdue, payment due, certificate expiring, builder response received
- **Effort**: M

### 17. CSV/Spreadsheet Import
- Import defects from CSV (for users migrating from spreadsheets)
- Import payment schedules from CSV
- Template CSV downloads with correct headers
- **Effort**: S-M

### 18. NCC Checklist to Database
- Move from localStorage to `ncc_checklist_items` table
- Per-project persistence
- Include in export/tribunal pack
- **Effort**: S

### 19. Calendar Integration (.ics Export)
- Export inspection dates, payment due dates, warranty deadlines as .ics
- "Add to Google Calendar / Apple Calendar" buttons
- **Effort**: S

---

## ⚪ FUTURE — Not Urgent But Valuable

### 20. Renovation Category
- Add "renovation" to build categories
- Different workflow: demolition → structural → services → fitout → completion
- Different checklist items and certificates
- **Effort**: M

### 21. Builder-Facing Portal (Deferred to June 2026+)
- Read-only access to defect list
- Acknowledge/respond to defects
- Upload certificates directly
- Status updates on stages

### 22. Public Builder Ratings / Aggregation
- Anonymized, aggregated builder scores
- Requires moderation policy and legal review
- High value but high risk

### 23. Native Mobile App
- React Native or Capacitor wrapper
- Camera integration, push notifications, offline
- Only needed when PWA limitations block real usage

### 24. Payment Integration
- Connect to bank feeds for payment verification
- Auto-match payments to milestones
- Receipt upload and matching

---

## PRIORITY SEQUENCING — Next 90 Days

### Sprint 1 (Weeks 1-3): Foundation — ✅ DONE (2026-03-20)
| Feature | Effort | Status |
|---------|--------|--------|
| Complete ALL 8 state workflows (SA/TAS/ACT/NT added) | M | ✅ Done |
| Account deletion + data export | S-M | ✅ Done |
| AI chat history persistence | S-M | ✅ Done |
| Defect aging + SLA tracking (pulled from Sprint 2) | M | ✅ Done |
| 4 blog posts for new features | S | ✅ Done |
| NCC checklist → DB | S | Deferred |
| Server-side notification prefs | S | Deferred |
| 2FA/MFA | S | Deferred |

### Sprint 2 (Weeks 4-6): Protection Features — ✅ DONE (2026-03-23)
| Feature | Effort | Status |
|---------|--------|--------|
| Activity/audit log (append-only, timeline UI, filters) | M | ✅ Done |
| Builder escalation workflow (4-level ladder, state-specific templates) | M | ✅ Done |
| Calendar .ics export (inspections, payments, SLA deadlines) | S | ✅ Done |
| Progress Claim Review AI (PAY/HOLD/DISPUTE verdict, Pro-only) | M-L | ✅ Done |
| 3 blog posts for new features | S | ✅ Done |

### Sprint 3 (Weeks 7-9): Collaboration + Intelligence — ✅ DONE (2026-03-23)
| Feature | Effort | Status |
|---------|--------|--------|
| Multi-user/family sharing (invite by email, 3 roles, per-project) | L | ✅ Done |
| Global search (5 entity types, Ctrl+K, grouped results) | M | ✅ Done |
| Progress claim review AI | M-L | ✅ Done (Sprint 2) |
| 2 blog posts for new features | S | ✅ Done |

### Sprint 4 (Weeks 10-12): Evidence + Import — ✅ DONE (2026-03-23)
| Feature | Effort | Status |
|---------|--------|--------|
| Site diary evidence mode (GPS, weather, area/trade tags) | M-L | ✅ Done |
| Contract PDF parsing (AI extracts fields, flags clauses) | L | ✅ Done |
| Inspector report import → auto-create defects | M | ✅ Done |
| PC/PS allowance tracker (budget drift dashboard) | M | ✅ Done |
| 3 blog posts for new features | S | ✅ Done |

---

## THE $14.99/mo QUESTION

A homeowner will pay without thinking if the app:
1. **Saved them from paying a builder who hasn't finished** (Progress Claim Review)
2. **Tracked how long their builder has been ignoring defects** (Defect Aging + Escalation)
3. **Let their partner see the same data** (Sharing)
4. **Generated tribunal-ready evidence automatically** (Audit Log + Site Diary)
5. **Reminded them of deadlines they'd otherwise miss** (Real Notifications)

Right now, the app does tracking. The gap is **protection automation**.

---

> **Bottom line**: The product has impressive breadth. What it needs now is **depth in the moments that matter most** — when money is about to change hands, when a builder isn't responding, and when evidence needs to be airtight. That's the path from "nice to have" to "can't build without it."
