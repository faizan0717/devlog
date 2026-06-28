-- Final public-beta RLS hardening
-- Apply after schema.sql on existing beta databases.

-- 1) Profiles: do not expose private profiles or email through the public table API.
-- Owners still get their email from Supabase Auth; public profile reads should not need it.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    revoke select (email) on public.profiles from anon, authenticated;
  end if;
end $$;

grant select (id, username, bio, avatar_url, social_links, is_public, created_at, updated_at)
  on public.profiles to anon, authenticated;

drop policy if exists "profiles: public read" on public.profiles;
drop policy if exists "profiles: readable profiles" on public.profiles;
create policy "profiles: readable profiles" on public.profiles
  for select using (is_public = true or auth.uid() = id);

drop policy if exists "profiles: owner write" on public.profiles;
create policy "profiles: owner write" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) Shared helper: visibility inheritance for log-backed rows.
create or replace function public.can_read_log(p_log_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.logs l
    join public.projects p on p.id = l.project_id
    where l.id = p_log_id
      and (
        p.owner_id = p_user_id
        or (l.visibility = 'public' and p.visibility in ('public', 'unlisted'))
        or exists (
          select 1 from public.collaborators c
          where c.project_id = p.id and c.user_id = p_user_id
        )
      )
  );
$$;

-- 3) Comments: reads/inserts/updates/deletes must follow log visibility.
drop policy if exists "comments: read" on public.comments;
create policy "comments: read" on public.comments
  for select using (public.can_read_log(log_id, auth.uid()));

drop policy if exists "comments: insert" on public.comments;
create policy "comments: insert" on public.comments
  for insert with check (
    auth.uid() = user_id
    and public.can_read_log(log_id, auth.uid())
  );

drop policy if exists "comments: update own" on public.comments;
create policy "comments: update own" on public.comments
  for update using (
    auth.uid() = user_id
    and public.can_read_log(log_id, auth.uid())
  ) with check (
    auth.uid() = user_id
    and public.can_read_log(log_id, auth.uid())
  );

drop policy if exists "comments: delete own" on public.comments;
create policy "comments: delete own" on public.comments
  for delete using (auth.uid() = user_id);

-- 4) Reactions: reads/inserts/deletes must follow log visibility.
-- Some older beta databases may not have reactions yet.
do $$ begin
  if to_regclass('public.reactions') is not null then
    drop policy if exists "reactions: read" on public.reactions;
    create policy "reactions: read" on public.reactions
      for select using (public.can_read_log(log_id, auth.uid()));

    drop policy if exists "reactions: self insert" on public.reactions;
    create policy "reactions: self insert" on public.reactions
      for insert with check (
        auth.uid() = user_id
        and public.can_read_log(log_id, auth.uid())
      );

    drop policy if exists "reactions: self delete" on public.reactions;
    create policy "reactions: self delete" on public.reactions
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 5) Notifications: recipients can read/update; actors can only create coherent notifications.
-- Some older beta databases may not have notifications yet.
do $$ begin
  if to_regclass('public.notifications') is not null then
    drop policy if exists "notifications: recipient read" on public.notifications;
    create policy "notifications: recipient read" on public.notifications
      for select using (auth.uid() = user_id);

    drop policy if exists "notifications: recipient update" on public.notifications;
    create policy "notifications: recipient update" on public.notifications
      for update using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    drop policy if exists "notifications: actor insert" on public.notifications;
    create policy "notifications: actor insert" on public.notifications
      for insert with check (
        auth.uid() = actor_id
        and user_id <> actor_id
        and (
          (type = 'follow' and project_id is null and log_id is null)
          or (
            type in ('comment', 'reaction')
            and project_id is not null
            and log_id is not null
            and public.can_read_log(public.notifications.log_id, public.notifications.actor_id)
            and exists (
              select 1
              from public.logs l
              join public.projects p on p.id = l.project_id
              where l.id = public.notifications.log_id
                and l.project_id = public.notifications.project_id
                and p.owner_id = user_id
            )
          )
        )
      );
  end if;
end $$;

-- 6) Plan/Roadmap: anonymous project pages list only public plan rows.
-- Unlisted plan rows are reserved for authenticated owner/collaborator contexts until item-level share links exist.
drop policy if exists "plan_milestones: public read" on public.plan_milestones;
create policy "plan_milestones: public read" on public.plan_milestones for select using (
  visibility = 'public'
  and exists (
    select 1 from public.projects p
    where p.id = plan_milestones.project_id
      and p.visibility in ('public', 'unlisted')
  )
);

drop policy if exists "plan_todos: public read" on public.plan_todos;
create policy "plan_todos: public read" on public.plan_todos for select using (
  visibility = 'public'
  and exists (
    select 1 from public.projects p
    where p.id = plan_todos.project_id
      and p.visibility in ('public', 'unlisted')
  )
);

-- 7) Harden security-definer functions.
create or replace function public.get_project_owner(p_project_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select owner_id from public.projects where id = p_project_id;
$$;

create or replace function public.increment_project_views(project_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.projects
  set view_count = view_count + 1
  where id = project_id
    and visibility in ('public', 'unlisted');
$$;
