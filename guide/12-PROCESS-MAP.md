# HomeGuardian — End-to-End Process Map

> Full Mermaid diagram covering all 15 subsystems: Auth, Onboarding, Billing, Dashboard, Build Management, Defects, Payments, Evidence, AI, Collaboration, Export, Admin, Cron, Realtime/Offline, and Security.

## Process Map

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1e40af', 'primaryTextColor': '#fff', 'primaryBorderColor': '#1e3a8a', 'lineColor': '#6366f1', 'secondaryColor': '#f0fdf4', 'tertiaryColor': '#fef3c7'}}}%%

flowchart TB
    subgraph AUTH["AUTH: Authentication & Onboarding"]
        A1[Landing Page<br>/guardian] -->|Sign Up| A2[Login/Register<br>/guardian/login]
        A2 -->|Email + Password| A3[Supabase Auth<br>auth.signUp]
        A3 -->|Confirmation Email| A4{Email<br>Verified?}
        A4 -->|No| A5[Check Inbox<br>Magic Link]
        A5 --> A4
        A4 -->|Yes| A6[Phone OTP Gate<br>/api/guardian/phone-verify]
        A6 -->|Send OTP via Resend| A7{OTP<br>Verified?}
        A7 -->|No, max 5 attempts| A6
        A7 -->|Yes| A8[identity_verified = true]
        A8 --> A9[Dashboard<br>/guardian/dashboard]

        A2 -->|Forgot Password| A10[Reset Password<br>Supabase Magic Link]
        A10 --> A2

        A2 -->|Google OAuth| A3
    end

    subgraph ONBOARD["ONBOARD: Project Setup Wizard"]
        A9 -->|No Projects| O1[OnboardingWizard]
        O1 -->|Step 1| O2[Select Build Type<br>new_build / extension / granny_flat]
        O2 -->|Step 2| O3[Select State<br>NSW/VIC/QLD/WA/SA/TAS/ACT/NT]
        O3 -->|Step 3| O4[Builder Info<br>Name, License, ABN, Insurance]
        O4 -->|Step 4| O5[Project Details<br>Contract Value, Address, Dates]
        O5 --> O6[Create Project<br>+ Auto-generate Stages]
        O6 -->|From australian-build-workflows.json| O7[State-specific Stage List<br>eg: Site Start - Slab - Frame - Lockup - ...]
        O7 --> DASH
    end

    subgraph TIER["BILLING: Subscription & Stripe"]
        T1[Free Tier<br>1 project, 3 defects, 5 AI/day] -->|Start Trial| T2[POST /api/guardian/start-trial<br>One-time, 7 days, no CC]
        T2 --> T3[Trial Tier<br>Unlimited projects, 20 AI/day]
        T3 -->|Expires| T6[Cron: cleanup-trials<br>Reset to Free]
        T6 --> T1

        T1 -->|Upgrade| T4[Pricing Page<br>/guardian/pricing]
        T3 -->|Upgrade| T4
        T4 -->|Select Plan| T5[POST /api/stripe/checkout<br>Price ID allowlist check]
        T5 -->|Redirect| T7[Stripe Checkout<br>Payment Form]
        T7 -->|Success| T8[Webhook: checkout.session.completed<br>Set tier = guardian_pro]
        T7 -->|Cancel| T4
        T8 --> T9[Pro Tier<br>Unlimited everything, 50 AI/day]
        T9 -->|Manage| T10[Stripe Portal<br>/api/stripe/portal]
        T10 -->|Cancel| T11[Webhook: subscription.deleted<br>Downgrade to Free]
        T11 --> T1

        T8 -->|Idempotency| T12[stripe_webhook_events<br>Dedup by event_id]
        T8 -->|GA4 Conversion| T13[Track Purchase Event]
    end

    subgraph DASH["DASHBOARD: Home View"]
        D1[SmartDashboard] --> D2[Project Stats<br>Contract Value, Variations, Defects]
        D1 --> D3[ProjectHealthScore<br>Circular Gauge, 4 Sub-scores]
        D1 --> D4[MilestoneCelebrations<br>8 Achievements + Badges]
        D1 --> D5[ShouldIPay Button<br>Green/Red Verdict]
        D1 --> D6[Upgrade CTA<br>Free-tier Banner]
        D1 --> D7[Announcements<br>Admin-published Banners]
    end

    subgraph BUILD["BUILD: Stage & Inspection Management"]
        B1[Project Detail<br>/guardian/projects/id] --> B2[StageGate<br>Stage Transitions + Approval]
        B1 --> B3[StageChecklist<br>Per-stage Compliance Items]
        B1 --> B4[ProgressTimeline<br>Gantt Chart + Today Line]
        B1 --> B5[TimelineBenchmark<br>Actual vs Industry Pace]
        B1 --> B6[InspectionTimeline<br>Scheduled Inspections]
        B1 --> B7[NCC2025Compliance<br>National Code Tracking]

        B2 -->|Complete Stage| B8{All Checks<br>Passed?}
        B8 -->|Yes| B9[Advance to Next Stage<br>Update payments table]
        B8 -->|No| B10[Block: Missing Certs<br>or Inspections]
    end

    subgraph DEFECTS["DEFECTS: Tracking & Escalation"]
        DF1[Report Defect<br>Photo FAB Speed-Dial] --> DF2[MobilePhotoCapture<br>Camera + GPS]
        DF2 --> DF3[AI Describe Defect<br>Gemini Flash Analysis]
        DF3 --> DF4[Severity + Impact + Fix Advice<br>+ Australian Standards Ref]
        DF4 --> DF5[ProjectDefects List<br>with SLA Tracking]
        DF5 --> DF6[DefectAgingBadge<br>Days Overdue]
        DF5 -->|Unresolved| DF7[BuilderEscalation<br>4-Level Workflow]
        DF7 -->|Level 1| DF8[Friendly Reminder<br>Email Template]
        DF8 -->|Level 2| DF9[Formal Notice<br>State-specific Letter]
        DF9 -->|Level 3| DF10[Fair Trading<br>Complaint Filing]
        DF10 -->|Level 4| DF11[Tribunal<br>Legal Proceedings]
        DF11 --> DF12[TribunalExport<br>10-Section Evidence Package]
    end

    subgraph PAYMENTS["PAYMENTS: Claims & Budget"]
        P1[PaymentSchedule<br>Stage-based Payments] --> P2{Claim<br>Submitted?}
        P2 -->|Yes| P3[AI Claim Review<br>PAY / HOLD / DISPUTE]
        P3 -->|PAY| P4[Approve Payment<br>Mark Paid]
        P3 -->|HOLD| P5[Request Clarification<br>Flag Issues]
        P3 -->|DISPUTE| P6[DisputeResolution<br>Mediation Tracker]
        P1 --> P7[BudgetDashboard<br>Actual vs Budget]
        P1 --> P8[CostBenchmarking<br>Industry Comparison]
        P1 --> P9[AllowanceTracker<br>PC/PS Blowout Alerts]
    end

    subgraph EVIDENCE["EVIDENCE: Photos & Documents"]
        E1[ProgressPhotos<br>By Stage/Area + GPS] --> E2[DocumentVault<br>Contracts, Certs, Reports]
        E2 --> E3[SiteDiary<br>Evidence Mode: GPS+Weather+Tags]
        E3 --> E4[CommunicationLog<br>Call/Email/SMS/Meeting Records]
        E4 --> E5[WeeklyCheckIn<br>Builder Status Reports]
        E5 --> E6[ContractReviewChecklist<br>Pre-signing Validation]
        E6 --> E7[PreHandoverChecklist<br>Final Inspection Items]
        E7 --> E8[CertificationGate<br>Required Certificates]
    end

    subgraph AI["AI: Gemini & Claude Features"]
        AI1[describe-defect<br>FREE - Gemini Flash] -->|Photo + Description| AI2[Severity + Fix Advice<br>+ Standards Reference]
        AI3[stage-advice<br>PRO - Gemini Flash] -->|Current Stage| AI4[Timeline + Budget<br>+ Typical Issues]
        AI5[chat<br>PRO - Claude or Gemini] -->|Question| AI6[Construction Q&A<br>+ KB References]
        AI7[claim-review<br>PRO - Claude] -->|Invoice JSON| AI8[Risk Score + Flags<br>PAY/HOLD/DISPUTE]
        AI9[builder-check<br>DISABLED] -.->|No Real Data| AI10[Returns 503]

        AI11[Knowledge Base<br>Australian Standards] -->|Injected into Prompts| AI1
        AI11 --> AI3
        AI11 --> AI5
        AI11 --> AI7

        AI12[ai_cache<br>SHA-256 Key, 24hr TTL] -->|Cache Hit| AI13[Skip API Call<br>Return Cached]
        AI14[ai_usage_log<br>Telemetry] -->|Per-user Quotas| AI15{Quota<br>Exceeded?}
        AI15 -->|Yes| AI16[503 + Fallback Response]
        AI15 -->|No| AI17[Proceed with API Call]
    end

    subgraph COLLAB["COLLAB: Sharing & Referrals"]
        C1[ProjectMembers<br>Invite by Email] --> C2[3 Roles<br>Owner / Editor / Viewer]
        C2 --> C3[ShareProgressCard<br>Branded Social Card]
        C3 --> C4[Share Buttons<br>WhatsApp / X / Native]
        C1 --> C5[Referral Program<br>/guardian/refer]
        C5 -->|Successful Referral| C6[+7 Days Trial Bonus<br>Anti-abuse Guards]
    end

    subgraph EXPORT["EXPORT: Reports & Data"]
        EX1[ExportCenter] --> EX2[PDF Reports<br>6 Types via pdf-lib]
        EX2 --> EX3[Full Project Report]
        EX2 --> EX4[Defects Report]
        EX2 --> EX5[Variations Report]
        EX2 --> EX6[Payments Report]
        EX2 --> EX7[Dispute Package]
        EX2 --> EX8[Summary Report]
        EX1 --> EX9[Calendar .ics<br>Inspections + Milestones]
        EX1 --> EX10[Data Export<br>Full JSON for Privacy]
        EX1 --> EX11[TribunalExport<br>Legal Evidence Bundle]
    end

    subgraph ADMIN["ADMIN: Management Dashboard"]
        AD1[/guardian/admin<br>Email Allowlist + is_admin] --> AD2[User Stats<br>Total, Pro, Trial, Active]
        AD1 --> AD3[Project Stats<br>Count, Status, Contract Value]
        AD1 --> AD4[Defect Stats<br>Open, Severity, Aging]
        AD1 --> AD5[Revenue<br>Pro Count, Est. ARR]
        AD1 --> AD6[AI Usage<br>Calls, Cache Rate, Cost]
        AD1 --> AD7[User Manager<br>Search, Edit Tier, Reset]
        AD1 --> AD8[Support Inbox<br>Triage Messages]
        AD1 --> AD9[Announcements<br>Create/Publish Banners]
        AD1 --> AD10[Admin CSV Export<br>Injection-safe]
        AD1 --> AD11[Page Views<br>Last 30 Analytics]
        AD7 -->|Per-user Actions| AD12[Phone/Email Bypass<br>Trial Reset, Delete]
    end

    subgraph CRON["CRON: Scheduled Jobs via Netlify"]
        CR1[weekly-digest<br>Pro/Trial Email Summary] -->|Resend API| CR2[Project Summary Email<br>Defects, Stages, Payments]
        CR3[defect-reminders<br>Daily] -->|Overdue SLA| CR4[Builder Reminder Email]
        CR5[idle-users<br>Daily] -->|14+ Days Inactive| CR6[Re-engagement Email]
        CR7[cleanup-trials<br>Daily] -->|Expired trial_ends_at| CR8[Reset Tier to Free]
        CR9[social-post<br>Auto-post Cron] -->|10 Posts x 4 Platforms| CR10[Twitter, LinkedIn,<br>Bluesky, Facebook]
    end

    subgraph REALTIME["REALTIME: Live Sync & Offline"]
        RT1[Supabase Realtime<br>useRealtimeProject Hook] -->|postgres_changes| RT2[13 Tables Watched<br>500ms Debounce]
        RT2 --> RT3[Auto-refresh UI<br>On Insert/Update/Delete]
        RT4[Service Worker v3<br>Network-first Strategy] --> RT5[Precache Static Assets<br>Skip /auth /api /guardian]
        RT6[IndexedDB Queue<br>guardian_offline_queue] -->|Offline Mutations| RT7[Queue: Add Defect,<br>Approve Variation, etc.]
        RT7 -->|Reconnect| RT8[Replay Queued Mutations<br>In Order]
    end

    subgraph SECURITY["SECURITY: Guards & Policies"]
        S1[Supabase RLS<br>Row-level Security] --> S2[Users See Own Data Only]
        S3[Stripe Webhook<br>Signature Verification] --> S4[Idempotency via<br>stripe_webhook_events]
        S5[Phone OTP<br>SHA-256 Hashed] --> S6[Max 5 Attempts<br>10min Expiry]
        S7[AI Tier Gating<br>checkProAccess] --> S8[Quota Enforcement<br>ai_usage_log Counts]
        S9[Cron Auth<br>CRON_SECRET Bearer] --> S10[POST-only<br>Fail-closed]
        S11[CSP Header<br>Content Security Policy] --> S12[XSS Prevention]
        S13[CSV Injection Guard<br>Special Char Quoting] --> S14[Safe Admin Export]
    end

    %% Cross-subgraph connections
    A9 --> DASH
    DASH --> B1
    B1 --> DEFECTS
    B1 --> PAYMENTS
    B1 --> EVIDENCE
    B1 --> AI
    B1 --> COLLAB
    B1 --> EXPORT
    TIER -.->|Tier Enforcement| AI
    TIER -.->|Tier Enforcement| DEFECTS
    TIER -.->|Tier Enforcement| BUILD
    SECURITY -.->|Guards All Routes| AUTH
    SECURITY -.->|Guards All Routes| BUILD
    REALTIME -.->|Live Updates| BUILD
    REALTIME -.->|Live Updates| DEFECTS
    CRON -.->|Automated Emails| DEFECTS
    CRON -.->|Trial Cleanup| TIER

    style AUTH fill:#1e3a8a,color:#fff
    style ONBOARD fill:#065f46,color:#fff
    style TIER fill:#7c2d12,color:#fff
    style DASH fill:#1e40af,color:#fff
    style BUILD fill:#166534,color:#fff
    style DEFECTS fill:#991b1b,color:#fff
    style PAYMENTS fill:#92400e,color:#fff
    style EVIDENCE fill:#5b21b6,color:#fff
    style AI fill:#0e7490,color:#fff
    style COLLAB fill:#4338ca,color:#fff
    style EXPORT fill:#6d28d9,color:#fff
    style ADMIN fill:#374151,color:#fff
    style CRON fill:#78350f,color:#fff
    style REALTIME fill:#0f766e,color:#fff
    style SECURITY fill:#dc2626,color:#fff
```

## Subsystem Summary

| # | Subsystem | Description | Key Routes |
|---|-----------|-------------|------------|
| 1 | **Auth** | Email signup, email verify, phone OTP, Google OAuth, MFA | `/guardian/login`, `/api/guardian/phone-verify` |
| 2 | **Onboard** | 4-step wizard: build type, state, builder, project details | `/guardian/projects/new` |
| 3 | **Billing** | Free → Trial (7d) → Pro ($14.99/mo), Stripe checkout + webhooks | `/api/stripe/checkout`, `/api/stripe/webhook` |
| 4 | **Dashboard** | Health score, milestones, "Should I Pay?", upgrade CTAs | `/guardian/dashboard` |
| 5 | **Build** | Stage gates, checklists, Gantt timeline, NCC compliance | `/guardian/projects/[id]` |
| 6 | **Defects** | Photo capture → AI analysis → SLA → 4-level escalation → tribunal | `/api/guardian/ai/describe-defect` |
| 7 | **Payments** | Stage claims → AI review (PAY/HOLD/DISPUTE) → budget tracking | `/api/guardian/ai/claim-review` |
| 8 | **Evidence** | Photos (GPS), site diary, comms log, document vault, certs | `/guardian/projects/[id]` |
| 9 | **AI** | 5 routes (1 disabled), Gemini/Claude, KB-grounded, cached, quotas | `/api/guardian/ai/*` |
| 10 | **Collab** | Multi-user sharing (3 roles), referral rewards (+7d trial) | `/api/guardian/project-members` |
| 11 | **Export** | 6 PDF types, .ics calendar, JSON data export, tribunal bundle | `/api/guardian/export-pdf` |
| 12 | **Admin** | User/project/defect stats, support inbox, announcements, CSV | `/guardian/admin` |
| 13 | **Cron** | Weekly digest, defect reminders, idle re-engagement, trial cleanup | `/api/cron/*` |
| 14 | **Realtime** | Supabase Realtime (13 tables), IndexedDB offline queue, SW v3 | Client-side hooks |
| 15 | **Security** | RLS, CSP, webhook idempotency, OTP hashing, tier gating | Cross-cutting |

## Tier Comparison

| Feature | Free | Trial (7d) | Pro ($14.99/mo) |
|---------|------|------------|-----------------|
| Projects | 1 | Unlimited | Unlimited |
| Defects | 3 | Unlimited | Unlimited |
| Variations | 2 | Unlimited | Unlimited |
| AI calls/day | 5 | 20 | 50 |
| Chat/day | 0 | 10 | 30 |
| PDF Export | No | Yes | Yes |
| Support Chat | No | No | Yes |

## Data Flow

```
User Action → Next.js Route → Supabase (RLS) → PostgreSQL
                    ↓                              ↑
              AI Routes → Gemini/Claude      Realtime ← postgres_changes
                    ↓                              ↓
              ai_cache (24hr TTL)          useRealtimeProject hook
                    ↓                              ↓
              ai_usage_log (quotas)        Auto-refresh UI
```
