-- schema_v20_ai.sql
-- AI features: knowledge base for RAG + response cache

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base for RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    category text NOT NULL,
    state text,
    stage text,
    embedding vector(1536),
    created_at timestamptz DEFAULT now()
);

-- AI response cache
CREATE TABLE IF NOT EXISTS ai_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key text UNIQUE NOT NULL,
    response jsonb NOT NULL,
    model text NOT NULL,
    tokens_used int,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON ai_cache (expires_at);

-- RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- Knowledge base is read-only for authenticated users
CREATE POLICY "knowledge_base_read" ON knowledge_base FOR SELECT TO authenticated USING (true);

-- AI cache: users can read/write their own cached responses
-- Note: cache is keyed by feature+params hash, shared across users for same queries (intentional for cost savings)
CREATE POLICY "ai_cache_read" ON ai_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_cache_insert" ON ai_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ai_cache_update" ON ai_cache FOR UPDATE TO authenticated USING (true);

-- Service role can manage everything (for cleanup crons)
CREATE POLICY "knowledge_base_service" ON knowledge_base FOR ALL TO service_role USING (true);
CREATE POLICY "ai_cache_service" ON ai_cache FOR ALL TO service_role USING (true);
