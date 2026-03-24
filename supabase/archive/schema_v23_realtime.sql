-- ==========================================================================
-- Schema v23: Enable Supabase Realtime on Guardian tables
-- Required for multi-device sync via useRealtimeProject hook
-- ==========================================================================

-- Enable realtime for all project-related tables
-- Note: This adds each table to the supabase_realtime publication
-- Supabase only broadcasts changes for tables in this publication

ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE stages;
ALTER PUBLICATION supabase_realtime ADD TABLE defects;
ALTER PUBLICATION supabase_realtime ADD TABLE variations;
ALTER PUBLICATION supabase_realtime ADD TABLE inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE certifications;
ALTER PUBLICATION supabase_realtime ADD TABLE communication_log;
ALTER PUBLICATION supabase_realtime ADD TABLE progress_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE pre_handover_items;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
