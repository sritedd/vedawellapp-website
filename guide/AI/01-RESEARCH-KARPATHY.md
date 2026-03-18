# AI Research: Andrej Karpathy's Lightweight AI Projects

> Research date: 2026-03-18
> Purpose: Understand minimal AI implementations to inspire Guardian's AI features

---

## Philosophy

Karpathy's core thesis: **AI is simpler than you think.** Every one of his projects strips away framework bloat to reveal the bare algorithmic essence. If PyTorch does it in 100K lines, Karpathy does it in 300.

Key principles:
- **Zero dependencies** — pure Python, pure C, no frameworks
- **Verify by building** — rebuild foundational AI from scratch
- **Education-first** — code is the tutorial
- **Local-first** — run on your own hardware

---

## Projects (Newest First)

### 1. autoresearch (March 2026)
- **Repo**: github.com/karpathy/autoresearch
- **Stars**: ~25,000 (in first week)
- **What**: AI agent that runs ML experiments autonomously overnight
- **How**: Give it a training setup, it modifies code, trains 5 minutes, checks if validation improved, keeps or discards, repeats. ~12 experiments/hour.
- **Size**: 630 lines, 3 files (train.py, program.md, one fixed file)
- **Key insight**: AI can do research — modify → train → evaluate → iterate — without human supervision
- **Guardian relevance**: Same pattern could power "auto-optimize" defect classification or smart checklists that learn what homeowners miss most

### 2. microgpt (February 2026)
- **Blog**: karpathy.github.io/2026/02/12/microgpt/
- **What**: Complete GPT in a single file — dataset, tokenizer, autograd, transformer, optimizer, training, inference
- **Size**: 200 lines of pure Python, ZERO dependencies
- **Architecture**: GPT-2-style transformer with RMSNorm, multi-head attention, MLP blocks, residual connections
- **Demo**: 4,192 parameters trained on 32,000 names — generates new plausible names
- **Key insight**: "Everything else is just efficiency" — the entire algorithmic content of GPT fits in 200 lines
- **Guardian relevance**: Proves you can build meaningful AI in tiny codespace. A construction-domain microgpt could learn patterns from defect descriptions.

### 3. nanochat (2025-2026)
- **Repo**: github.com/karpathy/nanochat
- **Tagline**: "The best ChatGPT that $100 can buy"
- **What**: End-to-end training/inference toolchain. Unlike nanoGPT (pre-training only), nanochat includes full chat capability.
- **Cost**: ~$100 for 4 hours on 8xH100
- **Metric**: "Time to GPT-2" — wall clock time to beat GPT-2 (1.6B) performance
- **Key insight**: A functional chatbot can be trained for $100 — makes custom domain chatbots economically viable

### 4. minbpe (2024)
- **What**: Minimal BPE tokenizer — reproduces GPT-4's tokenizer in ~300 lines
- **Zero dependencies**
- **Guardian relevance**: Understanding tokenization helps us design efficient prompts for API calls (saves money)

### 5. nanoGPT (2023)
- **What**: Simplest GPT training. ~600 lines total (300 model + 200 training)
- **Depends on**: PyTorch
- **Key**: Can reproduce GPT-2 (124M) on a single GPU

### 6. micrograd (2020)
- **What**: Autograd engine in ~100 lines. The backpropagation engine behind ALL neural networks.
- **Zero dependencies**
- **Key**: The foundation — shows neural nets are just `f(x) → loss → backprop → update weights`

---

## What This Means for Guardian

Karpathy proves that **you don't need massive infrastructure to build AI features**. The key takeaways:

1. **API-first is the right call for us** — We don't need to train models. We need to USE models smartly via APIs (Claude Haiku, GPT-4o-mini, Gemini Flash).

2. **The autoresearch pattern is powerful** — "Try → evaluate → keep/discard" loops can power features like "AI reviews your defect photos and learns what patterns to flag."

3. **microgpt proves domain-specific tiny models work** — A 200-line model trained on construction defect descriptions could classify new defects by type/severity.

4. **But for Guardian v1, API calls beat custom models** — Training even a tiny model requires GPU time and ML expertise. API calls to Claude Haiku cost ~$1/1M tokens and give world-class quality instantly.

---

## Sources
- [autoresearch repo](https://github.com/karpathy/autoresearch)
- [nanochat repo](https://github.com/karpathy/nanochat)
- [microgpt blog post](http://karpathy.github.io/2026/02/12/microgpt/)
- [Karpathy GitHub profile](https://github.com/karpathy)
- [autoresearch article - The New Stack](https://thenewstack.io/karpathy-autonomous-experiment-loop/)
- [autoresearch deep dive - TopAIProduct](https://topaiproduct.com/2026/03/07/autoresearch-karpathys-overnight-ai-researcher-that-runs-100-experiments-while-you-sleep/)
