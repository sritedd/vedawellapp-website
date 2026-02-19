# HomeOwner Guardian - System Architecture

## Overview

HomeOwner Guardian is a Next.js application that helps Australian homeowners track their building projects, protect against unethical builder practices, and prepare for Fair Trading disputes if needed.

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["🌐 Client (Browser)"]
        UI["Next.js React UI"]
        PWA["PWA Service Worker"]
    end
    
    subgraph NextJS["⚡ Next.js Application"]
        Pages["App Router Pages"]
        Components["React Components"]
        ServerActions["Server Actions"]
        API["API Routes"]
    end
    
    subgraph Supabase["🔐 Supabase Backend"]
        Auth["Authentication"]
        DB["PostgreSQL Database"]
        Storage["File Storage"]
        RLS["Row Level Security"]
    end
    
    subgraph External["🌍 External Services"]
        FairTrading["NSW Fair Trading"]
        LicenseCheck["Builder License Lookup"]
    end
    
    UI --> Pages
    Pages --> Components
    Components --> ServerActions
    ServerActions --> Auth
    ServerActions --> DB
    Components --> Storage
    DB --> RLS
    UI -.-> FairTrading
    UI -.-> LicenseCheck
```

---

## Technology Stack

```mermaid
flowchart LR
    subgraph Frontend
        Next["Next.js 14+"]
        React["React 18"]
        TW["Tailwind CSS"]
        TS["TypeScript"]
    end
    
    subgraph Backend
        Supa["Supabase"]
        PG["PostgreSQL"]
        SStorage["Supabase Storage"]
        SAuth["Supabase Auth"]
    end
    
    subgraph Hosting
        Netlify["Netlify"]
        CDN["Edge CDN"]
    end
    
    Frontend --> Backend
    Backend --> Hosting
```

---

## Component Architecture

```mermaid
flowchart TB
    subgraph Layout["App Layout"]
        Nav["Navigation"]
        Footer["Footer"]
    end
    
    subgraph Guardian["Guardian Module"]
        Dashboard["Dashboard Page"]
        Projects["Projects List"]
        ProjectDetail["Project Detail"]
        Journey["Learning Center"]
        Login["Auth Pages"]
    end
    
    subgraph ProjectTabs["Project Detail Tabs"]
        Overview["ProjectOverview"]
        Checklists["ProjectChecklists"]
        Variations["ProjectVariations"]
        Defects["ProjectDefects"]
        Certs["CertificationGate"]
        Docs["DocumentVault"]
        Reports["ReportGenerator"]
    end
    
    subgraph SharedComponents["Shared Components"]
        ChecklistCard["ChecklistItemCard"]
        BuildSelector["BuildTypeSelector"]
        Timeline["StateWorkflowTimeline"]
        RedFlags["RedFlagsChecker"]
    end
    
    Layout --> Guardian
    ProjectDetail --> ProjectTabs
    ProjectTabs --> SharedComponents
```

---

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph User["👤 User Actions"]
        Create["Create Project"]
        Upload["Upload Document"]
        Complete["Complete Checklist"]
        Sign["Sign Variation"]
    end
    
    subgraph Client["Client Layer"]
        Form["Form Component"]
        Handler["Event Handler"]
    end
    
    subgraph Supabase["Supabase Layer"]
        SupaClient["Supabase Client"]
        RLS["RLS Check"]
        Table["Database Table"]
        Bucket["Storage Bucket"]
    end
    
    User --> Form
    Form --> Handler
    Handler --> SupaClient
    SupaClient --> RLS
    RLS -->|Authorized| Table
    RLS -->|Authorized| Bucket
    RLS -->|Denied| Error["Error Response"]
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Login Page
    participant SA as Server Action
    participant Auth as Supabase Auth
    participant DB as Database
    
    U->>L: Enter credentials
    L->>SA: signInWithPassword()
    SA->>Auth: Authenticate
    Auth-->>SA: JWT Token + User
    SA->>DB: Fetch user profile
    DB-->>SA: Profile data
    SA-->>L: Redirect to Dashboard
    L-->>U: Show Dashboard
    
    Note over Auth,DB: JWT stored in httpOnly cookie
    Note over SA: Session validated on each request
```

---

## File Upload Security Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant V as Validator
    participant S as Supabase Storage
    participant DB as Database
    
    U->>C: Select file
    C->>V: Validate type/size
    alt Invalid
        V-->>C: Show error
        C-->>U: Display message
    else Valid
        V->>S: Upload to bucket
        S-->>V: Return file URL
        V->>DB: Save document record
        DB-->>C: Confirm save
        C-->>U: Show success
    end
```

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Dev["Development"]
        Local["localhost:3007"]
        MockDB["Mock Supabase Client"]
        DevCookie["dev_mode Cookie"]
    end
    
    subgraph Staging["Staging"]
        NetlifyPreview["Netlify Preview"]
        SupabaseStaging["Supabase Staging"]
    end
    
    subgraph Production["Production"]
        NetlifyProd["Netlify Production"]
        SupabaseProd["Supabase Production"]
        CustomDomain["Custom Domain"]
    end
    
    Dev -->|PR Push| Staging
    Staging -->|Merge to main| Production
    
    Note over Dev: NODE_ENV=development
    Note over Production: NODE_ENV=production
```
