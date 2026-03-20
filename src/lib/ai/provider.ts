import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * AI Provider Configuration.
 *
 * Strategy:
 * - Cheap model: Google Gemini 2.5 Flash-Lite (FREE, 1000 req/day, no credit card)
 * - Smart model: Claude Sonnet (paid) → falls back to Gemini 2.5 Flash (free)
 * - Embeddings: OpenAI text-embedding-3-small (paid, for RAG)
 *
 * Minimum setup: just set GOOGLE_GENERATIVE_AI_API_KEY (free from ai.google.dev)
 * Also accepts GOOGLE_AI_API_KEY as fallback for backwards compatibility.
 */

let _anthropic: ReturnType<typeof createAnthropic> | null = null;
let _google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let _openai: ReturnType<typeof createOpenAI> | null = null;

function getAnthropic() {
    if (!_anthropic) {
        if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
        _anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return _anthropic;
}

function getGoogle() {
    if (!_google) {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured — get a free key at ai.google.dev");
        _google = createGoogleGenerativeAI({ apiKey });
    }
    return _google;
}

function getOpenAI() {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
        _openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

/** Cheap model for high-volume features (defect assist, stage advice, builder check).
 *  Uses Gemini 2.5 Flash-Lite — FREE tier: 1,000 req/day, no credit card needed. */
export function getCheapModel() {
    return getGoogle()("gemini-2.5-flash-lite");
}

/** Smart model for complex reasoning (chat, contract analysis).
 *  Uses Claude Sonnet if available, falls back to Gemini 2.5 Flash (free). */
export function getSmartModel() {
    if (process.env.ANTHROPIC_API_KEY) {
        return getAnthropic()("claude-sonnet-4-5-20250514");
    }
    return getGoogle()("gemini-2.5-flash");
}

/** Embedding model for pgvector RAG (requires OpenAI key) */
export function getEmbeddingModel() {
    return getOpenAI().embedding("text-embedding-3-small");
}

/** Check if AI features are available — only needs a free Google AI key */
export function isAIAvailable(): boolean {
    return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !!process.env.GOOGLE_AI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
}
