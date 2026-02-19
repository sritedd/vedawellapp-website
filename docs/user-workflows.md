# HomeOwner Guardian - User Workflows

## Project Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Planning: Create Project
    Planning --> Active: Start Construction
    Active --> Active: Log Progress
    Active --> Paused: Pause Project
    Paused --> Active: Resume
    Active --> Completed: Final Inspection Passed
    Completed --> [*]
    
    state Active {
        [*] --> SiteStart
        SiteStart --> Slab
        Slab --> Frame
        Frame --> Lockup
        Lockup --> PrePlasterboard
        PrePlasterboard --> Fixing
        Fixing --> PracticalCompletion
        PracticalCompletion --> [*]
    }
```

---

## Project Creation Flow

```mermaid
flowchart TD
    Start([User clicks New Project]) --> Step1
    
    subgraph Step1["Step 1: Build Type & State"]
        SelectState["Select Australian State"]
        SelectType["Select Build Type"]
        ViewInfo["View Insurance/Regulator Info"]
    end
    
    Step1 --> Continue{Continue?}
    Continue -->|Yes| Step2
    Continue -->|Back| Step1
    
    subgraph Step2["Step 2: Project Details"]
        ProjectName["Enter Project Name"]
        BuilderInfo["Enter Builder Details"]
        ContractValue["Enter Contract Value"]
        Address["Enter Site Address"]
        InsuranceInfo["Enter HBCF Policy"]
    end
    
    Step2 --> Submit{Submit}
    Submit -->|Success| Seed
    Submit -->|Error| Step2
    
    subgraph Seed["Auto-Seed"]
        CreateProject["Create Project Record"]
        CreateStages["Create State-Specific Stages"]
        CreateChecklists["Create Checklist Items"]
        CreateCerts["Create Required Certifications"]
    end
    
    Seed --> Dashboard([Redirect to Dashboard])
```

---

## Checklist Completion Flow

```mermaid
flowchart TD
    Start([User views checklist]) --> Item
    
    Item["Checklist Item"]
    Item --> Check{Is Critical?}
    
    Check -->|No| Toggle["Toggle Completion"]
    Check -->|Yes| PhotoCheck{Photo Required?}
    
    PhotoCheck -->|No| Toggle
    PhotoCheck -->|Yes| HasPhoto{Has Photo?}
    
    HasPhoto -->|Yes| Toggle
    HasPhoto -->|No| UploadPrompt["Show Upload Prompt"]
    
    UploadPrompt --> SelectFile["User Selects Photo"]
    SelectFile --> Validate["Validate File Type/Size"]
    
    Validate -->|Invalid| Error["Show Error"]
    Error --> UploadPrompt
    
    Validate -->|Valid| Upload["Upload to Supabase Storage"]
    Upload --> SaveURL["Save Evidence URL"]
    SaveURL --> Toggle
    
    Toggle --> Update["Update Database"]
    Update --> Refresh["Refresh UI"]
    Refresh --> End([Item Marked Complete])
```

---

## Variation Approval Flow

```mermaid
flowchart TD
    Start([Builder Submits Variation]) --> Create
    
    Create["Variation Created"]
    Create --> Status["Status: Draft → Sent"]
    
    Status --> Review["Homeowner Reviews"]
    Review --> Decision{Decision}
    
    Decision -->|Approve| Sign["Digital Signature Required"]
    Decision -->|Reject| Reject["Status: Rejected"]
    Decision -->|Dispute| Dispute["Generate Dispute Letter"]
    
    Sign --> Capture["Capture Signature"]
    Capture --> Save["Save Signature to Storage"]
    Save --> Approved["Status: Approved"]
    
    Approved --> Check{Threshold Check}
    Check -->|>10%| Warning["Show Threshold Warning"]
    Check -->|>15%| Alert["Critical Alert + Dispute Template"]
    Check -->|≤10%| OK["No Alert"]
    
    Warning --> End([Variation Complete])
    Alert --> End
    OK --> End
    Reject --> End
    Dispute --> End
```

---

## Certification Gate Flow

```mermaid
flowchart TD
    Start([User Views Certificates Tab]) --> Fetch
    
    Fetch["Fetch Required Certs for Stage"]
    Fetch --> Check{All Uploaded?}
    
    Check -->|Yes| Cleared["✅ Payment Cleared"]
    Check -->|No| Blocked["🚫 Payment Blocked"]
    
    Blocked --> List["List Missing Certificates"]
    List --> Upload["User Uploads Certificate"]
    Upload --> Validate["Validate File"]
    Validate --> Save["Save to Database"]
    Save --> Recheck["Recheck Completion"]
    Recheck --> Check
    
    Cleared --> Safe["Safe to Make Payment"]
    Safe --> End([Continue Build])
```

---

## Report Generation Flow

```mermaid
flowchart LR
    Start([User Clicks Generate]) --> Type
    
    Type{Report Type}
    Type -->|Summary| Summary["Compile Project Summary"]
    Type -->|Variations| Vars["Compile Variation List"]
    Type -->|Defects| Defects["Compile Defect List"]
    Type -->|Dispute| Dispute["Generate Dispute Package"]
    
    Summary --> Format
    Vars --> Format
    Defects --> Format
    Dispute --> Format
    
    Format["Format as Text File"]
    Format --> Download["Trigger Download"]
    Download --> End([User Receives File])
    
    Dispute --> Extra["Include:
    - Fair Trading Template
    - Attachment Checklist
    - Next Steps Guide"]
    Extra --> Format
```

---

## Fair Trading Dispute Flow

```mermaid
flowchart TD
    Start([Issue Identified]) --> Log
    
    Log["Log in Guardian"]
    
    subgraph Evidence["Gather Evidence"]
        Photos["Photo Evidence"]
        Variations["Variation Records"]
        Defects["Defect Records"]
        Docs["Contracts & Certs"]
    end
    
    Log --> Evidence
    Evidence --> Generate["Generate Dispute Package"]
    
    Generate --> Package["Dispute Package Includes:
    - Complainant Details
    - Project Information
    - Financial Summary
    - Disputed Variations
    - Outstanding Defects
    - Attachments Checklist"]
    
    Package --> Lodge["Lodge with Fair Trading"]
    
    Lodge --> Response{Response}
    Response -->|Resolved| Close["Close Dispute"]
    Response -->|Unresolved| NCAT["Escalate to NCAT"]
    
    NCAT --> Hearing["Tribunal Hearing"]
    Hearing --> Outcome([Resolution])
    Close --> End([Issue Resolved])
```

---

## Build Journey Learning Flow

```mermaid
flowchart LR
    Start([User Visits Journey Page]) --> Select
    
    subgraph Select["Select Context"]
        State["Choose State"]
        Type["Choose Build Type"]
    end
    
    Select --> Tab{Tab Selected}
    
    Tab -->|Stages| Stages["View Construction Stages
    - Approval Pathways
    - Inspections
    - Certificates
    - Warnings"]
    
    Tab -->|Red Flags| Flags["View Red Flags
    - Pre-Contract Warnings
    - During Construction
    - At Handover"]
    
    Tab -->|Insurance| Insurance["View Insurance Info
    - State Scheme
    - Thresholds
    - Warranty Periods
    - Regulator Links"]
    
    Stages --> Expand["Expand Stage Details"]
    Expand --> Checklist["View Critical Checklist"]
    Checklist --> Rights["Know Your Rights"]
```
