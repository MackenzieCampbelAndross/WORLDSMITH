-- Production is handled on the Crestion Labs backend. Stop creating the old
-- in-portal 11-stage pipeline when a project is submitted; status and delivery
-- are now driven by backend updates.
-- Run once in Supabase Dashboard -> SQL Editor.

drop trigger if exists projects_submitted on public.projects;
drop function if exists public.handle_project_submitted();
