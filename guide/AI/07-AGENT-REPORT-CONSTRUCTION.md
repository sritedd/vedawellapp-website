# AI in Construction Technology -- Research Report
**Date:** March 18, 2026
**Purpose:** Market research for VedaWell Guardian AI feature planning

---

## 1. Existing AI Construction Apps & Startups (2024-2026)

### 1.1 Major Platforms -- AI Features

#### Procore
- **AI Assistant ("Procore Assist")**: Natural language queries across project data
- **Procore Agent Builder**: Custom AI agents for construction workflows
- **Datagrid Acquisition** (2025): Acquired vertical AI firm for agentic AI capabilities -- connects third-party data sources (ERP, cloud storage) to break down data silos
- **AI Scheduling** (GA Q1 2026): Build and manage schedules inside Procore, integrates with Primavera P6 and MS Project
- **URL**: https://www.procore.com

#### OpenSpace
- **Visual Intelligence Platform**: 360-degree photo documentation mapped to floor plans
- **AI Image Enhance**: Auto-sharpens 360 images with one click
- **QuickCodes**: Speed up capture and training
- **Multi-platform Sync**: Procore, Autodesk Construction Cloud, BIM 360, PlanGrid, Revizto
- **Acquired Disperse** (late 2025): Progress tracking startup
- **Capture Method**: 360 camera on hard hat, smartphones, drones, laser scanners
- **Processing**: Images ready to view within 15 minutes of upload
- **Pricing**: Based on annual construction volume (ACV), Core or Enterprise tiers
- **URL**: https://www.openspace.ai

#### Doxel
- **AI Progress Tracking**: Computer vision analyzes 360 video to measure work-in-place
- **How It Works**: Crew member wears 360 camera on hard hat; Doxel CV compares plans to actual progress
- **Accuracy**: 99%+ accurate work-in-place reporting
- **Coverage**: Quantities for 80+ stages of construction, all visible trades
- **Results**: 11% schedule acceleration, 10% monthly cash flow savings, 95% reduction in progress tracking time
- **Integrations**: P6, Procore, Autodesk
- **Pricing**: Per square foot, custom quotes
- **URL**: https://doxel.ai

#### Buildxact (Australian)
- **"Blu" AI Assistant**: Digital building assistant trained on thousands of residential projects
- **AI Estimate Generator**: Creates complete editable estimates for project types (bathroom, kitchen renovations) in seconds
- **Takeoff Assistant**: Auto-scales uploaded plans, names pages, measures areas automatically
- **Assembly Assistant**: Builds accurate estimates on repeatable job types
- **Estimate Reviewer**: Flags common errors before quotes go out
- **Live Supplier Pricing**: Real-time pricing from local material suppliers
- **Natural Language Interface**: Users interact with Blu conversationally
- **URL**: https://www.buildxact.com/au/

#### PlanGrid (now Autodesk Build)
- Merged into Autodesk Construction Cloud
- Features: Document management, field reporting, issue tracking
- AI capabilities now integrated into broader Autodesk platform

### 1.2 Defect Detection Startups

#### Buildcheck (San Francisco, Stanford founders)
- **What**: AI-powered construction design review platform
- **Funding**: $5.9M seed (Uncork Capital, Peterson Ventures, Xfund; angels from OpenAI, Zillow, CBRE)
- **How It Works**: Analyzes construction drawings across all disciplines (architectural, structural, civil, MEP) performing hundreds of checks
- **Detects**: Errors, omissions, coordination issues that human reviewers miss
- **ROI**: 10-35x by preventing field issues during pre-construction
- **Customers**: 50+ paying customers including AvalonBay Communities, Novo Construction
- **URL**: https://buildcheck.ai

#### Wenti Labs (Singapore)
- Snap photos on-site, AI auto-generates defect reports
- No manual data entry required

#### Articulate (Y Combinator Fall 2025)
- AI-powered drawing analysis for construction and solar contractors
- Audits designs for code compliance before construction
- Detects clashes early

### 1.3 Australian ConTech

#### Puralink (Australia)
- Raised $2.3M Pre-Seed
- Robotic "ferrets" for pipe inspection with CCTV, LiDAR, mapping data

#### Market Context
- 2024: 35% of ConTech capital went to AI-enabled solutions
- 2025: That surged to **77%** ($5.05 billion)
- 2025 total global ConTech investment: ~$6.57 billion across 337 deals
- Enhanced Productivity category: 64% of total deals

---

## 2. Builder Reputation & Review Checking

### 2.1 State Builder License Verification

#### NSW -- Fair Trading
- **Complaints Register**: Lists businesses with 10+ complaints in one calendar month
  - Published second half of each month for previous month
  - URL: https://www.fairtrading.nsw.gov.au/help-centre/online-tools/complaints-register
- **Data.NSW**: Statistics on home building complaints by cause, defect, industry type
  - Datasets on license applications, licensed entities, license classes, owner-builder permits
  - URL: https://data.nsw.gov.au/data/organization/fair-trading
- **No official API** -- data available as downloadable datasets
- **Programmatic approach**: Scrape or download CSV datasets from Data.NSW

#### Queensland -- QBCC
- **Online License Search**: https://my.qbcc.qld.gov.au/s/search-a-register
- **Open Data Portal**: Full licensed contractors register available
  - URL: https://www.data.qld.gov.au/dataset/qbcc-licensed-contractors-register
  - Includes: licence number, name, business address, licence class, financial category
  - **CKAN API available** through Queensland Government Open Data Portal
- **Data Request**: There is a pending data request for a dedicated QBCC license search API
- **Third-party**: WorkClear offers 108K+ QBCC builders searchable via web or API
  - URL: https://www.workclear.com.au/verify/qbcc

#### Victoria -- VBA (now Building & Plumbing Commission since July 2025)
- **Practitioner Search**: https://bams.vba.vic.gov.au/bams/s/practitioner-search
  - Search by name or registration number
  - Shows registration status, category, conditions
- **Open Data**: VBA Building Practitioner Register on Data.vic.gov.au
  - URL: https://discover.data.vic.gov.au/dataset?tags=VBA
- **No official API** -- web search interface + downloadable datasets

#### DBDRV (Domestic Building Dispute Resolution Victoria)
- No public API found
- Dispute resolution body, not a license registry
- Cases are confidential

### 2.2 ABN Lookup API (Australian Business Register)

- **Official API**: Free, publicly available
  - URL: https://abr.business.gov.au/Tools/WebServices
  - Registration required (receive authentication GUID)
  - Protocols: SOAP, HTTP GET/POST, **JSON** available
  - JSON endpoint: https://abr.business.gov.au/json/
- **Search Methods**: Search by ABN, ASIC number, name, ABN status
- **Data Returned**: Business name, ABN, entity type, status, GST registration, location
- **Libraries**:
  - PHP: https://github.com/hyraiq/abnlookup
  - Ruby: https://github.com/Oneflare/abn_search
- **Use Case for Guardian**: Verify builder's ABN is active, check entity type, confirm GST registration

### 2.3 Google Reviews

- **Official Google Business Profile API**: For managing your own reviews only
- **No official API for reading other businesses' reviews**
- **Third-party options**:
  - **Outscraper**: Google Business Reviews API -- extract ratings, content, timestamps, reviewer details
    - URL: https://outscraper.com/google-business-reviews-api/
  - **Apify**: Google Maps Reviews scraper/API
    - URL: https://apify.com/agents/google-maps-reviews/api
  - **Scrapingdog**: Google Maps & Reviews API
- **Sentiment Analysis**: Google Cloud Natural Language API for sentiment scoring
  - URL: https://docs.google.com/natural-language/docs/sentiment-tutorial

### 2.4 Trustpilot API

- **Official Developer Portal**: https://developers.trustpilot.com/
- **Available APIs**:
  - Business Units API (public): Look up business profiles
  - Service Reviews API: Access service reviews
  - Product Reviews API: Access product reviews
- **Limits**: Up to 100,000 reviews per business unit
- **Authentication**: OAuth 2.0
- **Use Case**: Search for builder's Trustpilot profile, retrieve reviews, analyze sentiment

### 2.5 Practical Sentiment Analysis Approach

For a small SaaS like Guardian, the recommended approach:
1. Use ABN Lookup API to verify builder legitimacy (free)
2. Use QBCC open data / NSW Fair Trading datasets for complaint history
3. Scrape Google Reviews via third-party API (Outscraper ~$3/1000 reviews)
4. Run sentiment analysis using an LLM (cheaper than Google NLP API)
5. Present a "Builder Trust Score" combining: ABN status + license status + complaint count + review sentiment

---

## 3. AI for Construction Defect Detection

### 3.1 Computer Vision Models

#### Pre-trained Foundation Models
- **Segment Anything Model (SAM)**: Fine-tuned for crack segmentation using LoRA (Low-Rank Adaptation)
  - Enables automatic crack segmentation without full network fine-tuning
  - Cost-effective adaptation
- **GPT-4 Vision / GPT-4o**: Can analyze construction photos for visible defects
  - Not purpose-built but surprisingly capable for general defect identification
  - Can describe issues in natural language

#### YOLO-based Models (Best for Real-time Detection)
- **YOLOv8 for crack detection**: 88.7% mAP@0.5, 69.4% mAP@0.5:0.95
- **Improved YOLOv8s**: mAP@0.5 of 96.26% on surface defects
- **YOLOv5n improved**: 75.3% mAP on NEU-DET dataset
- **Real-time capable**: 2-4x faster inference with attention mechanisms

#### Transformer-based Models
- **CrackFormer**: Hybrid-window attentive vision framework
  - Dense local windows for fine-grained features
  - Sparse global windows for context
  - Designed for complex pavement crack patterns

### 3.2 Available Datasets

#### UAV Building Surface Defects Dataset (2025)
- **14,471 high-resolution images**
- **6 structural types**, 5 defect categories:
  - Cracks, abscission, leakage, corrosion, bulging
- Diverse illumination and environmental conditions
- Published in Nature Scientific Data
- URL: https://www.nature.com/articles/s41597-025-06318-5

#### Awesome Crack Detection (GitHub)
- Comprehensive paper list of deep learning for crack detection
- Organized by learning paradigms, generalizability, datasets
- URL: https://github.com/nantonzhang/Awesome-Crack-Detection

#### NEU-DET Dataset
- Standard benchmark for surface defect detection
- Widely used for YOLO model evaluation

### 3.3 Accuracy Comparison

| Method                              | Accuracy    |
|--------------------------------------|-------------|
| Pre-trained CNNs                     | ~99%        |
| YOLO v8 (optimized, crack detection) | 88.7% mAP  |
| YOLO v8s (improved, surface defects) | 96.3% mAP  |
| Laser vision                         | 97.1%       |
| Operational Modal Analysis           | 97.0%       |
| Grey correlation (traditional)       | 86.8%       |
| Visual inspection (human)            | 80%         |

**Key takeaway**: AI methods outperform human visual inspection by 10-20%.

### 3.4 Practical Approach for Guardian

For a small SaaS, training custom CV models is impractical. Instead:

1. **Use GPT-4o Vision API**: Upload photo, ask "identify construction defects in this image"
   - Cost: ~$0.003-0.01 per image analysis
   - Accuracy: Good for obvious defects (cracks, water staining, misalignment)
   - No training data needed

2. **Use Claude Vision (Haiku)**: Even cheaper for basic analysis
   - Cost: ~$0.001-0.005 per image

3. **Guided Photo Capture**: Prompt users to photograph specific items at each stage
   - More valuable than AI detection: structured checklists with photo evidence

---

## 4. Smart Construction Advice Systems

### 4.1 Australian Building Code (NCC) Digital Resources

- **NCC Online**: https://ncc.abcb.gov.au/
  - Full text of National Construction Code
  - Performance-based code with prescriptive deemed-to-satisfy provisions
- **XML Data Available**: NCC 2022 in XML format on data.gov.au
  - URL: https://data.gov.au/data/dataset/national-construction-code-ncc-2022
  - Can be parsed and indexed for RAG system
- **NCC 2025**: Preview drafts available on ABCB website
- **Structure**: Section-Part-Type-Clause system, web-accessible

### 4.2 State-Specific Building Regulations

| State | Resource |
|-------|----------|
| NSW   | Building Commission NSW, EPA requirements |
| VIC   | VBA/BPC regulatory framework, NCC 2022 adoption |
| QLD   | QBCC regulations, Department of Housing |
| All   | Australian Standards (AS 1684 timber framing, AS 3740 waterproofing, etc.) |

### 4.3 Stage Inspection Knowledge Base

Key stages and what to check (ideal for RAG system):

#### Pre-Slab / Base Stage
- Site preparation, drainage, termite barriers
- Concrete footings depth and reinforcement
- Plumbing rough-in positions

#### Frame Stage
- AS 1684 timber framing compliance
- Wall plumbness and bracing
- Roof truss layout, installation, bracing
- Stress grades, wind braces, lintels
- Tie-down connections, ceiling height
- Engineering plan compliance

#### Lock-Up Stage
- External cladding, windows, doors installed
- Weatherproofing and sealing
- Sarking under roofing materials
- Flashings properly installed
- Damp-proof course

#### Fix / Waterproofing Stage
- Wet area waterproofing membrane (AS 3740)
- No gaps, tears, or coverage issues
- Internal linings, plasterboard
- Electrical and plumbing rough-in

#### Practical Completion
- All finishes, fixtures, fittings
- Defect identification
- Compliance certificate

### 4.4 RAG Implementation for Construction Advice

#### Architecture
```
User Question --> Embedding --> Vector Search --> Relevant NCC/checklist chunks --> LLM --> Answer
```

#### Data Sources to Index
1. NCC XML data (download from data.gov.au)
2. Australian Standards summaries (AS 1684, AS 3740, etc.)
3. State-specific requirements (NSW, VIC, QLD variations)
4. Stage inspection checklists (frame, lock-up, fix, completion)
5. Common defect guides with photos

#### Tech Stack for RAG
- **Vector DB**: Supabase pgvector (already using Supabase)
- **Embeddings**: OpenAI text-embedding-3-small ($0.02/1M tokens)
- **LLM**: GPT-5 nano or Claude Haiku for answers
- **Framework**: Vercel AI SDK (built for Next.js)

#### Estimated Corpus Size
- NCC full text: ~500K tokens
- Stage checklists: ~50K tokens
- Common defects guide: ~100K tokens
- Total embedding cost: ~$0.01 (one-time)

---

## 5. Practical AI Integration for Guardian

### 5.1 Vercel AI SDK (Recommended for Next.js)

The official way to add AI to Next.js apps:

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai('gpt-5-nano'),
    system: 'You are a construction inspection advisor...',
    messages,
  });
  return result.toDataStreamResponse();
}
```

```typescript
// Client component
'use client';
import { useChat } from '@ai-sdk/react';

export function ConstructionAdvisor() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  // renders chat UI
}
```

- **Streaming**: Built-in SSE streaming
- **Multi-provider**: Supports OpenAI, Anthropic, Google, xAI
- **URL**: https://ai-sdk.dev/docs/getting-started/nextjs-app-router

### 5.2 Token Cost Estimation for Construction Chatbot

#### Per-Conversation Cost (typical homeowner Q&A)

| Component | Tokens | Cost (GPT-5 nano) | Cost (Claude Haiku 4.5) |
|-----------|--------|-------|--------|
| System prompt | 500 | $0.000025 | $0.0005 |
| RAG context (3 chunks) | 1,500 | $0.000075 | $0.0015 |
| User message | 100 | $0.000005 | $0.0001 |
| AI response | 500 | $0.0002 | $0.0025 |
| **Total per exchange** | 2,600 | **$0.0003** | **$0.004** |

#### Monthly Cost Projections

| Users | Queries/user/mo | Monthly Cost (GPT-5 nano) | Monthly Cost (Haiku 4.5) |
|-------|-----------------|---------------------------|--------------------------|
| 100   | 10              | $0.30                     | $4.00                    |
| 500   | 10              | $1.50                     | $20.00                   |
| 1,000 | 15              | $4.50                     | $60.00                   |
| 5,000 | 15              | $22.50                    | $300.00                  |

#### Current LLM Pricing (Early 2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| GPT-5 nano | $0.05 | $0.40 | Cheapest, simple Q&A |
| GPT-5 mini | $0.25 | $2.00 | Good balance |
| Claude Haiku 4.5 | $1.00 | $5.00 | Better reasoning |
| Gemini 3 Flash | $0.50 | $3.00 | Multimodal |
| Grok 4.1 | $0.20 | $0.50 | Budget alternative |

**Recommendation**: Start with GPT-5 nano for text Q&A, use GPT-4o or Claude for image analysis (defect photos).

### 5.3 Affordable AI Features for Guardian (Priority Order)

#### Tier 1 -- Low Cost, High Value (implement first)
1. **Stage Inspection Advisor** (RAG chatbot)
   - "What should I check at the frame stage?"
   - Cost: ~$5/month for 500 users
   - Uses: Vercel AI SDK + Supabase pgvector + GPT-5 nano

2. **Builder Verification**
   - ABN Lookup API (free)
   - QBCC/VBA license data (free, open data)
   - Display: ABN status, license class, financial category

3. **Defect Description Assistant**
   - User describes issue in text, AI suggests: severity, likely cause, relevant NCC clause, what to tell builder
   - Cost: ~$3/month for 500 users

#### Tier 2 -- Medium Cost, High Value
4. **Photo Defect Analysis**
   - Upload photo, AI identifies potential issues
   - Use GPT-4o vision or Claude vision
   - Cost: ~$0.01 per photo, ~$50/month for 5000 photos

5. **Builder Review Aggregator**
   - Pull Google Reviews via Outscraper API (~$3/1000)
   - Run sentiment analysis with LLM
   - Generate "Builder Trust Score"

#### Tier 3 -- Higher Investment
6. **Smart Contract Clause Checker**
   - Upload building contract PDF, AI highlights concerning clauses
   - Needs careful prompt engineering and disclaimers

7. **NCC Compliance Q&A**
   - Full RAG over NCC XML data
   - Answer: "Does my bathroom need waterproofing up to 1800mm?"

### 5.4 Architecture Recommendation

```
Guardian App (Next.js)
├── /api/ai/chat          -- Vercel AI SDK streaming endpoint
├── /api/ai/analyze-photo -- Image analysis endpoint
├── /api/builder/verify   -- ABN + license check
├── /api/builder/reviews  -- Review aggregation
│
├── Supabase
│   ├── pgvector          -- RAG embeddings storage
│   ├── ai_usage          -- Token tracking per user
│   └── builder_cache     -- Cached builder verification results
│
└── External APIs
    ├── OpenAI / Anthropic -- LLM provider
    ├── ABN Lookup         -- Business verification
    ├── QBCC Open Data     -- License data (QLD)
    ├── Data.NSW           -- Complaints data (NSW)
    └── Outscraper         -- Google Reviews
```

### 5.5 Cost Control Strategies

1. **Rate limit AI queries**: 10-20 per user per month on free tier
2. **Cache common questions**: Store RAG answers for repeated queries
3. **Use cheapest model by default**: GPT-5 nano for text, upgrade for photos
4. **Cap response length**: 500-token max responses
5. **Send only last 10-20 messages** to maintain context affordably
6. **Pre-compute embeddings**: One-time cost for knowledge base
7. **Credit system**: Include AI credits in subscription, sell top-ups

---

## 6. Key Resources & URLs

### APIs
- ABN Lookup: https://abr.business.gov.au/Tools/WebServices
- ABN JSON: https://abr.business.gov.au/json/
- QBCC License Data: https://www.data.qld.gov.au/dataset/qbcc-licensed-contractors-register
- VBA Practitioner Search: https://bams.vba.vic.gov.au/bams/s/practitioner-search
- NSW Fair Trading Data: https://data.nsw.gov.au/data/organization/fair-trading
- NCC XML Data: https://data.gov.au/data/dataset/national-construction-code-ncc-2022
- Trustpilot API: https://developers.trustpilot.com/
- Outscraper (Google Reviews): https://outscraper.com/google-business-reviews-api/

### AI/ML Tools
- Vercel AI SDK: https://ai-sdk.dev/docs/introduction
- Vercel Chatbot Template: https://vercel.com/templates/next.js/nextjs-ai-chatbot
- OpenAI Pricing: https://openai.com/api/pricing/
- LLM Pricing Calculator: https://langcopilot.com/tools/token-calculator

### Datasets & Research
- UAV Building Defects Dataset: https://www.nature.com/articles/s41597-025-06318-5
- Awesome Crack Detection: https://github.com/nantonzhang/Awesome-Crack-Detection
- AI Defect Detection Paper: https://engiscience.com/index.php/josse/article/view/josse2025548

### Competitors to Watch
- Doxel: https://doxel.ai
- OpenSpace: https://www.openspace.ai
- Buildcheck: https://buildcheck.ai
- Buildxact: https://www.buildxact.com/au/
- Procore: https://www.procore.com

### Inspection Resources
- SafetyCulture Checklists: https://safetyculture.com/checklists/waterproofing-inspection
- ABIS Inspections: https://www.abis.com.au/lockupwaterproofing-stage-inspection/
- NCC Online: https://ncc.abcb.gov.au/

---

## 7. Recommendations Summary

### Quick Wins (This Month)
1. Integrate ABN Lookup API for builder verification -- free, easy REST/JSON API
2. Add a simple AI chat using Vercel AI SDK with GPT-5 nano (~$5/mo)
3. Build stage inspection checklist content (frame, lock-up, fix, completion)

### Medium Term (1-3 Months)
4. Implement RAG with Supabase pgvector over NCC data + inspection checklists
5. Add photo defect analysis using vision API
6. Integrate QBCC open data for Queensland builder license checks

### Longer Term (3-6 Months)
7. Builder Review Aggregator with sentiment scoring
8. Smart contract clause analysis
9. Multi-state license verification (NSW, VIC, QLD)

### Budget
- **Minimum viable AI features**: $10-30/month (LLM API costs at 500 users)
- **Full suite**: $100-300/month (at 5000 users with photo analysis)
- **Infrastructure**: Already covered by existing Supabase + Vercel setup
