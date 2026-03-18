# AI Research: Open-Source AI Tooling for Web Apps

> Research date: 2026-03-18
> Purpose: Evaluate AI integration options for Guardian (Next.js + Supabase + Netlify)

---

## OpenClaw — Evaluated and Rejected

**OpenClaw** is a real open-source AI agent framework (247k GitHub stars, MIT license, TypeScript/Node.js). However, it is a **personal assistant platform**, not a library for embedding AI into a web app. Not recommended for Guardian — we'd be fighting the framework rather than building features.

---

## Option 1: API-Based AI (RECOMMENDED for Guardian v1)

### Vercel AI SDK (`ai` npm package)
- **What**: TypeScript toolkit for AI in Next.js apps
- **Functions**: `generateText`, `streamText`, `generateObject`, `streamObject`
- **Features**: Streaming responses, structured output (Zod schemas), multi-provider support
- **Providers**: OpenAI, Anthropic, Google, Mistral, Ollama — switch with one line
- **Install**: `npm install ai @ai-sdk/anthropic`
- **Perfect for**: Chat, text generation, structured data extraction
- **Docs**: https://ai-sdk.dev/docs/introduction
- **Why for Guardian**: Abstracts provider differences, gives us streaming chat UI, works with Next.js App Router natively

### Cost Comparison (per 1M tokens, March 2026)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| **GPT-5 nano** | $0.05 | $0.40 | **Cheapest, good quality** |
| Gemini Flash 2.0 | $0.10 | $0.40 | Fast, cheap |
| GPT-4o-mini | $0.15 | $0.60 | Reliable cheap option |
| Claude Haiku 3 (legacy) | $0.25 | $1.25 | Good legacy option |
| Claude Haiku 4.5 | $1.00 | $5.00 | Best quality/cost ratio |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Complex reasoning |

**Cost estimate for Guardian**:
- Average query: ~500 input tokens + ~300 output tokens
- Using Gemini Flash: ~$0.00017 per query
- 1,000 queries/day = ~$0.17/day = ~$5/month
- Using Claude Haiku 4.5: ~$0.002 per query = ~$60/month at 1K queries/day

**Recommendation**: Start with Gemini Flash or GPT-4o-mini for high-volume features (builder lookup, stage advice). Use Claude Haiku for complex features (contract analysis, dispute letter drafting).

### Cost Optimization
- **Prompt caching**: 90% savings on repeated context (Claude)
- **Batch API**: 50% discount for non-realtime tasks
- **Cache responses**: Store AI responses in Supabase for identical queries

---

## Option 2: Browser-Based AI (Zero Server Cost)

### Transformers.js (Hugging Face)
- **What**: Run pre-trained AI models directly in browser via WASM/WebGPU
- **Version**: Transformers.js 4 (announced at Web AI Summit 2025)
- **Models**: NLP, computer vision, audio — hundreds of models
- **Use cases for Guardian**:
  - Sentiment analysis on builder reviews (runs in browser, no API cost)
  - Image classification for defect photos (crack detection, water damage)
  - Text embedding for semantic search across project notes
- **Install**: `npm install @huggingface/transformers`
- **Limitation**: Model download size (50MB-500MB), initial load time

### WebLLM (MLC-AI)
- **What**: LLM inference in browser via WebGPU
- **Repo**: github.com/mlc-ai/web-llm
- **Models**: Llama, Mistral, Phi — full LLM in a browser tab
- **OpenAI-compatible API** — drop-in replacement
- **Use case for Guardian**: Offline construction advice chatbot
- **Limitation**: Requires WebGPU (Chrome 113+, Firefox 2025+), large model downloads (1-4GB)
- **Verdict**: Too heavy for Guardian right now. Revisit when models shrink.

### ONNX Runtime Web
- **What**: Run ONNX models in browser (WASM + WebGPU)
- **Best for**: Small, task-specific models (classification, detection)
- **Use case for Guardian**: Defect photo classification model

---

## Option 3: Edge AI (Serverless)

### Cloudflare Workers AI
- **What**: 50+ open-source models running serverless at edge (200+ cities)
- **Models**: Llama, Stable Diffusion, Whisper, ResNet, embeddings
- **Pricing**: Pay-per-inference, very cheap for small models
- **Problem for us**: Guardian is on Netlify, not Cloudflare
- **Solution**: Can call Cloudflare Workers AI as an external API from Netlify

### Supabase + pgvector (RAG)
- **What**: Vector similarity search built into our existing Supabase database
- **How**: Enable `pgvector` extension, store embeddings alongside data
- **Use case for Guardian**:
  - Embed Australian building codes → semantic search "what are the requirements for frame inspection in NSW?"
  - Embed defect descriptions → find similar past defects
  - Embed builder reviews → smart builder reputation scoring
- **Stack**: OpenAI `text-embedding-3-small` ($0.02/1M tokens) → pgvector → similarity search
- **Tutorial**: https://supabase.com/docs/guides/ai
- **This is the highest-value, lowest-cost AI feature we can build**

---

## Option 4: Self-Hosted (Future)

### Ollama
- **What**: Run LLMs locally (Llama, Mistral, Phi, Gemma)
- **Use case**: Development/testing without API costs
- **Not viable for**: Production SaaS (need server with GPU)

### llama.cpp / GGUF models
- **What**: C++ LLM inference, CPU-friendly quantized models
- **SmolLM 1.7B**: Runs on CPU, good for simple tasks
- **Not for Guardian production**: Need server infrastructure

---

## Recommendation Matrix

| Feature | Best Option | Cost | Effort |
|---------|------------|------|--------|
| Construction advice chatbot | Vercel AI SDK + Claude Haiku | ~$5-60/mo | Medium |
| Builder review analysis | Google Places API + Gemini Flash | ~$2/mo | Low |
| Defect photo analysis | Transformers.js (browser) | $0 | Medium |
| Smart stage recommendations | RAG with pgvector | ~$1/mo | Medium |
| Contract clause extraction | Claude Haiku (structured output) | ~$5/mo | Low |
| Semantic search over projects | Supabase pgvector | ~$1/mo | Medium |
| Builder license verification | NSW API (api.nsw.gov.au) | Free (API key) | Low |

---

## Sources
- [Vercel AI SDK Docs](https://ai-sdk.dev/docs/introduction)
- [Vercel AI SDK GitHub](https://github.com/vercel/ai)
- [Transformers.js - Worldline Blog](https://blog.worldline.tech/2026/01/13/transformersjs-intro.html)
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Supabase AI & Vectors Docs](https://supabase.com/docs/guides/ai)
- [pgvector Extension](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [RAG with Next.js + Supabase Tutorial](https://www.freecodecamp.org/news/how-to-build-an-ai-powered-rag-search-application-with-nextjs-supabase-and-openai/)
- [Intel Guide to In-Browser LLMs](https://www.intel.com/content/www/us/en/developer/articles/technical/web-developers-guide-to-in-browser-llms.html)
- [Running AI Models in Browser](https://maddevs.io/writeups/running-ai-models-locally-in-the-browser/)

---

## What to AVOID

| Don't | Why |
|-------|-----|
| Self-hosting LLMs (Ollama in production) | Ops overhead not worth it at our scale |
| Browser-based AI for core features | Unreliable across devices, huge model downloads |
| LangChain.js | Overkill for Guardian — Vercel AI SDK is simpler and native to Next.js |
| Expensive models (Claude Opus, GPT-5) for routine tasks | Use cheapest model that works — GPT-5 nano or Gemini Flash-Lite |
| OpenClaw | Personal assistant platform, not embeddable |
| Training custom models | API calls are cheaper and better quality until we have 10K+ data points |
