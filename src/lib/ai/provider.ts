import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * AI Provider Configuration.
 *
 * Strategy (priority order):
 * 1. Google Gemini 2.5 Flash (free, GOOGLE_AI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY)
 * 2. Groq Llama (free, GROQ_API_KEY — get a free key at console.groq.com)
 *
 * Anthropic path is intentionally retired — key rotated out; re-enable here if
 * ever needed by importing `createAnthropic` and restoring the lazy getter.
 */

let _google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let _groq: ReturnType<typeof createGroq> | null = null;
let _openai: ReturnType<typeof createOpenAI> | null = null;

function getGoogleApiKey(): string | null {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || null;
}

function getGoogle() {
    if (!_google) {
        const apiKey = getGoogleApiKey();
        if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured — get a free key at ai.google.dev");
        _google = createGoogleGenerativeAI({ apiKey });
    }
    return _google;
}

function getGroq() {
    if (!_groq) {
        if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured — get a free key at console.groq.com");
        _groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _groq;
}

function getOpenAI() {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
        _openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

/** Cheap model for high-volume features (defect assist, stage advice, builder check). */
export function getCheapModel() {
    if (getGoogleApiKey()) return getGoogle()("gemini-2.0-flash");
    if (process.env.GROQ_API_KEY) return getGroq()("llama-3.3-70b-versatile");
    throw new Error("No AI provider configured. Set GOOGLE_AI_API_KEY or GROQ_API_KEY.");
}

/** Smart model for complex reasoning (chat, contract analysis). */
export function getSmartModel() {
    if (getGoogleApiKey()) {
        return getGoogle()("gemini-2.5-flash");
    }
    if (process.env.GROQ_API_KEY) {
        return getGroq()("llama-3.3-70b-versatile");
    }
    throw new Error("No AI provider configured. Set GOOGLE_AI_API_KEY or GROQ_API_KEY.");
}

/** Returns the name of the active smart model for telemetry */
export function getSmartModelName(): string {
    if (getGoogleApiKey()) return "gemini-2.5-flash";
    if (process.env.GROQ_API_KEY) return "llama-3.3-70b-versatile";
    return "unknown";
}

/** Embedding model for pgvector RAG (requires OpenAI key) */
export function getEmbeddingModel() {
    return getOpenAI().embedding("text-embedding-3-small");
}

/** Check if cheap AI is available */
export function isCheapAIAvailable(): boolean {
    return !!getGoogleApiKey() || !!process.env.GROQ_API_KEY;
}

/** Check if any AI model is available */
export function isAIAvailable(): boolean {
    // Anthropic disabled — only Gemini and Groq are active providers
    return isCheapAIAvailable();
}
