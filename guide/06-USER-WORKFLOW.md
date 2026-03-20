# HomeOwner Guardian — User Workflow Map

> **Last Updated**: 2026-03-20

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISCOVERY & SIGNUP                            │
│                                                                 │
│  vedawellapp.com/guardian → Landing Page                        │
│       │  (ScrollReveal animations, AI features section,         │
│       │   trust bar, pricing cards, social proof)               │
│       │                                                         │
│       ├─→ "Start Free" → /guardian/login (Sign Up)              │
│       │       ├─→ Email + Password + Name + Phone (mandatory)   │
│       │       └─→ Google OAuth                                  │
│       │                                                         │
│       └─→ "Sign In" → /guardian/login                           │
│               └─→ Email + Password → Dashboard                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD                                  │
│  /guardian/dashboard                                            │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Contract │ │Variations│ │  Open    │ │Projected │          │
│  │  Value   │ │   Sum    │ │ Defects  │ │  Total   │          │
│  │(clickable)│ │(clickable)│ │(clickable)│ │(clickable)│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  → Each card links to relevant project tab                     │
│                                                                 │
│  Quick Actions:                                                 │
│  [Create Project] [View Checklists] [Log Variation] [Guide]    │
│  → Only shown for active/planning projects                     │
│                                                                 │
│  Recent Projects (clickable → project detail) ✓                 │
│  Announcement Banner (if active) ✓                              │
│  State-aware license verification link ✓                        │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROJECT CREATION                              │
│  /guardian/projects/new                                         │
│                                                                 │
│  Step 1: Select Build Type + State                              │
│  ┌─────────────────────────────┐                                │
│  │ ○ New Build                 │  State: [NSW ▼]                │
│  │ ○ Extension                 │  (all 8 states/territories)    │
│  │ ○ Granny Flat               │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
│  Step 2: Project Details                                        │
│  ┌─────────────────────────────┐                                │
│  │ Project Name                │                                │
│  │ Builder Name                │                                │
│  │ Builder License #           │                                │
│  │ Builder ABN                 │                                │
│  │ HBCF Policy #               │                                │
│  │ Contract Value ($)          │                                │
│  │ Contract Signed Date        │                                │
│  │ Start Date                  │                                │
│  │ Address                     │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
│  Verification gates (before form):                              │
│  1. Email verification (admins/Pro exempt)                      │
│  2. Phone OTP verification (6-digit code, 10min expiry)         │
│                                                                 │
│  On submit:                                                     │
│  1. Free tier check (1 project limit)                           │
│  2. Create project row (state + build_category saved)           │
│  3. Seed stages from australian-build-workflows.json             │
│  4. Seed checklist_items per stage                               │
│  5. Seed certifications per stage                                │
│  6. Seed payment milestones from workflow JSON                   │
│  → Redirect to /guardian/projects/{id}                          │
│  → OnboardingWizard auto-shows for first project                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROJECT DETAIL HUB                            │
│  /guardian/projects/[id]                                        │
│                                                                 │
│  5 Main Sections (desktop: top tabs, mobile: bottom nav)        │
│                                                                 │
│  🏠 HOME                                                        │
│  ├─ Dashboard ──────── SmartDashboard (stage-aware overview)    │
│  │                     → MilestoneCelebrations (animated toasts) │
│  │                     → ProjectHealthScore (circular gauge)     │
│  │                     → ShouldIPay (green/red verdict)          │
│  │                     → "What To Do Now" actions               │
│  │                     → Dodgy builder warnings                 │
│  │                     → Recent activity feed (clickable)       │
│  ├─ Pending Actions ── BuilderActionList                        │
│  ├─ AI Chat ────────── GuardianChat (Pro only, streaming)       │
│  └─ Stage Gate ─────── StageGate (dynamic from DB)              │
│                        → AI Stage Advice panel below             │
│                                                                 │
│  🔨 BUILD                                                       │
│  ├─ Stages ─────────── StageChecklist (dynamic from DB)         │
│  ├─ Checklists ─────── ProjectChecklists ✓                      │
│  ├─ Inspections ────── InspectionTimeline ✓                     │
│  ├─ Certificates ───── CertificationGate ✓                     │
│  ├─ NCC 2025 ───────── NCC2025Compliance ✓                     │
│  ├─ Red Flags ──────── DodgyBuilderAlerts ✓ (binary actions)   │
│  ├─ Timeline ──────── ProgressTimeline ✓ (Gantt SVG)           │
│  └─ Builder Speed ──── TimelineBenchmark ✓                     │
│                                                                 │
│  ⚠ ISSUES                                                       │
│  ├─ Defects ────────── ProjectDefects ✓ (+ AI Defect Assist)   │
│  ├─ Variations ─────── ProjectVariations ✓                      │
│  ├─ Disputes ───────── DisputeResolution ✓                     │
│  ├─ Pre-Handover ───── PreHandoverChecklist ✓ (DB-backed)       │
│  └─ Tribunal ──────── TribunalExport ✓ (evidence package)      │
│                                                                 │
│  📷 EVIDENCE                                                    │
│  ├─ Photos ─────────── ProgressPhotos ✓                         │
│  ├─ Documents ──────── DocumentVault ✓                          │
│  ├─ Comms ──────────── CommunicationLog ✓                       │
│  ├─ Check-ins ──────── WeeklyCheckIn ✓                          │
│  └─ Site Visits ────── SiteVisitLog ✓ (offline-capable)         │
│                                                                 │
│  ⋯ MORE (card grid)                                             │
│  ├─ Payments ───────── PaymentSchedule ✓ (DB-backed)            │
│  ├─ Budget ─────────── BudgetDashboard (partial)                │
│  ├─ Cost Check ─────── CostBenchmarking ✓                      │
│  ├─ Builder Score ──── AccountabilityScore ✓                    │
│  ├─ Rate Builder ───── BuilderRatings ✓ (DB-backed)             │
│  ├─ Materials ──────── MaterialRegistry ✓                       │
│  ├─ Checklists ─────── ProjectChecklists ✓                      │
│  ├─ Export ─────────── ExportCenter ✓ (6 PDF types)             │
│  ├─ Reports ────────── ReportGenerator ✓                        │
│  ├─ Notifications ──── NotificationCenter ✓                     │
│  ├─ Alerts ─────────── ConsolidatedAlerts ✓                     │
│  ├─ Share Progress ─── ShareProgressCard ✓ (WhatsApp/X/native)  │
│  └─ Settings ───────── ProjectSettings ✓                        │
│                                                                 │
│  📸 Photo FAB (floating, above mobile nav)                      │
│  → MobilePhotoCapture with annotation + "Log as Defect"         │
│                                                                 │
│  Key: ✓ = Working with DB integration                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Persistence Map

| User Action | Persisted to DB? | Persisted to Storage? |
|-------------|------------------|-----------------------|
| Create project | Yes ✓ | N/A |
| Delete project | Yes ✓ (cascade + storage cleanup) | Yes ✓ |
| Add defect | Yes ✓ | N/A |
| Add defect photo | Yes ✓ | Yes ✓ |
| Add progress photo | Yes ✓ | Yes ✓ |
| Add variation | Yes ✓ | Yes (signatures) ✓ |
| Upload document | Yes ✓ | Yes ✓ |
| Upload certificate | Yes ✓ | Yes ✓ |
| Checklist photo | Yes ✓ | Yes ✓ |
| Log communication | Yes ✓ | N/A |
| Weekly check-in | Yes ✓ | N/A |
| Log material | Yes ✓ | N/A |
| Log site visit | Yes ✓ | N/A |
| Update profile | Yes ✓ | N/A |
| Send support msg | Yes ✓ | N/A |
| AI defect assist | Cached in ai_cache ✓ | N/A |
| AI stage advice | Cached in ai_cache ✓ | N/A |
| AI chat | Not persisted | N/A |
| AI builder check | Cached in ai_cache ✓ | N/A |
| Pre-handover items | Yes ✓ (pre_handover_items) | N/A |
| Contract review items | Yes ✓ (contract_review_items) | N/A |
| Builder ratings | Yes ✓ (builder_reviews) | N/A |
| NCC checklist toggle | localStorage | N/A |
| Red flag verify | localStorage | N/A |
| Onboarding steps | localStorage | N/A |
| Milestone celebrations | localStorage (dedup) | N/A |

---

## AI Workflows (Added 2026-03-18)

### AI Defect Assist (Free tier)
```
User logs defect → types rough description → clicks "AI Assist"
  → API sends description + stage + state to Gemini Flash-Lite
  → Returns: professional description, severity, recommendations, AS reference
  → User clicks "Apply" → description/severity/location auto-filled
```

### AI Stage Advice (Pro tier)
```
User views Stage Gate → AI Stage Advice panel auto-loads below
  → API sends current stage + state to Gemini Flash-Lite (7-day cache)
  → Returns: advice, checklist, required documents, common issues, payment guidance
  → Collapsible panel, "AI-generated" disclaimer
```

### AI Guardian Chat (Pro tier)
```
User opens AI Chat tab → streaming chat interface
  → API fetches project context (stages, defects, variations)
  → Verifies project ownership (user_id match)
  → Streams response via Gemini Flash / Claude Sonnet
  → Context-aware answers about user's specific build
```

### AI Builder Check (Pro tier)
```
User submits builder name + ABN → API validates state
  → Queries external APIs (ABN Lookup — stubs for now)
  → Gemini generates risk assessment report
  → 3-day cache per builder+state combination
```

---

## What a New User Experiences Today

1. Signs up → Redirected to dashboard → **Empty stats with "Create your first project" CTA**
2. Creates project → **Works well, stages + checklists + certs + payments seeded from workflow JSON**
3. OnboardingWizard appears → **3-step guide (add a photo, log a defect, check stage)**
4. Opens project → **5-section nav, SmartDashboard shows "What To Do Now"**
5. Logs a defect → **AI Assist available to professionalize description (free tier)**
6. Takes a photo → **Camera capture + annotation + Supabase upload**
7. Checks Stage Gate → **Dynamic requirements from DB, AI Stage Advice panel (Pro)**
8. Opens AI Chat → **Context-aware streaming chat about their build (Pro)**
9. Checks red flags → **Contextual dodgy builder warnings with "OK/Issue" buttons**
10. Uploads document → **Works correctly, stored in Supabase Storage**
11. Exports report → **PDF generation via pdf-lib**
12. Deletes project → **Clean cascade (all tables + storage)**

**Overall: ~98% of features fully working with DB integration. Remaining localStorage-only items are intentionally client-side (NCC toggles, red flag verifies, onboarding steps, milestone dedup).**
