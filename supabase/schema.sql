-- devLog schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type visibility as enum ('private', 'public', 'shared', 'unlisted');

-- Profiles (mirrors auth.users 1:1)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  email       text,
  bio         text,
  avatar_url   text,
  social_links jsonb,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Projects
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  visibility  visibility not null default 'private',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Logs (dev log entries per project)
create table public.logs (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  content     text,
  visibility  visibility not null default 'private',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Collaborators
create table public.collaborators (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('viewer', 'editor', 'admin')),
  unique (project_id, user_id)
);

-- Comments
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  log_id      uuid not null references public.logs(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function update_updated_at();
create trigger logs_updated_at before update on public.logs
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table public.profiles     enable row level security;
alter table public.projects     enable row level security;
alter table public.logs         enable row level security;
alter table public.collaborators enable row level security;
alter table public.comments     enable row level security;

-- Profiles: anyone can read, only owner can write
create policy "profiles: public read"  on public.profiles for select using (true);
create policy "profiles: owner write"  on public.profiles for update using (auth.uid() = id);

-- Projects: owner full access; collaborators can read; public projects readable by all
create policy "projects: owner all"    on public.projects for all using (auth.uid() = owner_id);
create policy "projects: collab read"  on public.projects for select using (
  exists (select 1 from public.collaborators where project_id = id and user_id = auth.uid())
);
create policy "projects: public read"  on public.projects for select using (visibility = 'public');

-- Logs: inherit project access
create policy "logs: owner all" on public.logs for all using (
  exists (select 1 from public.projects where id = project_id and owner_id = auth.uid())
);
create policy "logs: collab read" on public.logs for select using (
  exists (select 1 from public.collaborators where project_id = logs.project_id and user_id = auth.uid())
);
create policy "logs: public read" on public.logs for select using (
  visibility = 'public'
  and exists (
    select 1 from public.projects p
    where p.id = logs.project_id
      and p.visibility in ('public', 'unlisted')
  )
);

-- Logs: editors/admin collaborators can create and update logs in shared projects.
-- Owners keep full access through "logs: owner all" above; deletes remain owner-only.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'logs' and policyname = 'logs: collab insert'
  ) then
    create policy "logs: collab insert" on public.logs for insert with check (
      exists (
        select 1 from public.collaborators c
        where c.project_id = logs.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'logs' and policyname = 'logs: collab update'
  ) then
    create policy "logs: collab update" on public.logs for update using (
      exists (
        select 1 from public.collaborators c
        where c.project_id = logs.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    ) with check (
      exists (
        select 1 from public.collaborators c
        where c.project_id = logs.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    );
  end if;
end $$;

-- Security definer function: checks project ownership without triggering projects RLS.
-- Required to break the circular dependency between projects and collaborators policies.
create or replace function public.get_project_owner(p_project_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select owner_id from public.projects where id = p_project_id;
$$;

-- Collaborators: owner manages, collaborator can read own row
create policy "collaborators: owner all" on public.collaborators
  for all using (public.get_project_owner(project_id) = auth.uid());
create policy "collaborators: self read" on public.collaborators for select using (auth.uid() = user_id);

-- Comments: anyone with log access can read; authenticated users can insert/delete own
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
create policy "comments: insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments: delete own" on public.comments for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Migrations: run if table already exists
-- ──────────────────────────────────────────────
alter table public.profiles
  add column if not exists social_links jsonb,
  add column if not exists is_public boolean not null default true;

-- ──────────────────────────────────────────────
-- Storage: avatars bucket
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "avatars: owner upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
    and auth.role() = 'authenticated'
  );

create policy "avatars: owner update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- ──────────────────────────────────────────────
-- Migrations: projects cover image + tags + gradient
-- ──────────────────────────────────────────────
alter table public.projects
  add column if not exists cover_image_url text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists cover_gradient text;

-- Unlisted projects: anyone with the UUID link can read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'projects' and policyname = 'projects: unlisted read'
  ) then
    create policy "projects: unlisted read" on public.projects
      for select using (visibility = 'unlisted');
  end if;
end $$;

-- ──────────────────────────────────────────────
-- Storage: project-covers bucket
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('project-covers', 'project-covers', true)
  on conflict (id) do nothing;

create policy "project-covers: owner upload" on storage.objects
  for insert with check (
    bucket_id = 'project-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
    and auth.role() = 'authenticated'
  );

create policy "project-covers: owner update" on storage.objects
  for update using (
    bucket_id = 'project-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "project-covers: owner delete" on storage.objects
  for delete using (
    bucket_id = 'project-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "project-covers: public read" on storage.objects
  for select using (bucket_id = 'project-covers');

-- ──────────────────────────────────────────────
-- Migrations: logs mood + media
-- ──────────────────────────────────────────────
alter table public.logs
  add column if not exists mood text check (mood in ('building','shipped','stuck','reflecting','inspired','learning')),
  add column if not exists media jsonb not null default '[]';

-- ──────────────────────────────────────────────
-- Storage: log-media bucket
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('log-media', 'log-media', true)
  on conflict (id) do nothing;

create policy "log-media: owner upload" on storage.objects
  for insert with check (
    bucket_id = 'log-media'
    and auth.uid()::text = (storage.foldername(name))[1]
    and auth.role() = 'authenticated'
  );

create policy "log-media: owner delete" on storage.objects
  for delete using (
    bucket_id = 'log-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "log-media: public read" on storage.objects
  for select using (bucket_id = 'log-media');

-- ──────────────────────────────────────────────
-- Social: follows, reactions, notifications, view_count, trending view
-- ──────────────────────────────────────────────

alter table public.projects
  add column if not exists view_count integer not null default 0;

create table if not exists public.follows (
  id            uuid primary key default uuid_generate_v4(),
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.reactions (
  id          uuid primary key default uuid_generate_v4(),
  log_id      uuid not null references public.logs(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('heart', 'fire', 'rocket')),
  created_at  timestamptz not null default now(),
  unique (log_id, user_id, type)
);

create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('follow', 'comment', 'reaction')),
  project_id  uuid references public.projects(id) on delete cascade,
  log_id      uuid references public.logs(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx  on public.follows (follower_id);
create index if not exists reactions_log_id_idx     on public.reactions (log_id);

alter table public.follows       enable row level security;
alter table public.reactions     enable row level security;
alter table public.notifications enable row level security;

-- Follows: anyone can read, only the follower can insert/delete their own rows
do $$ begin
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows: public read') then
    create policy "follows: public read" on public.follows for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows: self insert') then
    create policy "follows: self insert" on public.follows for insert with check (auth.uid() = follower_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows: self delete') then
    create policy "follows: self delete" on public.follows for delete using (auth.uid() = follower_id);
  end if;
end $$;

-- Reactions: readable when the underlying log is readable; only the reactor can insert/delete
do $$ begin
  if not exists (select 1 from pg_policies where tablename='reactions' and policyname='reactions: read') then
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
  end if;
  if not exists (select 1 from pg_policies where tablename='reactions' and policyname='reactions: self insert') then
    create policy "reactions: self insert" on public.reactions for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='reactions' and policyname='reactions: self delete') then
    create policy "reactions: self delete" on public.reactions for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Notifications: only the recipient can read/update; any authenticated user can insert (as actor)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications: recipient read') then
    create policy "notifications: recipient read" on public.notifications for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications: recipient update') then
    create policy "notifications: recipient update" on public.notifications for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications: actor insert') then
    create policy "notifications: actor insert" on public.notifications for insert with check (auth.uid() = actor_id);
  end if;
end $$;

-- View-count RPC (called from explore.service.ts → exploreService.incrementProjectView)
create or replace function public.increment_project_views(project_id uuid)
returns void
language sql
security definer
as $$
  update public.projects set view_count = view_count + 1 where id = project_id;
$$;

-- Trending projects view: public projects ranked by recent activity
-- trend_score = log count in last 14 days + view_count / 50, plus a tiny recency tiebreak
create or replace view public.trending_projects_view as
  select
    p.id,
    p.owner_id,
    p.title,
    p.description,
    p.visibility,
    p.cover_image_url,
    p.tags,
    p.view_count,
    p.created_at,
    p.updated_at,
    pr.username     as owner_username,
    pr.avatar_url   as owner_avatar_url,
    coalesce(recent.log_count, 0)::bigint as log_count,
    (
      coalesce(recent.log_count, 0)::numeric
      + (p.view_count::numeric / 50)
      + (extract(epoch from p.updated_at) / 100000000)
    ) as trend_score
  from public.projects p
  join public.profiles pr on pr.id = p.owner_id
  left join lateral (
    select count(*) as log_count
    from public.logs l
    where l.project_id = p.id
      and l.visibility = 'public'
      and l.created_at > now() - interval '14 days'
  ) recent on true
  where p.visibility = 'public'
  order by trend_score desc;

grant select on public.trending_projects_view to anon, authenticated;

-- ──────────────────────────────────────────────
-- MCP Phase 1: owner-scoped agent tokens + audit log
-- ──────────────────────────────────────────────

create table if not exists public.agent_tokens (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  token_hash          text not null unique,
  scopes              text[] not null default '{}',
  allowed_project_ids uuid[],
  expires_at          timestamptz,
  revoked_at          timestamptz,
  last_used_at        timestamptz,
  created_at          timestamptz not null default now(),
  check (array_length(scopes, 1) is null or scopes <@ array[
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
  ]::text[])
);

create index if not exists agent_tokens_owner_id_idx on public.agent_tokens (owner_id);
create index if not exists agent_tokens_token_hash_idx on public.agent_tokens (token_hash);

create table if not exists public.agent_audit_logs (
  id         uuid primary key default uuid_generate_v4(),
  token_id   uuid references public.agent_tokens(id) on delete set null,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  action     text not null,
  project_id uuid references public.projects(id) on delete set null,
  log_id     uuid references public.logs(id) on delete set null,
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists agent_audit_logs_owner_id_created_at_idx
  on public.agent_audit_logs (owner_id, created_at desc);
create index if not exists agent_audit_logs_token_id_idx on public.agent_audit_logs (token_id);

alter table public.agent_tokens     enable row level security;
alter table public.agent_audit_logs enable row level security;

-- Owners can manage their own agent tokens from the Phase 2 UI.
-- Raw tokens are never stored; only token_hash is persisted.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='agent_tokens' and policyname='agent_tokens: owner read') then
    create policy "agent_tokens: owner read" on public.agent_tokens
      for select using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='agent_tokens' and policyname='agent_tokens: owner insert') then
    create policy "agent_tokens: owner insert" on public.agent_tokens
      for insert with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='agent_tokens' and policyname='agent_tokens: owner revoke') then
    create policy "agent_tokens: owner revoke" on public.agent_tokens
      for update using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='agent_tokens' and policyname='agent_tokens: owner delete') then
    create policy "agent_tokens: owner delete" on public.agent_tokens
      for delete using (auth.uid() = owner_id);
  end if;

  if not exists (select 1 from pg_policies where tablename='agent_audit_logs' and policyname='agent_audit_logs: owner read') then
    create policy "agent_audit_logs: owner read" on public.agent_audit_logs
      for select using (auth.uid() = owner_id);
  end if;
end $$;

-- ──────────────────────────────────────────────
-- Plan Phase 1: milestones + todos
-- ──────────────────────────────────────────────

create table if not exists public.plan_milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'doing', 'done')),
  visibility visibility not null default 'private',
  target_date date,
  sort_order integer not null default 0,

  created_by uuid references public.profiles(id) on delete set null,
  created_by_agent_token_id uuid references public.agent_tokens(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.plan_todos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid not null references public.plan_milestones(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'doing', 'done')),
  visibility visibility not null default 'private',
  sort_order integer not null default 0,

  created_by uuid references public.profiles(id) on delete set null,
  created_by_agent_token_id uuid references public.agent_tokens(id) on delete set null,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_by_agent_token_id uuid references public.agent_tokens(id) on delete set null,

  linked_log_id uuid references public.logs(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists plan_milestones_project_id_sort_order_idx
  on public.plan_milestones (project_id, sort_order, created_at);
create index if not exists plan_milestones_owner_id_idx
  on public.plan_milestones (owner_id);
create index if not exists plan_todos_project_milestone_sort_order_idx
  on public.plan_todos (project_id, milestone_id, sort_order, created_at);
create index if not exists plan_todos_owner_id_idx
  on public.plan_todos (owner_id);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'plan_milestones_updated_at') then
    create trigger plan_milestones_updated_at before update on public.plan_milestones
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'plan_todos_updated_at') then
    create trigger plan_todos_updated_at before update on public.plan_todos
      for each row execute function update_updated_at();
  end if;
end $$;

alter table public.plan_milestones enable row level security;
alter table public.plan_todos      enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='plan_milestones' and policyname='plan_milestones: owner all') then
    create policy "plan_milestones: owner all" on public.plan_milestones for all using (
      exists (select 1 from public.projects p where p.id = plan_milestones.project_id and p.owner_id = auth.uid())
    ) with check (
      owner_id = auth.uid()
      and exists (select 1 from public.projects p where p.id = plan_milestones.project_id and p.owner_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_milestones' and policyname='plan_milestones: collab read') then
    create policy "plan_milestones: collab read" on public.plan_milestones for select using (
      visibility in ('shared', 'unlisted', 'public')
      and exists (select 1 from public.collaborators c where c.project_id = plan_milestones.project_id and c.user_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_milestones' and policyname='plan_milestones: collab write') then
    create policy "plan_milestones: collab write" on public.plan_milestones for all using (
      exists (
        select 1 from public.collaborators c
        where c.project_id = plan_milestones.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    ) with check (
      owner_id = public.get_project_owner(project_id)
      and exists (
        select 1 from public.collaborators c
        where c.project_id = plan_milestones.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_milestones' and policyname='plan_milestones: public read') then
    create policy "plan_milestones: public read" on public.plan_milestones for select using (
      visibility in ('public', 'unlisted')
      and exists (
        select 1 from public.projects p
        where p.id = plan_milestones.project_id
          and p.visibility in ('public', 'unlisted')
      )
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_todos' and policyname='plan_todos: owner all') then
    create policy "plan_todos: owner all" on public.plan_todos for all using (
      exists (select 1 from public.projects p where p.id = plan_todos.project_id and p.owner_id = auth.uid())
    ) with check (
      owner_id = auth.uid()
      and exists (select 1 from public.projects p where p.id = plan_todos.project_id and p.owner_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_todos' and policyname='plan_todos: collab read') then
    create policy "plan_todos: collab read" on public.plan_todos for select using (
      visibility in ('shared', 'unlisted', 'public')
      and exists (select 1 from public.collaborators c where c.project_id = plan_todos.project_id and c.user_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_todos' and policyname='plan_todos: collab write') then
    create policy "plan_todos: collab write" on public.plan_todos for all using (
      exists (
        select 1 from public.collaborators c
        where c.project_id = plan_todos.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    ) with check (
      owner_id = public.get_project_owner(project_id)
      and exists (
        select 1 from public.collaborators c
        where c.project_id = plan_todos.project_id
          and c.user_id = auth.uid()
          and c.role in ('editor', 'admin')
      )
    );
  end if;

  if not exists (select 1 from pg_policies where tablename='plan_todos' and policyname='plan_todos: public read') then
    create policy "plan_todos: public read" on public.plan_todos for select using (
      visibility in ('public', 'unlisted')
      and exists (
        select 1 from public.projects p
        where p.id = plan_todos.project_id
          and p.visibility in ('public', 'unlisted')
      )
    );
  end if;
end $$;
