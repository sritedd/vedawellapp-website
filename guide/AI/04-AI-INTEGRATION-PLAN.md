# Guardian AI Integration Plan

> Created: 2026-03-18
> Status: **IMPLEMENTED** (2026-03-18/19)
> Stack: Vercel AI SDK v6 + Google Gemini 2.5 Flash-Lite (free) + Supabase pgvector

---

## Implementation Status

| Feature | Status | Route / Component |
|---------|--------|-------------------|
| AI Provider (Gemini/Claude) | DONE | `src/lib/ai/provider.ts` |
| Prompt system + Zod schemas | DONE | `src/lib/ai/prompts.ts` |
| Response caching + TTL | DONE | `src/lib/ai/cache.ts` |
| Rate limiting | DONE | `src/lib/ai/rate-limit.ts` |
| Defect description assistant | DONE | `/api/guardian/ai/describe-defect` + `AIDefectAssist.tsx` |
| Stage-specific advice | DONE | `/api/guardian/ai/stage-advice` + `AIStageAdvice.tsx` |
| Builder risk check | DONE | `/api/guardian/ai/builder-check` |
| Guardian Chat (streaming) | DONE | `/api/guardian/ai/chat` + `GuardianChat.tsx` |
| Schema v20 (ai_cache + knowledge_base) | DONE | `schema_v20_ai.sql` |
| Marketing pages updated | DONE | Landing, pricing, blog |
| Knowledge base seeding (RAG) | NOT STARTED | knowledge_base table empty |
| E2E tests for AI | NOT STARTED | Planned: `e2e/guardian-ai.spec.ts` |
| Pro-tier gating enforcement | PARTIAL | Free tier gets defect assist only |
| External API integrations | STUBS | ABN Lookup, Google Places, QBCC — return null |

---

## Architecture Overview

```
User → Guardian UI → Next.js API Route → Vercel AI SDK v6 → LLM Provider
                                              ↕
                                    Supabase ai_cache (response caching)
                                              ↕
                                    Rate Limiter (in-memory, per-user)
```

**Actual implementation decisions** (differs from original plan):
- Use **Vercel AI SDK v6** (`ai` + `@ai-sdk/react` + `@ai-sdk/google`) — breaking changes from v5
- Use **Google Gemini 2.5 Flash-Lite** as primary (FREE, 1000 req/day) — $0 cost vs original Claude Haiku plan
- Use **Claude Sonnet 4.5** as optional smart model (if ANTHROPIC_API_KEY set)
- Use **Supabase pgvector** for knowledge_base (schema created, not yet seeded)
- External APIs (ABN, Google Places, QBCC) are **stubbed** — return null, AI works without them
- **AI Defect Assist is FREE tier** — drives engagement. Chat/Stage/Builder are Pro-only

---

## Phase 1: Foundation (Build This Week)

### 1.1 Install Dependencies
```bash
npm install ai @ai-sdk/anthropic @ai-sdk/google
```

### 1.2 AI Provider Setup
```typescript
// src/lib/ai/provider.ts
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY!,
});

// Use cheapest model for high-volume features
export const cheapModel = google('gemini-2.0-flash');
// Use best model for complex reasoning
export const smartModel = anthropic('claude-haiku-4-5-20251001');
```

### 1.3 Construction Knowledge Base (pgvector RAG)

Enable pgvector in Supabase:
```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base for construction advice
CREATE TABLE knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    category text NOT NULL, -- 'building_code', 'defect_guide', 'rights', 'stage_advice'
    state text, -- 'NSW', 'VIC', 'QLD', 'ALL'
    stage text, -- 'slab', 'frame', 'lockup', etc.
    embedding vector(1536),
    created_at timestamptz DEFAULT now()
);

-- Index for fast similarity search
CREATE INDEX ON knowledge_base
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    filter_state text DEFAULT NULL,
    filter_stage text DEFAULT NULL
)
RETURNS TABLE (id uuid, content text, category text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.content,
        kb.category,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE
        (filter_state IS NULL OR kb.state = filter_state OR kb.state = 'ALL')
        AND (filter_stage IS NULL OR kb.stage = filter_stage OR kb.stage IS NULL)
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## Phase 2: AI Features (Build Order)

### Feature 1: Builder Intelligence Report
**User story**: "I enter my builder's name → Guardian shows me their license status, Google reviews, sentiment analysis, and red flags"

**Implementation**:
```
User enters builder name + state
  → ABN Lookup API (verify business exists, GST registered)
  → NSW Trades API (license status, type, expiry)
  → Google Places API (reviews + AI summary)
  → Claude Haiku: summarize findings into "Builder Report Card"
```

**API route**: `POST /api/guardian/ai/builder-check`
**Input**: `{ builderName, abn?, state }`
**Output**: `{ licenseStatus, reviewSummary, riskScore, redFlags[] }`

### Feature 2: AI Stage Advisor
**User story**: "I'm at the frame stage → Guardian proactively tells me what to check, what documents to demand, common tricks builders pull at this stage"

**Implementation**:
```
User views stage in project
  → RAG query: fetch relevant knowledge for this stage + state
  → Claude Haiku: generate personalized advice
  → Cache response (same stage+state = same advice)
```

**API route**: `POST /api/guardian/ai/stage-advice`
**Input**: `{ stage, state, projectContext? }`
**Output**: `{ advice, checklistItems[], documentsToDemand[], commonIssues[] }`

### Feature 3: Defect Description Assistant
**User story**: "I type 'crack in wall near window' → AI expands it into a proper defect report with suggested severity, location tags, and recommended next steps"

**Implementation**:
```
User types rough defect description
  → Claude Haiku with structured output (Zod schema)
  → Returns: improved description, severity, category, recommended action
```

**API route**: `POST /api/guardian/ai/describe-defect`
**Input**: `{ rawDescription, stage?, photos? }`
**Output**: `{ description, severity, category, location, recommendedAction, isUrgent }`

### Feature 4: Construction Chatbot
**User story**: "I have a question about my build → I chat with Guardian AI who knows Australian building codes and my specific project"

**Implementation**:
```
User sends message in chat UI
  → Embed question → pgvector similarity search (RAG)
  → System prompt: "You are a construction advisor for Australian homeowners..."
  → Include: user's project context (stage, state, defects, builder)
  → Stream response via Vercel AI SDK useChat()
```

**Component**: `<GuardianChat projectId={id} />`
**API route**: `POST /api/guardian/ai/chat`
**Uses**: Vercel AI SDK `streamText` + `useChat` hook

### Feature 5: AI Report Summary
**User story**: "When I export a PDF, it includes an AI-written executive summary of my project's health"

**Implementation**:
```
PDF export triggered
  → Gather all project data (defects, stages, variations, timeline)
  → Claude Haiku: "Write a professional executive summary..."
  → Prepend to PDF as first page
```

**Integrated into**: existing `/api/guardian/export-pdf` route

---

## Phase 3: Advanced Features (Month 2+)

### Feature 6: Defect Photo Analysis
- User uploads photo → Transformers.js runs crack/damage detection in browser
- Or: Send to Claude Vision API for detailed analysis
- Returns: "This appears to be a structural crack approximately 2mm wide in the load-bearing wall"

### Feature 7: Contract Analyzer
- User uploads building contract PDF
- AI extracts: key dates, payment schedule, inclusions/exclusions, sunset clause, cooling-off period
- Flags: unfair terms, missing standard protections, deviations from HIA/MBA standard contracts

### Feature 8: Predictive Risk Engine
- Aggregate anonymized data across all Guardian users
- "Projects with Builder X have 3.2x more defects at frame stage"
- "85% of projects in this postcode experience waterproofing issues"
- Requires: significant user base (100+ projects)

---

## Cost Projections

### Per-User Monthly Cost (Estimated)

| Feature | Queries/mo | Model | Cost/query | Monthly |
|---------|-----------|-------|-----------|---------|
| Builder check | 2 | Haiku | $0.003 | $0.006 |
| Stage advice | 5 | Haiku | $0.002 | $0.010 |
| Defect helper | 10 | Flash | $0.0002 | $0.002 |
| Chat messages | 20 | Haiku | $0.002 | $0.040 |
| Report summary | 1 | Haiku | $0.005 | $0.005 |
| **Total** | | | | **$0.063** |

**At $14.99/mo subscription, AI costs ~$0.06/user/mo = 0.4% of revenue**

Even at 1,000 active users = ~$63/month AI cost. Extremely viable.

---

## Env Vars Needed

```env
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# External APIs
GOOGLE_PLACES_API_KEY=AIza...
ABN_LOOKUP_GUID=your-guid-here
NSW_TRADES_API_KEY=your-consumer-key
NSW_TRADES_API_SECRET=your-consumer-secret
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/ai/provider.ts` | AI provider setup (Anthropic + Google) |
| `src/lib/ai/prompts.ts` | System prompts for each feature |
| `src/lib/ai/rag.ts` | pgvector embedding + retrieval helpers |
| `src/app/api/guardian/ai/builder-check/route.ts` | Builder intelligence API |
| `src/app/api/guardian/ai/stage-advice/route.ts` | Stage advisor API |
| `src/app/api/guardian/ai/describe-defect/route.ts` | Defect assistant API |
| `src/app/api/guardian/ai/chat/route.ts` | Construction chatbot API |
| `src/components/guardian/GuardianChat.tsx` | Chat UI component |
| `src/components/guardian/BuilderCheck.tsx` | Builder lookup UI |
| `src/components/guardian/AIStageAdvice.tsx` | Stage advice panel |
| `scripts/seed-knowledge-base.mjs` | Seed construction knowledge into pgvector |
| `supabase/schema_v20_ai.sql` | Knowledge base table + pgvector setup |

---

## Implementation Order

1. Install `ai` + `@ai-sdk/anthropic` + `@ai-sdk/google`
2. Create `provider.ts` + `prompts.ts`
3. Build **Defect Description Assistant** (simplest, highest daily value)
4. Build **AI Stage Advisor** (biggest "wow" factor)
5. Build **Builder Intelligence Report** (unique differentiator)
6. Create pgvector knowledge base + seed script
7. Build **Construction Chatbot** (most complex, most impressive)
8. Integrate **AI Report Summary** into PDF export
