# Lightweight AI Blueprint: What to Build If Nothing Exists

> Research date: 2026-03-18
> Inspired by: Karpathy's microgpt (200-line GPT), autoresearch (630-line AI researcher)

---

## The Karpathy Approach Applied to Guardian

Karpathy proved you can build a full GPT in 200 lines. We don't need to go that far — but his philosophy of "strip to the algorithmic essence" guides our approach.

**Our constraint**: We run on Netlify (serverless, no GPU). Everything must work via:
1. API calls to LLM providers, OR
2. JavaScript/WASM running in the browser, OR
3. PostgreSQL (Supabase) doing the computation

---

## Lightweight AI Feature 1: "Smart Defect Classifier"

A tiny classification system that learns from the user's own data.

### How It Works (No ML Framework Needed)
```
Step 1: User logs defects with descriptions
Step 2: We embed each defect description (OpenAI text-embedding-3-small, $0.02/1M tokens)
Step 3: Store embeddings in pgvector
Step 4: When user logs NEW defect:
  → Embed the new description
  → pgvector finds the 3 most similar past defects
  → Auto-suggest: severity, category, location based on similar defects
  → "This looks similar to 'Frame misalignment — L-bracket offset' which was rated Critical"
```

**This is self-learning**: The more defects logged, the smarter the suggestions get. Zero training needed. Pure nearest-neighbor classification using embeddings.

### Implementation (50 lines)
```typescript
// src/lib/ai/defect-classifier.ts
import { generateText, embed } from 'ai';
import { anthropic } from './provider';
import { createClient } from '@/lib/supabase/server';

export async function classifyDefect(description: string, projectId: string) {
    // 1. Embed the new defect
    const { embedding } = await embed({
        model: anthropic.textEmbeddingModel('text-embedding-3-small'),
        value: description,
    });

    // 2. Find similar defects via pgvector
    const supabase = await createClient();
    const { data: similar } = await supabase.rpc('match_defects', {
        query_embedding: embedding,
        project_id: projectId,
        match_count: 3,
    });

    // 3. Use LLM to suggest classification based on similar defects
    const context = similar?.map(d =>
        `"${d.title}" — severity: ${d.severity}, category: ${d.category}`
    ).join('\n');

    const { text } = await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        prompt: `Based on these similar defects:\n${context}\n\nClassify this new defect: "${description}"\nRespond with JSON: { severity, category, suggestedTitle, recommendedAction }`,
    });

    return JSON.parse(text);
}
```

---

## Lightweight AI Feature 2: "Construction Knowledge Graph"

A simple but powerful knowledge retrieval system — NOT a chatbot, but a context-aware advisor.

### The Insight
We don't need an AI to "know" construction. We need to:
1. Curate the right knowledge (building codes, defect patterns, homeowner rights)
2. Retrieve the right chunks at the right time
3. Let an LLM format the answer naturally

### Architecture (Karpathy-Simple)
```
Knowledge chunks (500-800 chars each)
  → Embedded once ($0.02/1M tokens)
  → Stored in pgvector

User context (current stage, state, defects)
  → Triggers automatic retrieval
  → No user query needed — Guardian proactively shows relevant info

Example:
  User enters "Frame" stage
  → System retrieves top 5 knowledge chunks about frame stage + user's state
  → Renders as "What to know at Frame stage" card
  → Topics: required inspections, payment cap (20%), common defects, documents to collect
```

### Seed Data (Our Competitive Moat)
```javascript
// scripts/seed-knowledge-base.mjs
const knowledgeChunks = [
    {
        content: "At the frame stage in NSW, a mandatory inspection by a PCA (Principal Certifying Authority) is required before any work can proceed to lock-up. The builder must give you at least 2 business days notice before the inspection. You have the right to attend. Key things to check: all load-bearing walls are plumb, top plates are straight, bracing is installed per engineering plans, window and door frames are level, and all connections use the specified brackets and fixings.",
        category: "stage_advice",
        state: "NSW",
        stage: "frame"
    },
    {
        content: "Under the NSW Home Building Act 1989, progress payments cannot exceed the following percentages: Deposit 10%, Base/Slab 15%, Frame 20%, Lock-up 25%, Fixing/Fit-off 20%, Completion 10%. Your builder cannot demand payment before work is complete and inspected. If they do, this is a breach of contract.",
        category: "rights",
        state: "NSW",
        stage: null
    },
    // ... 200+ chunks covering all stages, states, defect types, rights
];
```

---

## Lightweight AI Feature 3: "Builder Reputation Engine"

Zero-model approach — uses API data + simple scoring.

### Algorithm (Pure Logic, No ML)
```typescript
function calculateBuilderRiskScore(data: BuilderData): RiskReport {
    let score = 100; // Start at 100 (perfect)
    const flags: string[] = [];

    // License checks
    if (!data.licenseActive) { score -= 50; flags.push("LICENSE EXPIRED"); }
    if (data.licenseAge < 2) { score -= 10; flags.push("New licensee (< 2 years)"); }

    // ABN checks
    if (!data.abnActive) { score -= 40; flags.push("ABN CANCELLED"); }
    if (!data.gstRegistered) { score -= 15; flags.push("Not GST registered (unusual for builders)"); }

    // Review analysis
    if (data.averageRating < 3.0) { score -= 25; flags.push("Poor average rating"); }
    if (data.reviewCount < 5) { score -= 10; flags.push("Very few reviews"); }
    if (data.negativeKeywords.includes("defect")) { score -= 10; flags.push("Reviews mention defects"); }
    if (data.negativeKeywords.includes("delay")) { score -= 5; flags.push("Reviews mention delays"); }
    if (data.negativeKeywords.includes("warranty")) { score -= 10; flags.push("Reviews mention warranty issues"); }

    // Fair Trading complaints (if accessible)
    if (data.complaintCount > 0) { score -= data.complaintCount * 15; flags.push(`${data.complaintCount} Fair Trading complaint(s)`); }

    return {
        score: Math.max(0, score),
        rating: score >= 80 ? "LOW RISK" : score >= 50 ? "MODERATE RISK" : "HIGH RISK",
        flags,
    };
}
```

This is a **rule-based system** — the simplest form of "AI." No model needed. Just domain expertise encoded as logic. We can layer ML on top later as we collect data.

---

## Lightweight AI Feature 4: "Proactive Guardian"

The biggest shift: Guardian stops being passive and starts being proactive.

### How (Event-Driven AI)
```
Trigger events:
  - User hasn't logged in for 7 days during active build
  - Stage has been "current" for 30+ days (stalled build?)
  - Defect marked "open" for 14+ days
  - Insurance expiry approaching
  - New stage reached → auto-send stage checklist + advice

For each trigger:
  → Generate context-aware notification (Claude Haiku)
  → Send via email (Resend) and/or in-app notification
  → Include specific, actionable advice

Example email:
  Subject: "Your frame stage has been in progress for 35 days"
  Body: "Hi [Name], your project [Project] has been at the Frame stage
  for 35 days. The typical timeframe for frame in NSW is 2-4 weeks.
  Here are 3 things to check with your builder:
  1. Has the frame inspection been booked with your PCA?
  2. Are all structural connections installed per engineering?
  3. Has the bracing been completed before lockup begins?
  [View Project →]"
```

### Implementation
This extends the existing `/api/notifications` cron endpoint. Add a `generateProactiveAdvice()` function that:
1. Queries all active projects
2. Checks for trigger conditions
3. Generates personalized advice via Claude Haiku
4. Sends notifications

---

## Summary: Build Order

| # | Feature | Type | Effort | AI Cost |
|---|---------|------|--------|---------|
| 1 | Defect Description Assistant | API call | 2 hours | ~$3/mo |
| 2 | Proactive Guardian Notifications | Rule engine + LLM | 4 hours | ~$5/mo |
| 3 | Builder Risk Score | Pure logic | 3 hours | $0 |
| 4 | AI Stage Advice Cards | RAG + LLM | 6 hours | ~$5/mo |
| 5 | Construction Chatbot | RAG + streaming | 1 day | ~$10/mo |
| 6 | Builder Google Reviews Analysis | Google API + LLM | 4 hours | ~$2/mo |
| 7 | Defect Photo Analysis | Transformers.js | 1 day | $0 |

**Total AI infrastructure cost at 100 users: ~$25/month**
**Revenue at 100 users: $1,499/month**
**AI cost as % of revenue: 1.7%**

This is extremely profitable. The AI features pay for themselves many times over by increasing subscription conversion and reducing churn.
