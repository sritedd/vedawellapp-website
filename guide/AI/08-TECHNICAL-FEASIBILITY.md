# Technical Feasibility Study: AI Integration into HomeOwner Guardian

> Date: 2026-03-18
> Scope: Map every proposed AI feature against current codebase, identify gaps, rate feasibility

---

## Current System Inventory

| Asset | Count | Status |
|-------|-------|--------|
| Guardian components | 51 | All use real DB data |
| Guardian pages | 16 | Auth-protected where needed |
| Database tables | 19 | RLS enforced, tier-gated |
| Schema migrations | 19 (v1-v19) | v13-v19 pending on production |
| E2E tests | 53 (19 smoke + 34 workflow) | Playwright, 4 Australian states |
| Component unit tests | 32 | Jest + React Testing Library |
| Calculation unit tests | 1 suite (911 lines of pure functions) | Comprehensive |
| API routes | 8 | Stripe, cron, notifications, PDF export |
| Server actions | 3 | deleteProject, logout, touchLastSeen |
| Helper libraries | 2 | calculations.ts (911 lines), upload-validation.ts |

**Key finding: The codebase is mature and well-structured.** AI features can be added as new API routes + components without modifying existing working code.

---

## Feature-by-Feature Feasibility

### Feature 1: Defect Description Assistant

**What**: User types rough defect → AI returns improved description, severity, category, recommended action

**Feasibility: HIGH (Ready to build)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Defect data model | `defects` table with title, description, location, stage, severity, status | None — schema is complete |
| Defect component | `ProjectDefects.tsx` — full CRUD with real DB | None — just need to add AI button |
| Type definitions | `Defect` interface with all fields + enums | None |
| API route | Does not exist | Create `/api/guardian/ai/describe-defect` |
| AI SDK | Not installed | Install `ai` + `@ai-sdk/anthropic` |
| Test strategy | Unit test the prompt → structured output pipeline | Use existing Jest setup |

**Integration point**: Add "AI Assist" button next to defect description textarea in `ProjectDefects.tsx`

**Prompt design** (structured output with Zod):
```typescript
const DefectAnalysis = z.object({
    improvedDescription: z.string(),
    severity: z.enum(['critical', 'major', 'minor', 'cosmetic']),
    category: z.string(), // e.g., "structural", "waterproofing", "electrical"
    location: z.string(),
    recommendedAction: z.string(),
    isUrgent: z.boolean(),
    australianStandard: z.string().optional(), // e.g., "AS 2870-2011"
});
```

**Risk**: LOW — additive feature, no changes to existing code

---

### Feature 2: AI Stage Advisor

**What**: When user views a stage, show AI-generated advice specific to their state + stage

**Feasibility: HIGH (Ready to build)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Stage data | `stages` table with name, status per project | None |
| State tracking | `projects.state` field (NSW/VIC/QLD/WA/SA/TAS/ACT/NT) | None |
| Workflow data | `australian-build-workflows.json` — stages, checklists, certificates per state | None — rich data source |
| Stage component | `StageChecklist.tsx`, `StageGate.tsx` | Add advice panel |
| Insurance/warranty logic | `calculations.ts` — state-specific insurance config, warranty periods | None — reuse in prompts |
| Knowledge base | Does not exist | Create pgvector table + seed script |

**Integration point**: New `<AIStageAdvice stage={stage} state={state} />` component rendered inside project detail page when viewing a stage

**Data pipeline**:
```
User enters stage view
  → Read stage name + project state from DB
  → Fetch matching knowledge chunks from pgvector
  → Include: relevant calculations (insurance threshold, warranty, cooling-off)
  → Send to Claude Haiku with system prompt
  → Cache response in localStorage (same stage+state = same advice for 24hr)
```

**Risk**: LOW — new component, no changes to existing code

---

### Feature 3: Builder Intelligence Report

**What**: User enters builder name → shows license status, Google reviews, risk score

**Feasibility: MEDIUM (External API dependencies)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Builder name field | `projects.builder_name` — already collected | None |
| ABN field | `projects.builder_abn` — already collected | None |
| License field | `projects.builder_license_number` — already collected | None |
| License verification URLs | `calculations.ts` has `getLicenseCheckUrl()` per state | Links exist, no API integration |
| ABN Lookup API | Not integrated | Free API at abr.business.gov.au |
| NSW Trades API | Not integrated | Requires API key from api.nsw.gov.au |
| QLD QBCC data | Not integrated | Open data via CKAN API |
| Google Places API | Not integrated | Requires API key, $17/1K requests |
| Risk scoring | `RedFlagsChecker.tsx` exists — rule-based red flag detection | Extend with API data |

**Integration points**:
1. `ProjectOverview.tsx` — add "Check Builder" button
2. New `<BuilderIntelligence builderId={...} />` component
3. New `/api/guardian/ai/builder-check` route

**Dependencies**:
- ABN Lookup GUID (free, apply at abr.business.gov.au)
- Google Places API key (paid, $17/1K lookups)
- NSW Trades API consumer key (free, apply at api.nsw.gov.au)

**Risk**: MEDIUM — depends on external API availability and rate limits

---

### Feature 4: Construction Chatbot

**What**: In-app AI chat that knows Australian building codes + user's project context

**Feasibility: MEDIUM (Requires pgvector knowledge base)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Chat UI | Does not exist | Create `GuardianChat.tsx` using Vercel AI SDK `useChat()` |
| Chat API | Does not exist | Create `/api/guardian/ai/chat` using `streamText()` |
| Knowledge base | Does not exist | Create `knowledge_base` table with pgvector |
| Knowledge content | `australian-build-workflows.json` + `calculations.ts` have domain data | Need to chunk + embed |
| NCC data | Not available locally | Download NCC 2022 XML from data.gov.au |
| Streaming UI | Not implemented | Vercel AI SDK handles this natively |
| Project context | All data available in DB (stages, defects, variations, etc.) | Need to fetch and inject into prompt |

**Architecture**:
```
User sends message
  → Embed message via text-embedding-3-small
  → pgvector similarity search (top 5 knowledge chunks)
  → Fetch user's project context (current stage, state, open defects)
  → System prompt: "You are Guardian, an AI construction advisor..."
  → streamText() → useChat() renders streaming response
```

**Schema addition**: `knowledge_base` table + `match_knowledge()` RPC function (defined in 04-AI-INTEGRATION-PLAN.md)

**Risk**: MEDIUM — new infrastructure (pgvector, embeddings), but Supabase supports it natively

---

### Feature 5: AI Report Summary

**What**: PDF export gets an AI-written executive summary as first page

**Feasibility: HIGH (Simple extension)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| PDF export | `/api/guardian/export-pdf` — generates PDF with pdf-lib | None — extend existing |
| Project data | Route already fetches project, defects, variations | None |
| AI generation | Not integrated | Add `generateText()` call before PDF creation |

**Integration**: Add 10 lines to existing export-pdf route — generate summary, prepend to PDF

**Risk**: VERY LOW — additive to existing working code

---

### Feature 6: Defect Photo Analysis

**What**: Upload photo → AI identifies defect type, severity, location

**Feasibility: MEDIUM (Vision API or browser ML)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Photo upload | `ProgressPhotos.tsx` + `MobilePhotoCapture.tsx` exist | None |
| Photo storage | Supabase storage buckets configured | None |
| Image analysis | Not implemented | Option A: Claude Vision API ($0.01/image) or Option B: Transformers.js (free, browser) |
| Defect creation | `ProjectDefects.tsx` has full CRUD | Add "Analyze Photo" button |

**Option A (API — recommended for v1)**:
- Send image to Claude Vision API
- Get structured response: defect type, severity, description
- Auto-populate defect form fields
- Cost: ~$0.01/image

**Option B (Browser — future)**:
- Use Transformers.js with a crack detection model
- Zero API cost
- Larger initial model download (~200MB)

**Risk**: LOW for API approach, MEDIUM for browser approach

---

### Feature 7: Proactive Guardian Notifications

**What**: AI generates context-aware notifications (stalled builds, stale defects, approaching deadlines)

**Feasibility: HIGH (Extends existing notification system)**

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| Email system | Resend integrated, `/api/notifications` exists | None — extend |
| In-app notifications | `NotificationCenter.tsx` exists with real DB data | None — add AI-generated alerts |
| Trigger conditions | `calculations.ts` has insurance alerts, warranty alerts, cooling-off status | Reuse these |
| AI personalization | Not implemented | Add LLM call to generate personalized notification text |

**Integration**: Extend `/api/notifications` cron to:
1. Check trigger conditions (using existing calculation functions)
2. Generate personalized message via Claude Haiku
3. Send via Resend (email) + store in notifications table (in-app)

**Risk**: VERY LOW — extends existing working systems

---

## Infrastructure Requirements

### New Dependencies
```bash
npm install ai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai
```

### New Environment Variables
```env
ANTHROPIC_API_KEY=sk-ant-...          # Claude Haiku for complex reasoning
GOOGLE_AI_API_KEY=AIza...             # Gemini Flash for cheap bulk tasks
OPENAI_API_KEY=sk-...                 # text-embedding-3-small for embeddings
GOOGLE_PLACES_API_KEY=AIza...         # Builder reviews (optional, Phase 2)
ABN_LOOKUP_GUID=...                   # Free, apply at abr.business.gov.au
```

### New Database Objects
```sql
-- Schema v20: AI knowledge base
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    category text NOT NULL,
    state text,
    stage text,
    embedding vector(1536),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE ai_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key text UNIQUE NOT NULL,
    response jsonb NOT NULL,
    model text NOT NULL,
    tokens_used int,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL
);

CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON ai_cache (cache_key);
CREATE INDEX ON ai_cache (expires_at);
```

### New Files (17 total)

**Core AI Library (4 files)**:
| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `src/lib/ai/provider.ts` | AI provider setup (Anthropic, Google, OpenAI) | 30 |
| `src/lib/ai/prompts.ts` | System prompts for each feature | 150 |
| `src/lib/ai/rag.ts` | Embedding + pgvector retrieval helpers | 80 |
| `src/lib/ai/cache.ts` | Response caching (reduce API costs) | 50 |

**API Routes (5 files)**:
| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `src/app/api/guardian/ai/describe-defect/route.ts` | Defect assistant | 60 |
| `src/app/api/guardian/ai/stage-advice/route.ts` | Stage advisor | 80 |
| `src/app/api/guardian/ai/builder-check/route.ts` | Builder intelligence | 120 |
| `src/app/api/guardian/ai/chat/route.ts` | Construction chatbot | 70 |
| `src/app/api/guardian/ai/analyze-photo/route.ts` | Defect photo analysis | 60 |

**Components (4 files)**:
| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `src/components/guardian/GuardianChat.tsx` | Chat UI with streaming | 150 |
| `src/components/guardian/BuilderIntelligence.tsx` | Builder report card | 200 |
| `src/components/guardian/AIStageAdvice.tsx` | Stage advice panel | 100 |
| `src/components/guardian/AIDefectAssist.tsx` | Defect description helper | 80 |

**Tests (3 files)**:
| File | Purpose | Tests (est.) |
|------|---------|-------------|
| `src/lib/ai/__tests__/prompts.test.ts` | Prompt construction tests | 15 |
| `src/lib/ai/__tests__/cache.test.ts` | Cache hit/miss/expiry tests | 10 |
| `e2e/guardian-ai.spec.ts` | E2E tests for all AI features | 20 |

**Schema + Seed (1 file)**:
| File | Purpose |
|------|---------|
| `supabase/schema_v20_ai.sql` | Knowledge base table + pgvector + cache table |
| `scripts/seed-knowledge-base.mjs` | Populate knowledge base with construction data |

---

## Compatibility Assessment

### Will AI features break existing code? NO.

| Existing System | Impact | Reason |
|-----------------|--------|--------|
| 51 Guardian components | ZERO changes | AI features are additive components |
| 19 DB migrations | ZERO conflicts | v20 adds new tables only |
| RLS policies | ZERO changes | AI tables use same user auth pattern |
| Stripe integration | ZERO changes | AI features gated by existing tier check |
| E2E tests | ZERO breakage | Existing tests don't touch new routes |
| Build process | ZERO changes | New deps are tree-shakeable |

### AI features reuse existing infrastructure:
- **Auth**: Same `supabase.auth.getUser()` pattern
- **Tier gating**: Same `has_pro_access()` function from v19
- **Data access**: Same Supabase client + RLS
- **Email**: Same Resend integration
- **PDF**: Extends existing pdf-lib route
- **Types**: Extends existing `guardian.ts` types

---

## Cost-Risk Matrix

| Feature | Dev Time | API Cost/mo | Risk | Priority |
|---------|----------|-------------|------|----------|
| Defect Description Assistant | 2 hrs | $3 | LOW | P0 |
| AI Report Summary | 1 hr | $2 | VERY LOW | P0 |
| AI Stage Advisor | 4 hrs | $5 | LOW | P1 |
| Proactive Notifications | 3 hrs | $5 | VERY LOW | P1 |
| Builder Intelligence | 6 hrs | $20 | MEDIUM | P2 |
| Construction Chatbot | 8 hrs | $10 | MEDIUM | P2 |
| Defect Photo Analysis | 6 hrs | $10 | MEDIUM | P3 |

**Total estimated development: 30 hours**
**Total monthly AI cost at 100 users: ~$55**
**Revenue at 100 users: $1,499/month**

---

## VERDICT: HIGHLY FEASIBLE

The Guardian codebase is well-structured for AI integration:
1. Clean separation of concerns — AI features are new routes + components
2. Existing type system covers all data models AI features need
3. Existing calculation library provides domain logic to include in prompts
4. Existing test infrastructure supports testing AI features
5. Supabase pgvector is free and already available
6. API costs are negligible relative to subscription revenue
7. Zero risk of breaking existing functionality
