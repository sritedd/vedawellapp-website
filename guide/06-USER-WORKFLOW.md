# HomeOwner Guardian — User Workflow Map

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISCOVERY & SIGNUP                            │
│                                                                 │
│  vedawellapp.com/guardian → Landing Page                        │
│       │                                                         │
│       ├─→ "Start Free" → /guardian/login (Sign Up)              │
│       │       │                                                 │
│       │       ├─→ Email + Password + Name + Role                │
│       │       └─→ Google OAuth                                  │
│       │                                                         │
│       └─→ "Sign In" → /guardian/login                           │
│               │                                                 │
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
│  │ (static) │ │ (static) │ │ (static) │ │ (static) │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ⚠ NOT CLICKABLE — should link to project detail tabs          │
│                                                                 │
│  Quick Actions:                                                 │
│  [Create Project] [View Checklists] [Log Variation] [Guide]    │
│  ⚠ Links break if projectId is null                             │
│                                                                 │
│  Recent Projects (clickable → project detail) ✓                 │
│  Announcement Banner (if active) ✓                              │
│                                                                 │
│  Nav: Dashboard | Projects | Support* | Refer | Admin*          │
│  (* = conditional)                                              │
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
│  │ ○ Extension                 │                                │
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
│  │ Start Date                  │                                │
│  │ Address                     │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
│  On submit:                                                     │
│  1. Create project row                                          │
│  2. Seed stages from australian-build-workflows.json             │
│  3. Seed checklist_items per stage                               │
│  4. Seed certifications per stage                                │
│  → Redirect to /guardian/projects/{id}                          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROJECT DETAIL HUB                            │
│  /guardian/projects/[id]                                        │
│                                                                 │
│  Tab Groups:                                                    │
│                                                                 │
│  OVERVIEW                                                       │
│  ├─ Dashboard ──────── ProjectOverview (stats summary)          │
│  ├─ Pending Actions ── BuilderActionList (todo items)           │
│  └─ Stage Gate ─────── StageGate ⚠ HARDCODED currentStage      │
│                                                                 │
│  CONSTRUCTION                                                   │
│  ├─ Build Stages ───── StageChecklist ⚠ HARDCODED              │
│  ├─ Checklists ─────── ProjectChecklists ✓                      │
│  ├─ Defects ────────── ProjectDefects ⚠ BROKEN (sample data)   │
│  ├─ Inspections ────── InspectionTimeline ⚠ HARDCODED          │
│  ├─ Materials ──────── MaterialRegistry (UI-only)               │
│  └─ Variations ─────── ProjectVariations ✓ (partial)            │
│                                                                 │
│  PROGRESS                                                       │
│  ├─ Photos ─────────── ProgressPhotos ⚠ BROKEN (sample data)   │
│  ├─ Site Visits ────── SiteVisitLog (UI-only)                   │
│  └─ Weekly Check-ins ─ WeeklyCheckIn ✓                          │
│                                                                 │
│  FINANCIAL                                                      │
│  ├─ Payments ───────── PaymentSchedule (UI-only)                │
│  ├─ Budget ─────────── BudgetDashboard ✓ (partial)              │
│  └─ Certificates ───── CertificationGate ✓ ⚠ HARDCODED stage   │
│                                                                 │
│  DOCS & COMMS                                                   │
│  ├─ Document Vault ─── DocumentVault ✓                          │
│  ├─ Communication ──── CommunicationLog ✓                       │
│  └─ Alerts ─────────── NotificationCenter ⚠ BROKEN             │
│                                                                 │
│  TOOLS                                                          │
│  ├─ Export Reports ─── ExportCenter ✓ (partial)                 │
│  ├─ Generate Report ── ReportGenerator ✓ (partial)              │
│  └─ Project Settings ─ ProjectSettings ✓                        │
└─────────────────────────────────────────────────────────────────┘

## Key: ✓ = Working   ⚠ = Broken/Partial
```

---

## Data Persistence Map

| User Action | Persisted to DB? | Persisted to Storage? |
|-------------|------------------|-----------------------|
| Create project | Yes ✓ | N/A |
| Delete project | Yes (partial) ⚠ | No ⚠ |
| Add defect | NO ⚠ (in-memory) | NO ⚠ |
| Add defect photo | NO ⚠ | NO ⚠ |
| Add progress photo | NO ⚠ (in-memory) | NO ⚠ |
| Add variation | Yes ✓ | Yes (signatures) ✓ |
| Upload document | Yes ✓ | Yes ✓ |
| Upload certificate | Yes ✓ | Yes ✓ |
| Checklist photo | Yes ✓ | Yes ✓ |
| Log communication | Yes ✓ | N/A |
| Weekly check-in | Yes ✓ | N/A |
| Update profile | Yes ✓ | N/A |
| Send support msg | Yes ✓ | N/A |

---

## What a New User Experiences Today

1. Signs up → Redirected to dashboard → **Sees empty stats (good)**
2. Creates project → **Works well, stages seeded correctly**
3. Opens project → Sees 40+ tabs → **Overwhelming but functional**
4. Tries to add defect → **Sees pre-filled sample defects (confusing)**
5. Tries to add photo → **Nothing happens (broken)**
6. Tries Photos tab → **Sees sample photos that aren't theirs (confusing)**
7. Checks Alerts → **Sees sample notifications (confusing)**
8. Uploads document → **Works correctly**
9. Logs communication → **Works correctly**
10. Deletes project → **Old data may persist in DB**
11. Creates new project → **May see orphaned data from old project**

The user's experience is that ~40% of features work, ~30% show fake data, and ~30% do nothing when clicked.
