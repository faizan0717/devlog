# devLog MCP — Agent Documentation

devLog is a cinematic timeline platform for makers. You are connected as a scoped agent on behalf of the token owner. Use these tools to read projects, post timeline log entries, and manage project plans.

## Tools

### devlog_get_docs
Fetch this help file. Call this at the start of any devLog session to get the latest tool docs.

No params, no scope required.

---

### devlog_list_projects
List projects owned by the token owner (filtered to allowed projects if the token is restricted).

**Requires scope:** `read_projects`

---

### devlog_get_project_timeline
Read one project and its timeline logs.

**Params:** `project_id` uuid.

**Requires scope:** `read_logs`

---

### devlog_create_project
Create a new devLog project.

**Params:** `title`, optional `description`, `visibility` (`private` | `public` | `unlisted`), `tags`.

**Requires scope:** `create_project`

---

### devlog_update_project
Update project fields.

**Params:** `project_id`, optional `title`, `description`, `visibility`, `tags`.

**Requires scope:** `update_project`

---

### devlog_create_log
Create a timeline log entry.

**Params:** `project_id`, `title`, optional `content`, `visibility`, `mood`.

**Requires scope:** `create_log`

---

### devlog_update_log
Update a timeline log entry.

**Params:** `log_id`, optional `title`, `content`, `visibility`, `mood`.

**Requires scope:** `update_log`

---

### devlog_get_project_plan
Read project plan milestones and todos.

**Params:** `project_id` uuid.

Returns `{ milestones, todos }`. Each returned milestone has `plan_ref` like `1.1`; each todo has `plan_ref` like `1.1.3`.

**Requires scope:** `read_plan`

---

### devlog_create_plan_milestone
Create a plan milestone.

**Params:**
- `project_id` uuid
- `title` string
- optional `description`
- `status` — `pending` | `doing` | `done` default `pending`
- `visibility` — `private` | `public` | `shared` | `unlisted` default `private`
- optional `target_date` as `YYYY-MM-DD`
- optional `sort_order` integer

**Requires scope:** `create_plan`

---

### devlog_update_plan_milestone
Update a plan milestone.

**Params:** `milestone_id`, optional `title`, `description`, `status`, `visibility`, `target_date`, `sort_order`.

**Requires scope:** `update_plan`

---

### devlog_delete_plan_milestone
Delete a plan milestone and its todos.

**Params:** `milestone_id` uuid.

**Requires scope:** `update_plan`

---

### devlog_create_plan_todo
Create a plan todo under a milestone.

**Params:**
- `milestone_id` uuid
- `title` string
- optional `description`
- `status` — `pending` | `doing` | `done` default `pending`
- `visibility` — `private` | `public` | `shared` | `unlisted` default `private`
- optional `sort_order` integer

**Requires scope:** `create_plan`

---

### devlog_update_plan_todo
Update a plan todo.

**Params:** `todo_id`, optional `title`, `description`, `status`, `visibility`, `milestone_id`, `sort_order`.

**Requires scope:** `update_plan`

---

### devlog_delete_plan_todo
Delete a plan todo.

**Params:** `todo_id` uuid.

**Requires scope:** `update_plan`

---

### devlog_complete_plan_todo
Mark todo(s) as done and record the completing agent token.

**Params:** either `todo_id` uuid, or `project_id` uuid + `todo_ref` (`1.1.3` for one todo, `1.1.*` for all todos in a milestone).

**Requires scope:** `complete_todo`

---

### devlog_reopen_plan_todo
Reopen completed todo(s).

**Params:** either `todo_id` uuid, or `project_id` uuid + `todo_ref` (`1.1.3` or `1.1.*`), optional `status` (`pending` | `doing`, default `pending`).

**Requires scope:** `complete_todo`

---

## REST endpoints

All requests require `Authorization: Bearer <token>`.

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/docs` | none | This file |
| GET | `/projects` | `read_projects` | List projects |
| POST | `/projects` | `create_project` | Create project |
| PATCH | `/projects/:id` | `update_project` | Update project |
| GET | `/projects/:id/timeline` | `read_logs` | Project + logs |
| POST | `/logs` | `create_log` | Create log |
| PATCH | `/logs/:id` | `update_log` | Update log |
| GET | `/projects/:id/plan` | `read_plan` | Milestones + todos |
| POST | `/projects/:id/milestones` | `create_plan` | Create milestone |
| PATCH | `/milestones/:id` | `update_plan` | Update milestone |
| DELETE | `/milestones/:id` | `update_plan` | Delete milestone |
| POST | `/milestones/:id/todos` | `create_plan` | Create todo |
| PATCH | `/todos/:id` | `update_plan` | Update todo |
| DELETE | `/todos/:id` | `update_plan` | Delete todo |
| POST | `/todos/:id/complete` | `complete_todo` | Complete todo |
| POST | `/todos/:id/reopen` | `complete_todo` | Reopen todo |
| POST | `/projects/:id/todos/complete` | `complete_todo` | Complete todo(s) by `todo_ref` body (`1.1.3` or `1.1.*`) |
| POST | `/projects/:id/todos/reopen` | `complete_todo` | Reopen todo(s) by `todo_ref` body (`1.1.3` or `1.1.*`) |

## References

Moods: `building` | `shipped` | `stuck` | `reflecting` | `inspired` | `learning`

Visibility: `private` | `public` | `unlisted` | `shared`

Plan statuses: `pending` | `doing` | `done`

Plan refs: `1.<milestone>.<todo>` are generated from sorted plan order, e.g. `1.1.3`; use `1.1.*` to target every todo in milestone `1.1`.

## Notes

- Agents can only access projects owned by the token owner and allowed by `allowed_project_ids`.
- Media cannot be uploaded via MCP/REST.
- Agent-created plan items set `created_by_agent_token_id`.
- Agent-completed todos set `completed_by_agent_token_id`.
- All actions are recorded in the owner's audit log.
