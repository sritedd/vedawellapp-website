-- ================================================
-- SCHEMA V16: Create materials and site_visits tables
-- Also extends weekly_checkins with missing columns
-- Safe to re-run (IF NOT EXISTS / DO $$ blocks)
-- ================================================

-- 1. Materials registry
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    supplier TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own materials" ON materials;
CREATE POLICY "Users can manage own materials" ON materials FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = materials.project_id AND projects.user_id = auth.uid())
);

-- 2. Site visit log
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT,
    duration TEXT,
    purpose TEXT,
    attendees TEXT[], -- array of names
    observations TEXT,
    concerns TEXT[],
    follow_up_actions TEXT[],
    weather_conditions TEXT,
    workers_on_site INTEGER DEFAULT 0,
    photos_taken INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own site visits" ON site_visits;
CREATE POLICY "Users can manage own site visits" ON site_visits FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = site_visits.project_id AND projects.user_id = auth.uid())
);

-- 3. Extend weekly_checkins with columns the component needs
DO $$
BEGIN
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'on_track';
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS weather TEXT;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS workers_on_site INTEGER DEFAULT 0;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS work_completed TEXT;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS next_week_plan TEXT;
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS issues TEXT[];
    ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS photos_count INTEGER DEFAULT 0;
END;
$$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_project ON site_visits(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_project ON weekly_checkins(project_id, week_start DESC);

-- ================================================
-- DONE — Run after schema_v15
-- ================================================
