-- Allow direct public reads of unlisted projects.
-- Explore/search still filters to public projects; this only makes /p/:id direct links work
-- consistently with public log and public plan RLS policies.
drop policy if exists "projects: public read" on public.projects;
create policy "projects: public read" on public.projects
  for select
  using (visibility in ('public', 'unlisted'));
