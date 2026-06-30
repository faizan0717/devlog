-- Expand plan status workflow from pending/doing/done to todo/in_queue/doing/verify/done.
-- Keeps existing pending rows by migrating them to todo.

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.plan_milestones'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';

  if constraint_name is not null then
    execute format('alter table public.plan_milestones drop constraint %I', constraint_name);
  end if;
end $$;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.plan_todos'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';

  if constraint_name is not null then
    execute format('alter table public.plan_todos drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.plan_milestones alter column status set default 'todo';
alter table public.plan_todos alter column status set default 'todo';

update public.plan_milestones set status = 'todo' where status = 'pending';
update public.plan_todos set status = 'todo' where status = 'pending';

alter table public.plan_milestones
  add constraint plan_milestones_status_check
  check (status in ('todo', 'in_queue', 'doing', 'verify', 'done'));

alter table public.plan_todos
  add constraint plan_todos_status_check
  check (status in ('todo', 'in_queue', 'doing', 'verify', 'done'));
