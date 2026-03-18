# AI Integration Research Report for HomeOwner Guardian

**Date:** March 18, 2026
**Purpose:** Evaluate open-source and lightweight AI solutions for integration into the HomeOwner Guardian Next.js application (Australian construction monitoring SaaS).

---

## Table of Contents

1. [OpenClaw & Open-Source AI Agent Frameworks](#1-openclaw--open-source-ai-agent-frameworks)
2. [Lightweight AI Solutions for Web Apps](#2-lightweight-ai-solutions-for-web-apps)
3. [AI-Powered Features for Construction Monitoring](#3-ai-powered-features-for-construction-monitoring)
4. [Edge/Serverless AI Options](#4-edgeserverless-ai-options)
5. [Cost Analysis](#5-cost-analysis)
6. [Recommendations for HomeOwner Guardian](#6-recommendations-for-homeowner-guardian)

---

## 1. OpenClaw & Open-Source AI Agent Frameworks

### OpenClaw (Real Project)

OpenClaw is a real, trending open-source AI agent framework (247k GitHub stars as of March 2026). Originally published in November 2025 by Austrian developer Peter Steinberger under the name "Clawdbot," it went viral in late January 2026.

**Key Technical Details:**
- **Language:** TypeScript (runs on Node.js 20+, Node.js 22 recommended)
- **License:** MIT (fully open-source)
- **Architecture:** Local-first, memory stored as Markdown files on your machine
- **LLM Providers:** Anthropic Claude, OpenAI GPT, Google Gemini, DeepSeek, Ollama (local), OpenRouter, any OpenAI-compatible API
- **Skills System:** AgentSkills-compatible skill folders with YAML frontmatter; ClawHub public registry at clawhub.com
- **Plugin System:** Channel plugins (Slack, Telegram, Discord, WhatsApp, iMessage, Teams, etc.), outbound webhooks for external service integration
- **Web UI:** Built-in Gateway serves a Control UI and WebChat at `http://127.0.0.1:18789`

**Relevance to Guardian:** OpenClaw is designed as a personal AI assistant, not a library for embedding into a web app. It would be overkill for Guardian. However, its architecture (TypeScript, multi-LLM support, skill system) provides inspiration for building a simpler AI layer.

**Links:**
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Website](https://openclaw.ai/)
- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills)
- [OpenClaw Architecture Overview](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)

### Other Notable Open-Source AI Agent Frameworks

| Framework | Stars | Language | Best For |
|-----------|-------|----------|----------|
| **OpenClaw** | 247k | TypeScript | Personal AI assistant, multi-channel |
| **LangGraph.js** | ~15k | TypeScript | Stateful AI agents with graphs |
| **Nanobot** | ~5k | TypeScript | Ultra-lightweight OpenClaw alternative |
| **CrewAI** | ~25k | Python | Multi-agent orchestration |

---

## 2. Lightweight AI Solutions for Web Apps

### 2.1 Vercel AI SDK (`ai` npm package) -- RECOMMENDED

The Vercel AI SDK (v6, released late 2025) is the most natural fit for a Next.js application.

**Key Features:**
- **Server Actions:** AI SDK 6 uses native React Server Actions instead of REST API routes -- no `/api/chat` endpoints needed
- **Structured Output:** Zod schema validation with `generateObject` and `streamObject` -- model output is constrained to match your schema
- **Tool Calling:** Define tools with typed Zod parameters; the model decides when to call tools
- **Streaming:** Progressive rendering with `useChat` and `useObject` hooks
- **Multi-Provider:** Same API for OpenAI, Anthropic, Google, Ollama, and more
- **TypeScript-First:** End-to-end type safety

**Integration Pattern for Next.js App Router:**
```
npm install ai @ai-sdk/openai  # or @ai-sdk/anthropic, @ai-sdk/google
```
Use server actions directly in your components -- no API route boilerplate.

**Links:**
- [AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [Next.js App Router Getting Started](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [AI SDK 6 Blog Post](https://vercel.com/blog/ai-sdk-6)

### 2.2 LangChain.js / LangGraph.js

**LangChain.js:** General-purpose LLM framework with chains, agents, tools, and memory.
**LangGraph.js:** Graph-based agent framework for stateful, multi-step workflows.

**Key Features:**
- Durable execution (persists through failures)
- Human-in-the-loop capabilities
- Short-term and long-term memory
- Official Next.js starter template

**When to Use:** Best for complex multi-step agent workflows (e.g., "analyze contract, extract clauses, check against regulations, generate report"). Overkill for simple chat or single-step AI calls.

**Links:**
- [LangGraph.js GitHub](https://github.com/langchain-ai/langgraphjs)
- [LangChain Next.js Template](https://github.com/langchain-ai/langchain-nextjs-template)
- [Building AI Agents with LangGraph + Next.js](https://auth0.com/blog/genai-tool-calling-build-agent-that-calls-calender-with-langgraph-nextjs/)

### 2.3 Ollama (Local LLM Serving)

Run open-source LLMs locally with a single CLI command. Exposes a REST API on port 11434 that is **OpenAI API-compatible**.

**Supported Models:** Llama 3.x, Mistral, Qwen 3, Phi-4, DeepSeek, Gemma 3
**Integration:** Works with Vercel AI SDK via `ollama-ai-provider` package
**Use Case:** Development/testing without API costs; self-hosted production on a VPS

**Links:**
- [Ollama Blog: Building LLM-Powered Web Apps](https://ollama.com/blog/building-llm-powered-web-apps)
- [Ollama + Next.js UI](https://github.com/jakobhoeg/nextjs-ollama-llm-ui)
- [Ollama Setup Guide 2026](https://www.sitepoint.com/ollama-setup-guide-2026/)

### 2.4 Hugging Face Transformers.js (Browser-Based ML)

Run ML models directly in the browser using ONNX Runtime (WebAssembly/WebGPU). No server needed.

**Supported Tasks:**
- Image classification, object detection, segmentation
- Text classification, sentiment analysis, NER
- Embeddings generation
- Zero-shot classification

**Relevance to Guardian:**
- Could run sentiment analysis on builder reviews client-side (privacy-preserving)
- Basic image classification for defect photos (limited accuracy without fine-tuning)

**Limitations:**
- Models must be small enough to download to browser (typically <500MB)
- No fine-tuned construction-specific models available off-the-shelf
- Performance depends on user's device

**Links:**
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js/en/index)
- [Transformers.js GitHub](https://github.com/huggingface/transformers.js)

### 2.5 ONNX Runtime Web (Browser ML)

Microsoft's runtime for running ONNX models in the browser. Powers Transformers.js under the hood.

**Key Features:**
- WebGPU, WebGL, and WebAssembly backends
- Official Next.js template for image classification
- Can run YOLO object detection models in the browser

**Relevance:** Could run a YOLO-based defect detection model entirely in the browser (no server costs). Requires a custom-trained ONNX model for construction defects.

**Links:**
- [ONNX Runtime Web Docs](https://onnxruntime.ai/docs/tutorials/web/)
- [ONNX Runtime Next.js Template](https://github.com/microsoft/onnxruntime-nextjs-template)
- [Run YOLO in Browser with Next.js](https://pyimagesearch.com/2025/07/28/run-yolo-model-in-the-browser-with-onnx-webassembly-and-next-js/)

### 2.6 WebLLM (Browser LLMs via WebGPU)

Run full LLMs in the browser using WebGPU acceleration. Retains up to 80% of native performance.

**Supported Models:** Llama, Phi, Gemma, Mistral, Qwen, RedPajama
**Performance:** WebGPU reduces inference latency by 40% vs WebAssembly-only
**Quantization:** INT-4 quantization reduces memory by 75% (e.g., Llama-3.1-8B fits in browser)

**Limitations:**
- Requires WebGPU-capable browser (Chrome 113+, Firefox nightly)
- Large initial model download (2-8GB)
- Not suitable for mobile/low-end devices

**Links:**
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [WebLLM Website](https://webllm.mlc.ai/)
- [WebLLM Documentation](https://webllm.mlc.ai/docs/)

### 2.7 Small Models Comparison

| Model | Parameters | Size (Q4) | Best For | Runs In Browser? |
|-------|-----------|-----------|----------|------------------|
| **SmolLM2** | 135M-1.7B | ~1GB | Simple text tasks | Yes |
| **TinyLlama** | 1.1B | ~600MB | Basic chat/completion | Yes |
| **Phi-4-mini** | 3.8B | ~2.3GB | Coding, reasoning | Possible (WebGPU) |
| **Gemma-3-1B** | 1B | ~700MB | Multilingual, general | Yes |
| **Qwen3-0.6B** | 0.6B | ~400MB | Ultra-lightweight | Yes |
| **Llama-3.2-1B** | 1B | ~700MB | General purpose | Yes |
| **Llama-3.2-3B** | 3B | ~1.8GB | Better reasoning | Possible (WebGPU) |

---

## 3. AI-Powered Features for Construction Monitoring

### 3.1 Builder Review/Complaint Checking

**Approach:** Scrape or aggregate builder reviews, then run sentiment analysis and entity extraction.

**Implementation Options:**
| Option | Cost | Quality | Privacy |
|--------|------|---------|---------|
| Transformers.js (browser) | Free | Good | Excellent (client-side) |
| Vercel AI SDK + Gemini Flash-Lite | ~$0.10/1000 reviews | Excellent | Moderate |
| Supabase Edge Function + pgvector | ~$0.05/1000 reviews | Good | Good |

**Recommended:** Use Gemini Flash-Lite via Vercel AI SDK for batch analysis, cache results in Supabase. Display sentiment scores, common complaint themes, and red flags.

### 3.2 Defect Image Analysis

**Approach:** Users upload photos of construction issues; AI classifies defect type and severity.

**Implementation Options:**
1. **API-based (Recommended for quality):** Send images to GPT-4o / Gemini 2.5 Pro / Claude Sonnet vision API. Cost: ~$0.01-0.05 per image. Best accuracy.
2. **Browser-based (Free but limited):** Use ONNX Runtime Web with a pre-trained or fine-tuned YOLO model. Requires custom training data for construction defects.
3. **Hybrid:** Basic classification in browser (crack vs stain vs water damage), then detailed analysis via API for confirmed defects.

**Existing Research:** AI construction defect detection is a $3.7B market (2025), growing to $6.6B by 2034. Computer vision can identify cracks, misaligned rebar, rust, foundation settlement, and water damage.

### 3.3 Smart Stage Recommendations

**Approach:** Based on the current construction stage, project type, and Australian building standards, suggest what to inspect next.

**Implementation:** This is primarily a rules-based system enhanced with LLM summaries.
- Store stage checklists in the database (already partially implemented in Guardian)
- Use an LLM to generate personalized recommendations based on project context
- Cost: Minimal (small prompts, cacheable responses)

### 3.4 Document Analysis (Contract Clause Extraction)

**Approach:** Upload building contracts (PDF); AI extracts key clauses, deadlines, obligations, and flags risky terms.

**Implementation:**
1. Parse PDF using `pdf-parse` or `pdfjs-dist` in a server action
2. Send extracted text to LLM with structured output schema (Vercel AI SDK `generateObject`)
3. Store extracted clauses in Supabase with vector embeddings for search

**Schema Example:**
```typescript
const contractSchema = z.object({
  parties: z.array(z.object({ name: z.string(), role: z.string() })),
  clauses: z.array(z.object({
    title: z.string(),
    text: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    category: z.enum(['payment', 'timeline', 'warranty', 'defects', 'termination', 'other']),
  })),
  keyDates: z.array(z.object({ date: z.string(), description: z.string() })),
  totalValue: z.string().optional(),
  warrantyClauses: z.array(z.string()),
});
```

### 3.5 Predictive Analytics (Defect Probability)

**Approach:** Based on historical data (stage, builder, weather, materials), predict likelihood of defects.

**Implementation:** This requires sufficient training data. For a new SaaS, start with:
1. Rule-based risk scoring (stage X in weather Y = higher risk)
2. Graduate to ML models once you have 1000+ defect records
3. Use Supabase pgvector for similarity search ("projects like yours had these issues")

### 3.6 Natural Language Search

**Approach:** Users search their project data using natural language ("show me all defects related to waterproofing").

**Implementation:**
1. Generate embeddings for project notes, defects, photos, and checklists using an embedding model
2. Store in Supabase pgvector
3. At query time, embed the user's query and perform similarity search
4. Cost: Embedding generation is very cheap (~$0.01 per 1M tokens with `text-embedding-3-small`)

**Links:**
- [Supabase AI & Vectors Docs](https://supabase.com/docs/guides/ai)
- [Supabase pgvector Extension](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Automatic Embeddings](https://supabase.com/docs/guides/ai/automatic-embeddings)

### 3.7 AI Chatbot for Construction Advice

**Approach:** An in-app chatbot that answers questions about Australian building standards, common defects, and homeowner rights.

**Implementation:**
1. Use Vercel AI SDK with `useChat` hook
2. Provide system prompt with Australian building context (NCC, state regulations)
3. RAG: Embed reference documents (building standards summaries) in pgvector, retrieve relevant context per question
4. Cost: ~$0.001-0.01 per message with Gemini Flash-Lite or GPT-4o-mini

### 3.8 Automated Report Generation

**Approach:** Generate professional inspection reports, weekly summaries, and project status documents.

**Implementation:**
1. Gather project data from Supabase (defects, photos, checklist results, stage progress)
2. Use LLM with structured output to generate report sections
3. Render as PDF using `@react-pdf/renderer` or `puppeteer`
4. Cost: ~$0.01-0.05 per report with a mid-tier model

---

## 4. Edge/Serverless AI Options

### 4.1 Cloudflare Workers AI

**Pricing:** $0.011 per 1,000 Neurons (compute units). Free tier: 10,000 Neurons/day.
**Models:** Meta Llama, Mistral, image classification, embeddings, speech-to-text
**Pros:** Cheapest serverless AI inference, global edge network (300+ locations), no cold starts (V8 isolates)
**Cons:** Not directly integrated with Netlify deployment; would require a separate Cloudflare account and API calls

**Links:**
- [Cloudflare Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)

### 4.2 Vercel Edge Functions + AI

**Pricing:** Included in Vercel Pro ($20/user/month); compute is metered
**Integration:** Native with Next.js via `export const runtime = 'edge'`
**Pros:** Seamless Next.js integration, streaming support, AI SDK native
**Cons:** Guardian is deployed on Netlify, not Vercel; Edge Functions have execution time limits

### 4.3 Netlify Edge Functions (Current Platform)

**Pricing:** 1M Edge Function requests/month on free plan; included in Pro ($19/user/month)
**Integration:** Deno-based edge functions at `netlify/edge-functions/`
**AI Capability:** No built-in AI models; must call external APIs (OpenAI, Anthropic, etc.)
**Pros:** Already the deployment platform for Guardian
**Cons:** Limited compute for ML inference; best used as a proxy to AI APIs

### 4.4 Supabase Edge Functions + AI -- RECOMMENDED

**Pricing:** 500K Edge Function invocations/month on free plan; 2M on Pro ($25/month)
**Integration:** Deno-based, native access to Supabase database and pgvector
**AI Capability:**
- Can call any LLM API (OpenAI, Anthropic, Google)
- Native pgvector for embeddings and similarity search
- Automatic embeddings feature (public alpha)
- Hugging Face integration for open-source models

**Pros:** Already using Supabase for Guardian; Edge Functions can access the database directly; pgvector is built-in
**Cons:** Deno-based (not Node.js); 150-second timeout limit

**Links:**
- [Supabase AI & Vectors](https://supabase.com/docs/guides/ai)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)

---

## 5. Cost Analysis

### 5.1 API Cost Comparison (March 2026)

#### Budget Tier (Best for Small SaaS)

| Provider | Model | Input $/1M tokens | Output $/1M tokens | Best For |
|----------|-------|-------------------|--------------------|---------|
| **Google** | Gemini 2.5 Flash-Lite | $0.10 | $0.40 | Cheapest production API |
| **OpenAI** | GPT-5 Mini | $0.25 | $2.00 | Budget OpenAI option |
| **Anthropic** | Claude Haiku 4.5 | $1.00 | $5.00 | Cheapest Anthropic |
| **OpenAI** | GPT-4o-mini | $0.15 | $0.60 | Great value |

#### Mid Tier

| Provider | Model | Input $/1M tokens | Output $/1M tokens | Best For |
|----------|-------|-------------------|--------------------|---------|
| **Google** | Gemini 2.5 Pro | $2.00 | $12.00 | Best value flagship |
| **OpenAI** | GPT-5.2 | $1.75 | $14.00 | General purpose |
| **Anthropic** | Claude Sonnet 4.5 | $3.00 | $15.00 | Complex reasoning |

#### Vision Models (for Defect Detection)

| Provider | Model | Cost per Image (~1000 tokens) | Quality |
|----------|-------|------------------------------|---------|
| **Google** | Gemini 2.5 Flash-Lite | ~$0.0005 | Good |
| **OpenAI** | GPT-4o-mini | ~$0.002 | Good |
| **OpenAI** | GPT-4o | ~$0.01 | Excellent |
| **Anthropic** | Claude Sonnet 4.5 | ~$0.015 | Excellent |

### 5.2 Monthly Cost Estimates for Guardian

**Scenario: 500 active users, each generating ~100 AI interactions/month = 50,000 requests**

| Feature | Model Choice | Est. Monthly Cost |
|---------|-------------|-------------------|
| Chatbot (50K messages) | Gemini Flash-Lite | ~$3-5 |
| Defect image analysis (5K images) | GPT-4o-mini | ~$10-15 |
| Contract analysis (500 docs) | Gemini 2.5 Pro | ~$5-10 |
| Report generation (2K reports) | Gemini Flash-Lite | ~$2-3 |
| Embeddings (search index) | text-embedding-3-small | ~$1-2 |
| **Total** | | **~$21-35/month** |

### 5.3 Self-Hosted vs API vs Browser-Based

| Approach | Monthly Cost | Setup Effort | Quality | Scalability |
|----------|-------------|-------------|---------|-------------|
| **API (Gemini Flash-Lite)** | $20-50 | Low (hours) | High | Excellent |
| **Self-Hosted (Ollama on VPS)** | $20-40 (VPS) | Medium (days) | Medium | Manual |
| **Browser-Based (Transformers.js)** | $0 | High (weeks) | Low-Medium | N/A |
| **Cloudflare Workers AI** | $5-15 | Medium (days) | Medium | Excellent |
| **Hybrid (API + browser)** | $15-30 | Medium (days) | High | Good |

### 5.4 Verdict: Cheapest for a Small SaaS

**Winner: Google Gemini Flash-Lite via Vercel AI SDK**

At $0.10/$0.40 per million tokens, Gemini Flash-Lite is the cheapest production-grade API. For a small SaaS with <1000 users, total AI costs would be **under $50/month**. This is cheaper than self-hosting (a GPU VPS costs $20-40/month minimum) and much simpler than browser-based inference.

**Cost Optimization Strategies:**
1. **Cache aggressively:** Cache LLM responses in Supabase for 24-72 hours (65-80% of queries can be served from cache)
2. **Tiered model routing:** Use Flash-Lite for simple tasks, escalate to Pro for complex analysis
3. **Batch processing:** Process builder reviews and reports in batch during off-peak hours
4. **Prompt caching:** Anthropic offers 90% cost reduction on cached input tokens

---

## 6. Recommendations for HomeOwner Guardian

### Phase 1: Quick Wins (1-2 weeks)

These features require minimal AI infrastructure and deliver immediate user value.

| Feature | Implementation | Stack | Cost |
|---------|---------------|-------|------|
| **AI Chatbot** | Vercel AI SDK `useChat` + server action | Gemini Flash-Lite | ~$5/mo |
| **Smart Stage Checklist** | LLM generates checklist from stage + project type | Gemini Flash-Lite | ~$2/mo |
| **Report Summaries** | LLM summarizes project data into report paragraphs | Gemini Flash-Lite | ~$3/mo |

**Technical Stack:**
```
npm install ai @ai-sdk/google
```
- Create `src/app/guardian/ai/actions.ts` with server actions
- Use `generateText` for summaries, `generateObject` for structured data
- Add `useChat` hook to a chat component

### Phase 2: Medium Effort (2-4 weeks)

| Feature | Implementation | Stack | Cost |
|---------|---------------|-------|------|
| **Defect Image Analysis** | Vision API analyzes uploaded photos | GPT-4o-mini or Gemini Flash | ~$15/mo |
| **Natural Language Search** | pgvector embeddings + similarity search | Supabase + text-embedding-3-small | ~$2/mo |
| **Builder Sentiment Analysis** | Batch analyze builder reviews | Gemini Flash-Lite | ~$3/mo |

**Technical Stack:**
- Enable pgvector extension in Supabase
- Create embeddings table and search function
- Add vision analysis to the ProgressPhotos workflow

### Phase 3: Advanced (4-8 weeks)

| Feature | Implementation | Stack | Cost |
|---------|---------------|-------|------|
| **Contract Clause Extraction** | PDF parsing + structured LLM output | Gemini 2.5 Pro | ~$10/mo |
| **Predictive Defect Analytics** | Historical pattern matching via embeddings | Supabase pgvector | ~$2/mo |
| **Automated Full Reports** | Multi-section report generation + PDF export | Gemini Flash-Lite + react-pdf | ~$5/mo |

### Recommended Architecture

```
User Browser
    |
    v
Next.js App Router (Netlify)
    |
    +--> Server Actions (ai SDK)
    |       |
    |       +--> Google Gemini API (chat, summaries, analysis)
    |       +--> OpenAI API (embeddings, vision fallback)
    |
    +--> Supabase
            |
            +--> PostgreSQL + pgvector (embeddings, search)
            +--> Edge Functions (background AI processing)
            +--> Storage (photos, documents)
```

### Key Technical Decisions

1. **Primary AI SDK:** Vercel AI SDK (`ai` package) -- native Next.js integration, multi-provider, structured output
2. **Primary LLM:** Google Gemini Flash-Lite (cheapest) with Gemini Pro for complex tasks
3. **Embeddings:** OpenAI `text-embedding-3-small` ($0.02/1M tokens) stored in Supabase pgvector
4. **Vision:** GPT-4o-mini or Gemini Flash for defect photo analysis
5. **Infrastructure:** Supabase Edge Functions for background processing (batch analysis, embedding generation)
6. **Caching:** Supabase table for LLM response caching (reduces costs by 60-80%)

### What NOT to Do

- **Do NOT self-host Ollama/LLMs** for production -- the ops overhead is not worth it at small scale
- **Do NOT use browser-based AI (WebLLM/Transformers.js)** for core features -- too unreliable across devices and too large to download
- **Do NOT use OpenClaw** -- it's a personal assistant framework, not a library for embedding AI into a web app
- **Do NOT use LangChain.js** unless you need complex multi-step agent workflows -- Vercel AI SDK is simpler and sufficient
- **Do NOT start with expensive models** (Claude Opus, GPT-5) -- Flash-Lite handles 90% of use cases

---

## Sources

### OpenClaw
- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
- [OpenClaw Website](https://openclaw.ai/)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
- [OpenClaw Architecture Overview](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
- [What Is OpenClaw - Milvus Blog](https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md)
- [OpenClaw Requirements](https://advenboost.com/en/openclaw-requirements/)
- [Nanobot: Ultra-Lightweight OpenClaw](https://github.com/HKUDS/nanobot)

### Vercel AI SDK
- [AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [Next.js App Router Getting Started](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Streaming AI Chat Guide](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)
- [Complete Vercel AI SDK Guide](https://www.guvi.in/blog/vercel-ai-sdk/)

### LangChain / LangGraph
- [LangGraph.js GitHub](https://github.com/langchain-ai/langgraphjs)
- [LangChain Next.js Template](https://github.com/langchain-ai/langchain-nextjs-template)
- [LangGraph + Next.js Tutorial](https://auth0.com/blog/genai-tool-calling-build-agent-that-calls-calender-with-langgraph-nextjs/)
- [Production AI Agents with Next.js and LangGraph.js](https://dev.to/ialijr/building-production-ready-ai-agents-with-nextjs-and-langgraphjs-1a79)

### Browser-Based AI
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js/en/index)
- [Transformers.js GitHub](https://github.com/huggingface/transformers.js)
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [WebLLM Website](https://webllm.mlc.ai/)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [ONNX Runtime Next.js Template](https://github.com/microsoft/onnxruntime-nextjs-template)
- [YOLO in Browser with Next.js](https://pyimagesearch.com/2025/07/28/run-yolo-model-in-the-browser-with-onnx-webassembly-and-next-js/)
- [WebGPU Browser AI Guide](https://aicompetence.org/ai-in-browser-with-webgpu/)

### Ollama
- [Ollama + Next.js UI](https://github.com/jakobhoeg/nextjs-ollama-llm-ui)
- [Ollama Setup Guide 2026](https://www.sitepoint.com/ollama-setup-guide-2026/)
- [Ollama Blog: LLM-Powered Web Apps](https://ollama.com/blog/building-llm-powered-web-apps)

### Edge/Serverless AI
- [Cloudflare Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Supabase AI & Vectors](https://supabase.com/docs/guides/ai)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Automatic Embeddings](https://supabase.com/docs/guides/ai/automatic-embeddings)

### Cost & Pricing
- [AI API Pricing Comparison 2026](https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude)
- [LLM API Pricing 2026](https://www.cloudidr.com/llm-pricing)
- [Gemini vs OpenAI vs Claude Cost Guide](https://www.aifreeapi.com/en/posts/gemini-api-vs-openai-vs-claude-2026-cost-guide)
- [Price Per Token Comparison](https://pricepertoken.com/)
- [Building AI on Startup Budget](https://www.deepnetsoft.com/blogs/building-ai-powered-applications-startup-budget-2025-2026)
- [Cheapest AI API Providers 2026](https://medium.com/@anyapi.ai/cheapest-ai-api-providers-in-2026-best-value-models-for-developers-e51618824d05)

### Construction AI
- [AI-Powered Construction Inspections](https://altersquare.medium.com/ai-powered-quality-control-how-computer-vision-is-revolutionizing-construction-inspections-b94a15aa36bb)
- [Computer Vision in Construction](https://easyflow.tech/computer-vision-in-construction/)
- [AI for Construction Contract Management](https://www.documentcrunch.com/blog/how-to-use-ai-for-contract-management)
- [AI Blueprint Readers 2026](https://www.mastt.com/software/ai-blueprint-reader)
- [AI Defect Detection Market](https://www.intelmarketresearch.com/ai-defect-detection-market-25697)
- [Cloudflare vs Vercel vs Netlify 2026](https://dev.to/dataformathub/cloudflare-vs-vercel-vs-netlify-the-truth-about-edge-performance-2026-50h0)

### Small Language Models
- [Small Language Models Guide 2026](https://localaimaster.com/blog/small-language-models-guide-2026)
- [WebAssembly for LLM Inference in Browsers](https://dasroot.net/posts/2026/01/webassembly-llm-inference-browsers-onnx-webgpu/)
