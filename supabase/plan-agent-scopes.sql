-- Phase 4: agent plan scopes
-- Run this against hosted Supabase before creating tokens with plan permissions.

alter table public.agent_tokens
  drop constraint if exists agent_tokens_scopes_check;

alter table public.agent_tokens
  add constraint agent_tokens_scopes_check check (
    array_length(scopes, 1) is null or scopes <@ array[
      'read_projects',
      'read_logs',
      'create_project',
      'create_log',
      'update_log',
      'update_project',
      'read_plan',
      'create_plan',
      'update_plan',
      'complete_todo'
    ]::text[]
  );
