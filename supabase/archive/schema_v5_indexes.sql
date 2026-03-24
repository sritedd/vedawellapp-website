-- ================================================
-- SCHEMA V5: Database Indexes for Performance
-- Run this in Supabase SQL Editor after all previous migrations
-- ================================================

-- ================================================
-- PROJECTS TABLE
-- Most queried table — every dashboard load, project list, etc.
-- ================================================

-- Dashboard: .from('projects').eq('user_id', user.id).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC);

-- Project detail: .eq('id', projectId).eq('user_id', user.id)
-- Primary key on id already covers eq('id'), composite with user_id for ownership check
CREATE INDEX IF NOT EXISTS idx_projects_id_user ON projects(id, user_id);

-- ================================================
-- STAGES TABLE
-- Queried by project_id on every project detail page
-- ================================================

-- .from('stages').eq('project_id', projectId).order('created_at')
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_project_created ON stages(project_id, created_at);

-- ================================================
-- CHECKLIST_ITEMS TABLE
-- Queried by stage_id for each stage in a project
-- ================================================

-- .from('checklist_items').eq('stage_id', stageId).order('created_at')
CREATE INDEX IF NOT EXISTS idx_checklist_items_stage_id ON checklist_items(stage_id);

-- RLS policy subquery: JOIN stages ON projects for ownership check
-- The stages.project_id index above helps this join

-- ================================================
-- VARIATIONS TABLE
-- Queried by project_id on dashboard and project detail
-- ================================================

-- .from('variations').eq('project_id', projectId)
-- .from('variations').in('project_id', projectIds)
-- .from('variations').eq('project_id', projectId).eq('status', 'approved')
CREATE INDEX IF NOT EXISTS idx_variations_project_id ON variations(project_id);
CREATE INDEX IF NOT EXISTS idx_variations_project_status ON variations(project_id, status);

-- ================================================
-- DEFECTS TABLE
-- Queried by project_id, filtered by status
-- ================================================

-- .from('defects').in('project_id', projectIds).eq('status', 'open')
-- .from('defects').eq('project_id', projectId)
CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_project_status ON defects(project_id, status);

-- Open defects count (dashboard)
CREATE INDEX IF NOT EXISTS idx_defects_open ON defects(project_id) WHERE status = 'open';

-- ================================================
-- CERTIFICATIONS TABLE
-- Queried by project_id
-- ================================================

-- .from('certifications').eq('project_id', projectId)
CREATE INDEX IF NOT EXISTS idx_certifications_project_id ON certifications(project_id);

-- ================================================
-- INSPECTIONS TABLE
-- Queried by project_id
-- ================================================

CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON inspections(project_id);

-- ================================================
-- DOCUMENTS TABLE
-- Queried by project_id, ordered by uploaded_at
-- ================================================

-- .from('documents').eq('project_id', projectId).order('uploaded_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_uploaded ON documents(project_id, uploaded_at DESC);

-- ================================================
-- WEEKLY_CHECKINS TABLE
-- Queried by project_id
-- ================================================

CREATE INDEX IF NOT EXISTS idx_weekly_checkins_project_id ON weekly_checkins(project_id);

-- ================================================
-- COMMUNICATION_LOG TABLE (if exists)
-- Queried by project_id, ordered by date
-- ================================================

-- .from('communication_log').eq('project_id', projectId).order('date', { ascending: false })
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communication_log') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_communication_log_project_id ON communication_log(project_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_communication_log_project_date ON communication_log(project_id, date DESC)';
    END IF;
END $$;

-- ================================================
-- PAYMENT_MILESTONES TABLE (if exists)
-- Queried by project_id, ordered by percentage
-- ================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_milestones') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_milestones_project_id ON payment_milestones(project_id)';
    END IF;
END $$;

-- ================================================
-- PROFILES TABLE
-- Already indexed: stripe_customer_id, last_seen_at, subscription_tier (from v3/v4)
-- Add: email index for webhook lookups
-- ================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ================================================
-- DONE
-- These indexes optimize:
-- 1. Dashboard page loads (projects + variations + defects aggregation)
-- 2. Project detail page (stages + checklists + variations + defects)
-- 3. Document vault queries
-- 4. Communication log queries
-- 5. RLS policy subqueries (ownership checks via project_id)
-- ================================================
