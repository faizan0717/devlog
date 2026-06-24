# Plan Feature Roadmap

This document defines the **Plan** feature for devLog: a project-level planning system where a roadmap is represented as **milestones**, and each milestone contains **todos**.

---

## Confirmed Product Decisions

- **Plan visibility:** user-selectable, like logs/projects.
- **Structure:** `Milestones → Todos`.
- **Milestone statuses:** `pending`, `doing`, `done`.
- **Agent support:** AI agents can create, update, and complete milestones/todos.
- **Todo-to-log:** completing a todo can create or link a devLog timeline log.

---

## Feature Goal

The Plan section should answer:

> What is planned, what is being worked on, what is done, and what progress can be turned into a devLog entry?

It should feel lightweight and maker-focused, not like Jira or a corporate task manager.

---

## Core UX

Inside each project, the user sees a **Plan** tab.

Layout:

```txt
Plan

Left side:
Milestones
+ Add milestone

[pending] v0.1 Foundation
[doing]   v0.2 Core features
[pending] v0.3 Social layer
[done]    Landing polish

Right side:
v0.2 Core features
Visibility: public/private/shared/unlisted
Status: doing
3 open · 1 done

[x] Wire authentication flow
[ ] Write integration tests for auth
[ ] Add rate limiting to API endpoints
[ ] Design public profile page

+ Add todo
```

---

## Data Model

### `plan_milestones`

Stores roadmap items/phases/releases for a project.

Suggested fields:

```sql
id uuid primary key
project_id uuid references projects(id) on delete cascade
owner_id uuid references profiles(id) on delete cascade

title text not null
description text
status text check (status in ('pending', 'doing', 'done')) not null default 'pending'
visibility visibility not null default 'private'
target_date date
sort_order integer not null default 0

created_by uuid references profiles(id)
created_by_agent_token_id uuid references agent_tokens(id)

created_at timestamptz default now()
updated_at timestamptz default now()
completed_at timestamptz
```

### `plan_todos`

Stores todos under milestones.

Suggested fields:

```sql
id uuid primary key
project_id uuid references projects(id) on delete cascade
milestone_id uuid references plan_milestones(id) on delete cascade
owner_id uuid references profiles(id) on delete cascade

title text not null
description text
status text check (status in ('pending', 'doing', 'done')) not null default 'pending'
visibility visibility not null default 'private'
sort_order integer not null default 0

created_by uuid references profiles(id)
created_by_agent_token_id uuid references agent_tokens(id)
completed_by uuid references profiles(id)
completed_by_agent_token_id uuid references agent_tokens(id)

linked_log_id uuid references logs(id) on delete set null

created_at timestamptz default now()
updated_at timestamptz default now()
completed_at timestamptz
```

---

## Visibility Rules

Plan items should behave like logs.

| Visibility | Access |
|---|---|
| private | owner only |
| shared | owner + project collaborators |
| public | visible publicly if project allows public access |
| unlisted | accessible by direct project/link access |

Important rule:

> A milestone/todo should not be more visible than its parent project.

Example:

- Private project + public todo = still not publicly discoverable.
- Public project + private todo = visible only to owner/collaborators.

---

## MVP Features

### Milestones

- [ ] Create milestone
- [ ] Edit milestone title/description/status/visibility/date
- [ ] Delete milestone
- [ ] Reorder milestones
- [ ] Show progress from child todos
- [ ] Filter by status: pending/doing/done

### Todos

- [ ] Add todo under milestone
- [ ] Edit todo title/description/status/visibility
- [ ] Mark todo as done
- [ ] Reopen todo
- [ ] Delete todo
- [ ] Reorder todos
- [ ] Move todo between milestones
- [ ] Show whether todo was added by user or agent

### Todo → Log

When a todo is completed, offer:

```txt
Create a devLog entry from this todo?
```

Options:

- Create new log from todo title/description
- Link to existing log
- Skip

Todo should show linked log if present.

---

## Agent Features

Agents should be able to:

- create milestone
- update milestone
- list milestones
- create todo
- update todo
- complete todo
- list todos
- link todo to log
- create log from completed todo

Example agent actions:

```txt
Create milestone "v0.3 Social Layer" for project X.
Add todo "Implement comments" under v0.3.
Mark todo "Write auth tests" as done and create a log from it.
```

Agent-created items should display source info:

```txt
added by Claude Code · 10m ago
completed by Claude Code · linked log
```

---

## API / MCP Roadmap

### REST endpoints

```txt
GET    /projects/{project_id}/plan
POST   /projects/{project_id}/milestones
PATCH  /milestones/{milestone_id}
DELETE /milestones/{milestone_id}

POST   /milestones/{milestone_id}/todos
PATCH  /todos/{todo_id}
DELETE /todos/{todo_id}
POST   /todos/{todo_id}/complete
POST   /todos/{todo_id}/link-log
```

### New agent token scopes

```txt
read_plan
create_plan
update_plan
complete_todo
link_todo_log
```

---

## UI Components Needed

Suggested components:

```txt
features/plan/
  components/
    PlanTab.tsx
    MilestoneList.tsx
    MilestoneItem.tsx
    MilestoneEditorModal.tsx
    TodoList.tsx
    TodoItem.tsx
    TodoEditorModal.tsx
    TodoCompleteLogModal.tsx
  hooks/
    usePlan.ts
  services/
    plan.service.ts
```

---

## Implementation Phases

### Phase 1 — Core Plan System

- [x] Add `plan_milestones` table
- [x] Add `plan_todos` table
- [x] Add RLS policies for private/public/shared/unlisted plan items
- [x] Add TypeScript types
- [x] Add `plan.service.ts`
- [x] Add `usePlan(projectId)` hook
- [x] Replace hardcoded `PlanTab` in `ProjectDetail.tsx` with real data

### Phase 2 — Milestones + Todos UX

- [x] Create/edit/delete milestones
- [x] Create/edit/delete todos
- [x] Support statuses: `pending`, `doing`, `done`
- [x] Add visibility selector for milestones/todos
- [x] Show progress counts per milestone
- [x] Add empty states
- [x] Make the Plan tab mobile-friendly

### Phase 3 — Todo Completion Polish

Decision: skip todo ↔ log linking for now. Keep Phase 3 focused on making todo completion feel good without adding log creation/linking complexity yet.

Implementation order:

1. Completion interaction polish
   - Mark a todo done inline with strong feedback.
   - Keep reopening behavior inline/no modal.
   - Avoid todo-to-log prompts for now.
2. Completion metadata polish
   - Display completed time clearly.
   - Display completed-by label when available.
   - Preserve agent fields for Phase 4 source labels.
3. Done-state UX
   - Visually separate done/open todos.
   - Make completed todos scannable without hiding useful context.
   - Add small empty/done-state copy where needed.

Deferred todo ↔ log linking:

- Create new log from completed todo.
- Link todo to an existing log.
- Show linked log on todo.
- Completion modal with Create/Link/Skip actions.

Checklist:

- [x] Mark todo as done
- [x] Reopen completed todo
- [ ] Show completion source: completed by user/agent
- [ ] Polish done/open todo presentation
- [ ] Add clearer completion feedback/copy

### Phase 4 — Agent + Public Roadmap

- [ ] Add MCP/REST tools for plan
- [ ] Let agents create/update/complete milestones and todos
- [ ] Add agent token scopes for plan access
- [ ] Audit agent plan actions
- [ ] Render public Plan view based on visibility
- [ ] Show source labels: `added by you`, `added by Claude Code`, etc.

---

## Open Decisions

Still to decide:

1. Should todos support priority: low/medium/high?
2. Should todos support due dates?
3. Should milestones have dates or only ordering?
4. Should deleting a milestone delete todos or move them to an inbox?
5. Should there be an “Unplanned” milestone for agent-created todos?
