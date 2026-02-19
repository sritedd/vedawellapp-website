# HomeOwner Guardian - Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "creates"
    PROFILES ||--o{ PROJECTS : "owns"
    PROJECTS ||--o{ STAGES : "has"
    PROJECTS ||--o{ VARIATIONS : "has"
    PROJECTS ||--o{ DEFECTS : "has"
    PROJECTS ||--o{ CERTIFICATIONS : "requires"
    PROJECTS ||--o{ DOCUMENTS : "stores"
    PROJECTS ||--o{ INSPECTIONS : "schedules"
    PROJECTS ||--o{ WEEKLY_CHECKINS : "tracks"
    STAGES ||--o{ CHECKLIST_ITEMS : "contains"
    
    AUTH_USERS {
        uuid id PK
        string email
        jsonb raw_user_meta_data
    }
    
    PROFILES {
        uuid id PK,FK
        string email
        string full_name
        string role
        timestamp created_at
    }
    
    PROJECTS {
        uuid id PK
        uuid user_id FK
        string name
        string builder_name
        string builder_license_number
        string builder_abn
        string hbcf_policy_number
        date insurance_expiry_date
        numeric contract_value
        date start_date
        string status
        string address
        timestamp created_at
    }
    
    STAGES {
        uuid id PK
        uuid project_id FK
        string name
        string status
        date completion_date
        timestamp created_at
    }
    
    CHECKLIST_ITEMS {
        uuid id PK
        uuid stage_id FK
        string description
        boolean is_completed
        boolean is_critical
        boolean requires_photo
        string evidence_url
        timestamp completed_at
        timestamp created_at
    }
    
    VARIATIONS {
        uuid id PK
        uuid project_id FK
        string title
        string description
        numeric additional_cost
        numeric labour_cost
        numeric material_cost
        string status
        string reason_category
        string builder_signature_url
        string homeowner_signature_url
        timestamp signed_at
        timestamp approved_by_user_at
        timestamp created_at
    }
    
    DEFECTS {
        uuid id PK
        uuid project_id FK
        string title
        string description
        string severity
        string status
        string image_url
        string location
        timestamp created_at
    }
    
    CERTIFICATIONS {
        uuid id PK
        uuid project_id FK
        string type
        string status
        string file_url
        date expiry_date
        string required_for_stage
        timestamp uploaded_at
        timestamp created_at
    }
    
    DOCUMENTS {
        uuid id PK
        uuid project_id FK
        string type
        string name
        string file_url
        timestamp uploaded_at
    }
    
    INSPECTIONS {
        uuid id PK
        uuid project_id FK
        string stage
        date scheduled_date
        string result
        string inspector_name
        string notes
        string report_url
        timestamp created_at
    }
    
    WEEKLY_CHECKINS {
        uuid id PK
        uuid project_id FK
        date week_start
        boolean builder_responsive
        boolean received_update
        string notes
        timestamp created_at
    }
```

---

## Table Relationships Summary

| Parent | Child | Relationship | Cascade Delete |
|--------|-------|--------------|----------------|
| auth.users | profiles | 1:1 | - |
| profiles | projects | 1:N | No |
| projects | stages | 1:N | Yes |
| projects | variations | 1:N | Yes |
| projects | defects | 1:N | Yes |
| projects | certifications | 1:N | Yes |
| projects | documents | 1:N | Yes |
| projects | inspections | 1:N | Yes |
| projects | weekly_checkins | 1:N | Yes |
| stages | checklist_items | 1:N | Yes |

---

## Row Level Security (RLS) Policies

```mermaid
flowchart TD
    subgraph Request["Incoming Request"]
        User["auth.uid()"]
        Table["Target Table"]
        Action["SELECT/INSERT/UPDATE/DELETE"]
    end
    
    subgraph Check["RLS Policy Check"]
        Direct["Direct ownership check"]
        Nested["Nested project ownership check"]
    end
    
    subgraph Result["Result"]
        Allow["✅ Allow"]
        Deny["❌ Deny"]
    end
    
    Request --> Check
    
    Direct -->|"profiles: id = auth.uid()"| Allow
    Direct -->|"projects: user_id = auth.uid()"| Allow
    
    Nested -->|"stages/variations/etc: project.user_id = auth.uid()"| Allow
    Nested -->|"checklist_items: stage.project.user_id = auth.uid()"| Allow
    
    Check -->|No match| Deny
```

---

## Status Enums

### Project Status
| Value | Description |
|-------|-------------|
| `planning` | Initial planning phase |
| `active` | Construction in progress |
| `completed` | Build finished |
| `paused` | Temporarily on hold |

### Stage Status
| Value | Description |
|-------|-------------|
| `pending` | Not started |
| `in_progress` | Currently underway |
| `completed` | Work finished |
| `verified` | Inspected and approved |

### Variation Status
| Value | Description |
|-------|-------------|
| `draft` | Being prepared |
| `sent` | Sent to homeowner |
| `approved` | Homeowner approved |
| `rejected` | Homeowner rejected |

### Defect Severity
| Value | Description |
|-------|-------------|
| `minor` | Cosmetic issues |
| `major` | Functional problems |
| `critical` | Safety concerns |

### Certification Status
| Value | Description |
|-------|-------------|
| `pending` | Not yet provided |
| `uploaded` | File uploaded |
| `verified` | Confirmed valid |
| `expired` | Past expiry date |
