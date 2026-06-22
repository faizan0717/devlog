-- Beta security hardening
-- Apply this to an existing Supabase project before beta.
-- It prevents public logs/comments/reactions from being readable when their parent project is private or shared.

begin;

-- Public log reads require BOTH:
-- 1. the log itself is public
-- 2. the parent project is public or unlisted
-- Owners/collaborators keep access through the separate owner/collab policies.
drop policy if exists "logs: public read" on public.logs;
create policy "logs: public read" on public.logs for select using (
  visibility = 'public'
  and exists (
    select 1 from public.projects p
    where p.id = logs.project_id
      and p.visibility in ('public', 'unlisted')
  )
);

-- Comments on public logs should not leak a public log under a private/shared project.
drop policy if exists "comments: read" on public.comments;
create policy "comments: read" on public.comments for select using (
  exists (
    select 1 from public.logs l
    join public.projects p on p.id = l.project_id
    where l.id = log_id
      and (p.owner_id = auth.uid()
           or (l.visibility = 'public' and p.visibility in ('public', 'unlisted'))
           or exists (select 1 from public.collaborators where project_id = p.id and user_id = auth.uid()))
  )
);

-- Same protection for reaction counts/details.
drop policy if exists "reactions: read" on public.reactions;
create policy "reactions: read" on public.reactions for select using (
  exists (
    select 1 from public.logs l
    join public.projects p on p.id = l.project_id
    where l.id = log_id
      and (p.owner_id = auth.uid()
           or (l.visibility = 'public' and p.visibility in ('public', 'unlisted'))
           or exists (select 1 from public.collaborators where project_id = p.id and user_id = auth.uid()))
  )
);

commit;
