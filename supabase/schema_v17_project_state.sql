-- ================================================
-- SCHEMA V17: Add state + build_category to projects
-- Run this in Supabase SQL Editor after schema_v14
-- ================================================

-- Add state and build_category columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'NSW';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_category TEXT DEFAULT 'new_build';

-- Backfill existing projects with default (NSW, new_build)
-- UPDATE projects SET state = 'NSW', build_category = 'new_build' WHERE state IS NULL;

-- ================================================
-- DONE
-- ================================================
