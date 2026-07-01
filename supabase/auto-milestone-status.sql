-- Auto-sync milestone status from child todo statuses.
-- Rules:
-- - no todos: milestone stays/returns to todo
-- - all todos done: milestone is done
-- - all todos todo: milestone is todo
-- - any mixed/in-progress state (in_queue, doing, verify, or mixed todo/done): milestone is doing

create or replace function public.derive_plan_milestone_status(p_milestone_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  with todo_stats as (
    select
      count(*) as total,
      bool_and(status = 'done') as all_done,
      bool_and(status = 'todo') as all_todo
    from public.plan_todos
    where milestone_id = p_milestone_id
  )
  select case
    when total = 0 then 'todo'
    when all_done then 'done'
    when all_todo then 'todo'
    else 'doing'
  end
  from todo_stats;
$$;

create or replace function public.sync_plan_milestone_status(p_milestone_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text;
begin
  if p_milestone_id is null then
    return;
  end if;

  next_status := public.derive_plan_milestone_status(p_milestone_id);

  update public.plan_milestones
  set
    status = next_status,
    completed_at = case
      when next_status = 'done' then coalesce(completed_at, now())
      else null
    end
  where id = p_milestone_id
    and (
      status is distinct from next_status
      or (next_status = 'done' and completed_at is null)
      or (next_status <> 'done' and completed_at is not null)
    );
end;
$$;

create or replace function public.handle_plan_todo_milestone_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_plan_milestone_status(old.milestone_id);
    return old;
  end if;

  perform public.sync_plan_milestone_status(new.milestone_id);

  if tg_op = 'UPDATE' and old.milestone_id is distinct from new.milestone_id then
    perform public.sync_plan_milestone_status(old.milestone_id);
  end if;

  return new;
end;
$$;

drop trigger if exists plan_todos_sync_milestone_status on public.plan_todos;
create trigger plan_todos_sync_milestone_status
after insert or update of status, milestone_id or delete on public.plan_todos
for each row execute function public.handle_plan_todo_milestone_status();

-- Backfill existing milestones once after installing the trigger.
do $$
declare
  milestone record;
begin
  for milestone in select id from public.plan_milestones loop
    perform public.sync_plan_milestone_status(milestone.id);
  end loop;
end $$;
