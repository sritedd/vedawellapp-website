# AI Research: AI in Construction Technology

> Research date: 2026-03-18
> Purpose: Understand what AI features exist in construction tech and what Guardian can build

---

## Existing ConTech AI Players

### Enterprise Players (What they do that we should learn from)

| Company | AI Feature | How It Works |
|---------|-----------|-------------|
| **OpenSpace** | 360 photo → progress tracking | Computer vision compares site photos to BIM model |
| **Doxel** | Automated progress tracking | Drones + CV to measure % complete per trade |
| **Procore** | AI document search | Semantic search across project documents |
| **Buildxact** | AI cost estimation | Reads plans, estimates material quantities |
| **Versatile (CraneView)** | Crane-mounted CV | Tracks material flow on-site |

**Key insight**: None of these target HOMEOWNERS. They're all for builders/contractors. Guardian is unique in serving the homeowner side.

---

## AI Defect Detection (Computer Vision)

### Current State (2025-2026)
- CV models achieve **90%+ accuracy** for common construction defects
- Detectable defects: cracks, water damage, misaligned rebar, surface irregularities, rust, foundation settlement
- Models can process **thousands of images per minute**
- AR-enhanced inspection achieves **centimeter-level precision**
- Efficiency improvement: **78.63%** compared to manual inspection

### Key Data Points
- YOLOv8 achieves **88.7-96.3% mAP** for crack/surface defect detection
- A UAV-based dataset of **14,471 building defect images** was published in Nature (2025) — could be used for fine-tuning
- AI methods outperform human visual inspection by 10-20% (AI ~96-99% vs human ~80%)
- Reference: github.com/nantonzhang/Awesome-Crack-Detection

### What Guardian Can Do
Instead of building a custom CV model (expensive, complex), we can:

1. **Use pre-trained models via API**:
   - Google Cloud Vision API — general object/damage detection
   - Claude Vision (Claude 3+ models) — describe construction photos, identify issues
   - GPT-4o Vision — same capability

2. **Use Transformers.js in browser** (FREE):
   - Image classification models can run in-browser
   - Pre-trained on crack detection, water damage, surface defects
   - No API cost, works offline

3. **Our MVP approach**: User uploads defect photo → Claude Vision analyzes it → suggests severity, category, and recommended action

---

## Builder Reputation & License Checking

### Australian Builder License APIs

#### NSW (our primary market)
- **API**: api.nsw.gov.au — Trades API
- **Access**: Requires API key (free, apply through api.nsw.gov.au)
- **Authentication**: OAuth2 (consumer key + secret → auth token, 12hr validity)
- **Data**: License status, type, expiry, holder details
- **Public register**: verify.licence.nsw.gov.au
- **Fair Trading complaints**: Available via public register lookup

#### VIC
- **VBA**: Victorian Building Authority — practitioner search
- **Open Data**: data.vic.gov.au has VBA Building Practitioner Register dataset
- **URL**: discover.data.vic.gov.au/dataset/vba-building-practitioner-register

#### QLD
- **QBCC**: Queensland Building and Construction Commission
- **Open Data Portal**: data.qld.gov.au — full Licensed Contractors Register via CKAN API
- **URL**: data.qld.gov.au/dataset/qbcc-licensed-contractors-register
- **This is the easiest state to integrate** — structured data, open API

### Builder Review Analysis

#### Google Places API (RECOMMENDED)
- **What**: Programmatic access to Google Reviews for any business
- **Built-in AI**: Google now offers AI-powered review summaries via Places API
- **Sentiment**: Can get star ratings, review text, and AI-generated summaries
- **Cost**: $17 per 1,000 requests (Place Details)
- **How for Guardian**:
  1. User enters builder name/ABN
  2. We search Google Places for the builder
  3. Fetch reviews + AI summary
  4. Display sentiment analysis (positive/negative/neutral)
  5. Flag common complaints (delays, defects, communication)

#### ABN Lookup
- **API**: abr.business.gov.au — free API
- **Data**: Business name, status (active/cancelled), registration date, GST status
- **Use**: Verify builder is a real, active business

---

## Smart Construction Advice (RAG)

### The Opportunity
Guardian already has `australian-build-workflows.json` with state-specific stage data. We can turn this into an AI-powered advice system:

1. **Embed building knowledge** into Supabase pgvector:
   - Australian Building Codes (NCC) summaries
   - State-specific regulations (NSW Home Building Act 1989)
   - Common defect patterns by stage
   - Homeowner rights and remedies
   - Fair Trading complaint procedures

2. **User asks**: "What should I check before paying the frame stage?"
3. **System**: Retrieves relevant knowledge chunks → sends to LLM with user context → generates personalized advice

### Data Sources for RAG
- Our existing `australian-build-workflows.json` (stages, checklists, certificates)
- **NCC 2022 XML data** — available at data.gov.au/data/dataset/national-construction-code-ncc-2022 (ideal for RAG indexing, total embedding cost ~$0.01 one-time)
- NSW Fair Trading fact sheets (public domain)
- NSW Fair Trading complaints data on Data.NSW (data.nsw.gov.au/data/organization/fair-trading)
- SafetyCulture inspection checklists (safetyculture.com/checklists/)
- Common defect patterns database (we build this over time from user data)

---

## Practical AI Features for Guardian (Prioritized)

### Tier 1: Quick Wins (API calls, 1-2 days each)

| Feature | How | Cost |
|---------|-----|------|
| **Builder Lookup** | ABN API + Google Places API → show reviews, license status, sentiment | ~$2/mo |
| **Smart Stage Advice** | When user enters a stage, call Claude Haiku with stage context → "here's what to watch for" | ~$5/mo |
| **Defect Description Helper** | User types rough defect → AI improves description, suggests severity/category | ~$3/mo |
| **AI Report Summary** | When generating PDF, add AI-written executive summary | ~$2/mo |

### Tier 2: Medium Effort (RAG + embeddings, 1-2 weeks)

| Feature | How | Cost |
|---------|-----|------|
| **Construction Chatbot** | RAG over building codes + Vercel AI SDK streaming chat | ~$10/mo |
| **Smart Defect Search** | Embed defect descriptions → "find similar defects" | ~$1/mo |
| **Contract Clause Alerts** | User uploads contract → AI extracts key clauses, flags unfair terms | ~$5/mo |

### Tier 3: Advanced (Custom models, 1-2 months)

| Feature | How | Cost |
|---------|-----|------|
| **Defect Photo Analysis** | Transformers.js in browser or Claude Vision API | $0-$10/mo |
| **Predictive Risk Scoring** | Train on user data: which stages have most defects? | Custom model |
| **Auto-populated Checklists** | Learn from all users what items get checked/unchecked most | Data pipeline |

---

## Sources
- [AI in Construction Inspections - AlterSquare](https://altersquare.medium.com/ai-powered-quality-control-how-computer-vision-is-revolutionizing-construction-inspections-b94a15aa36bb)
- [Computer Vision in Construction - Viso.ai](https://viso.ai/applications/computer-vision-in-construction/)
- [CV for Building Defect Detection - IEEE](https://ieeexplore.ieee.org/document/10754392)
- [AI Water Damage Detection - Datagrid](https://datagrid.com/blog/ai-agent-detects-signs-water-damage-building-inspection-photos)
- [15 CV Use Cases in Construction - EasyFlow](https://easyflow.tech/computer-vision-in-construction/)
- [NSW Fair Trading Licence Check](https://www.fairtrading.nsw.gov.au/help-centre/online-tools/home-building-licence-check)
- [API.NSW Trades API](https://api.nsw.gov.au/Product/Index/25)
- [NSW Licence Verification](https://verify.licence.nsw.gov.au/)
- [Google Places AI Review Summaries](https://developers.google.com/maps/documentation/places/web-service/review-summaries)
- [Google Places Reviews API](https://developers.google.com/maps/documentation/javascript/place-reviews)
- [ABN Lookup Web Services](https://abr.business.gov.au/Tools/WebServices)
- [QBCC Licensed Contractors Register (Open Data)](https://www.data.qld.gov.au/dataset/qbcc-licensed-contractors-register)
- [VBA Building Practitioner Register](https://discover.data.vic.gov.au/dataset/vba-building-practitioner-register)
- [NSW Fair Trading Open Data](https://data.nsw.gov.au/data/organization/fair-trading)
- [NCC 2022 XML Data](https://data.gov.au/data/dataset/national-construction-code-ncc-2022)
- [Buildxact AI Estimating (Australian)](https://www.buildxact.com/au/blog/ai-tech-estimating/)
- [Buildcheck AI Design Review ($5.9M raise)](https://www.globenewswire.com/news-release/2025/12/09/3202554/0/en/Buildcheck-Raises-5-9M-to-Launch-AI-Powered-Construction-Design-Review-Platform.html)
- [UAV Building Defects Dataset (Nature 2025)](https://www.nature.com/articles/s41597-025-06318-5)
- [Awesome Crack Detection Models](https://github.com/nantonzhang/Awesome-Crack-Detection)
- [Trustpilot Developer API](https://developers.trustpilot.com/)
- [Outscraper Google Reviews API](https://outscraper.com/google-business-reviews-api/)
