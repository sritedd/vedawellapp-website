# HomeOwner Guardian - Component Map

## Page Structure

```mermaid
flowchart TB
    subgraph PublicPages["Public Pages"]
        Home["/"]
        Tools["/tools"]
        Games["/games"]
    end
    
    subgraph GuardianPages["Guardian Pages (Protected)"]
        Login["/guardian/login"]
        Dashboard["/guardian/dashboard"]
        ProjectsList["/guardian/projects"]
        ProjectNew["/guardian/projects/new"]
        ProjectDetail["/guardian/projects/[id]"]
        Journey["/guardian/journey"]
    end
    
    Home --> GuardianPages
    Login -->|Auth| Dashboard
    Dashboard --> ProjectsList
    ProjectsList --> ProjectNew
    ProjectsList --> ProjectDetail
    Dashboard --> Journey
```

---

## Component Hierarchy

```mermaid
flowchart TB
    subgraph Pages["📄 Pages"]
        DashPage["dashboard/page.tsx"]
        ProjListPage["projects/page.tsx"]
        ProjNewPage["projects/new/page.tsx"]
        ProjDetailPage["projects/[id]/page.tsx"]
        JourneyPage["journey/page.tsx"]
    end
    
    subgraph Layouts["📐 Layouts"]
        RootLayout["layout.tsx"]
        GuardianNav["Navigation Component"]
    end
    
    subgraph ProjectComponents["🏗️ Project Components"]
        Overview["ProjectOverview"]
        Checklists["ProjectChecklists"]
        Variations["ProjectVariations"]
        Defects["ProjectDefects"]
        CertGate["CertificationGate"]
        DocVault["DocumentVault"]
        Reports["ReportGenerator"]
    end
    
    subgraph SharedComponents["🔧 Shared Components"]
        ChecklistCard["ChecklistItemCard"]
        BuildSelector["BuildTypeSelector"]
        Timeline["StateWorkflowTimeline"]
        RedFlags["RedFlagsChecker"]
    end
    
    subgraph DataLayer["💾 Data Layer"]
        SupaClient["lib/supabase/client.ts"]
        SupaServer["lib/supabase/server.ts"]
        MockClient["lib/supabase/mock.ts"]
        WorkflowData["data/australian-build-workflows.json"]
    end
    
    Pages --> Layouts
    ProjDetailPage --> ProjectComponents
    JourneyPage --> SharedComponents
    ProjectComponents --> SharedComponents
    ProjectComponents --> DataLayer
    SharedComponents --> DataLayer
```

---

## Component Details

### Page Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DashboardPage` | `/guardian/dashboard` | Overview stats, project summary |
| `ProjectsPage` | `/guardian/projects` | List all projects |
| `NewProjectPage` | `/guardian/projects/new` | 2-step project creation wizard |
| `ProjectDetailPage` | `/guardian/projects/[id]` | 7-tab project management |
| `JourneyPage` | `/guardian/journey` | Learning center with state selector |
| `LoginPage` | `/guardian/login` | Auth with dev mode option |

### Project Tab Components

| Component | Tab | Key Features |
|-----------|-----|--------------|
| `ProjectOverview` | Overview | Financial stats, construction timeline, builder info |
| `ProjectChecklists` | Checklists | Stage-based items, photo evidence, completion tracking |
| `ProjectVariations` | Variations | Cost tracking, threshold alerts, digital signatures |
| `ProjectDefects` | Defects | Issue logging, severity levels, photo evidence |
| `CertificationGate` | Certificates | Payment blocking, mandatory certs list |
| `DocumentVault` | Documents | 12 doc types, required tracking, file upload |
| `ReportGenerator` | Reports | 4 report types, Fair Trading template |

### Shared Components

| Component | Used By | Purpose |
|-----------|---------|---------|
| `ChecklistItemCard` | ProjectChecklists | Interactive checklist with photo upload |
| `BuildTypeSelector` | NewProjectPage | State & build category selection |
| `StateWorkflowTimeline` | JourneyPage | Construction stages with warnings |
| `RedFlagsChecker` | JourneyPage | Phase-specific builder warnings |

---

## Data Flow Between Components

```mermaid
flowchart LR
    subgraph StaticData["Static Data"]
        Workflows["australian-build-workflows.json"]
        Checklists["default-checklists.json"]
    end
    
    subgraph Selectors["Selection Components"]
        BuildSel["BuildTypeSelector"]
        StateSel["State Selector"]
    end
    
    subgraph Display["Display Components"]
        Timeline["StateWorkflowTimeline"]
        Flags["RedFlagsChecker"]
        Insurance["InsuranceInfo"]
    end
    
    Workflows --> Selectors
    Selectors -->|"state, buildType"| Display
    Workflows --> Display
    
    subgraph Database["Supabase Data"]
        Projects["projects table"]
        Stages["stages table"]
        Items["checklist_items table"]
    end
    
    subgraph CRUD["CRUD Components"]
        Overview["ProjectOverview"]
        ChecklistUI["ProjectChecklists"]
        VarsUI["ProjectVariations"]
    end
    
    Database <--> CRUD
```

---

## State Management

```mermaid
flowchart TB
    subgraph LocalState["React Local State (useState)"]
        Loading["loading: boolean"]
        Data["data: T[]"]
        FormData["form values"]
        UIState["expanded/collapsed, tabs"]
    end
    
    subgraph ServerState["Server State (Supabase)"]
        Projects["projects"]
        Stages["stages"]
        ChecklistItems["checklist_items"]
        Variations["variations"]
        Defects["defects"]
        Documents["documents"]
        Certifications["certifications"]
    end
    
    subgraph Fetch["Data Fetching"]
        UseEffect["useEffect hooks"]
        ClientCall["supabase.from().select()"]
    end
    
    LocalState <-.-> Fetch
    Fetch <--> ServerState
    
    Note["No global state management (Redux/Zustand)
    Each component fetches its own data"]
```

---

## File Structure

```
vedawell-next/
├── src/
│   ├── app/
│   │   ├── guardian/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Detail
│   │   │   ├── journey/
│   │   │   │   └── page.tsx          # Learning
│   │   │   └── login/
│   │   │       ├── page.tsx
│   │   │       └── actions.ts
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   └── guardian/
│   │       ├── ProjectOverview.tsx
│   │       ├── ProjectChecklists.tsx
│   │       ├── ProjectVariations.tsx
│   │       ├── ProjectDefects.tsx
│   │       ├── CertificationGate.tsx
│   │       ├── DocumentVault.tsx
│   │       ├── ReportGenerator.tsx
│   │       ├── ChecklistItemCard.tsx
│   │       ├── BuildTypeSelector.tsx
│   │       ├── StateWorkflowTimeline.tsx
│   │       ├── RedFlagsChecker.tsx
│   │       └── BuildJourneyTimeline.tsx
│   │
│   ├── data/
│   │   ├── australian-build-workflows.json
│   │   └── default-checklists.json
│   │
│   └── lib/
│       └── supabase/
│           ├── client.ts
│           ├── server.ts
│           └── mock.ts
│
├── supabase/
│   ├── schema.sql
│   └── schema_v2.sql
│
└── docs/
    ├── architecture.md
    ├── database-schema.md
    ├── user-workflows.md
    └── component-map.md
```
