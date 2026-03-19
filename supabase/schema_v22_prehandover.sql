-- ==========================================================================
-- Schema v22: Pre-handover checklist items table
-- Migrates PreHandoverChecklist from localStorage to Supabase
-- ==========================================================================

-- Pre-handover snag items
CREATE TABLE IF NOT EXISTS pre_handover_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_key    TEXT NOT NULL,                -- e.g. "int-walls-cracks" or "custom-xxx"
    category    TEXT NOT NULL,
    text        TEXT NOT NULL,
    found       BOOLEAN NOT NULL DEFAULT false,
    description TEXT NOT NULL DEFAULT '',
    location    TEXT NOT NULL DEFAULT '',
    severity    TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('critical','major','minor','cosmetic')),
    photo_note  TEXT NOT NULL DEFAULT '',
    is_custom   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, item_key)
);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_pre_handover_items_project ON pre_handover_items(project_id);

-- RLS
ALTER TABLE pre_handover_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own project's items
CREATE POLICY "Users can view own pre-handover items"
    ON pre_handover_items FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own pre-handover items"
    ON pre_handover_items FOR INSERT
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own pre-handover items"
    ON pre_handover_items FOR UPDATE
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own pre-handover items"
    ON pre_handover_items FOR DELETE
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_pre_handover_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pre_handover_updated_at
    BEFORE UPDATE ON pre_handover_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pre_handover_updated_at();
