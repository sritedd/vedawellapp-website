-- ==========================================================================
-- Schema v24: Contract Review Items + Builder Reviews
-- Migrates ContractReviewChecklist from in-memory to DB
-- Migrates BuilderRatings from localStorage to DB
-- ==========================================================================

-- ── 0. Reusable updated_at trigger function ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. Contract Review Items ──────────────────────────────────────────
-- Tracks which contract checklist items a homeowner has verified per project

CREATE TABLE IF NOT EXISTS contract_review_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_id     TEXT NOT NULL,
    checked     BOOLEAN NOT NULL DEFAULT false,
    checked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, item_id)
);

-- RLS
ALTER TABLE contract_review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contract review items"
    ON contract_review_items FOR ALL
    USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    )
    WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_contract_review_items_project
    ON contract_review_items(project_id);

-- updated_at trigger
CREATE TRIGGER set_contract_review_items_updated_at
    BEFORE UPDATE ON contract_review_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. Builder Reviews ────────────────────────────────────────────────
-- Stores homeowner ratings/reviews of their builder (one per project)

CREATE TABLE IF NOT EXISTS builder_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    overall_rating  INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    categories      JSONB NOT NULL DEFAULT '{}',
    review_text     TEXT NOT NULL DEFAULT '',
    recommend       BOOLEAN NOT NULL,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id)
);

-- RLS
ALTER TABLE builder_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own builder reviews"
    ON builder_reviews FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_builder_reviews_project
    ON builder_reviews(project_id);

CREATE INDEX IF NOT EXISTS idx_builder_reviews_user
    ON builder_reviews(user_id);

-- updated_at trigger
CREATE TRIGGER set_builder_reviews_updated_at
    BEFORE UPDATE ON builder_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. Add to Realtime publication ────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE contract_review_items;
ALTER PUBLICATION supabase_realtime ADD TABLE builder_reviews;
