# devLog MCP — Agent Documentation

devLog is a cinematic timeline platform for makers. You are connected through a delegated agent token for the token owner. The token lets you use devLog as that user, limited by their project access and any selected-project restriction on the token.

Connection modes:
- REST is the universal fallback at `https://api.devlog.one`; use it whenever MCP is unsupported or unavailable.
- Hosted MCP is available at `https://api.devlog.one/mcp` only for clients that support HTTP MCP with Authorization headers.
- Skills/rules/instructions teach the agent when and how to use devLog, including the REST fallback.
- setup.sh is a local/global setup manager, verifier, status checker, and uninstaller. It writes REST instructions for all supported agents and can write MCP config for known local project clients with `--mcp`.

Agent setup lifecycle:
```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install <token> --global
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install <token> --local --agents all --mcp
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- verify
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- status
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --local
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --global
```

Token resolution order: `./.devlog` → `~/.devlog` → `DEVLOG_AGENT_TOKEN`. If local and global tokens both exist, local wins. Uninstall only removes local/global setup files; revoke/delete remote tokens from devLog → Agent Access.

## Tools

### devlog_get_docs
Fetch this help file. Call this at the start of any devLog session to get the latest tool docs.

No params. No token permissions beyond a valid connection are needed.

---

### devlog_list_projects
List projects the token owner can access (filtered to allowed projects if the token is restricted).

**Access:** token owner must be able to access the project(s).

---

### devlog_get_project_timeline
Read one project and its timeline logs.

**Params:** `project_id` uuid.

**Access:** token owner must be able to access the project(s).

---

### devlog_create_project
Create a new devLog project.

**Params:** `title`, optional `description`, `visibility` (`private` | `public` | `unlisted`), `tags`.

**Access:** token owner can create projects.

---

### devlog_update_project
Update project fields.

**Params:** `project_id`, optional `title`, `description`, `visibility`, `tags`.

**Access:** token owner must be able to update the project.

---

### devlog_create_log
Create a timeline log entry.

**Params:** `project_id`, `title`, optional `content`, `visibility`, `mood`.

**Access:** token owner must be able to write to the project.

---

### devlog_update_log
Update a timeline log entry.

**Params:** `log_id`, optional `title`, `content`, `visibility`, `mood`.

**Access:** token owner must be able to write to the log project.

---

### devlog_get_project_plan
Read project plan milestones and todos.

**Params:** `project_id` uuid.

Returns `{ milestones, todos }`. Each returned milestone has `plan_ref` like `1.1`; each todo has `plan_ref` like `1.1.3`.

**Access:** token owner must be able to access the project(s).

---

### devlog_create_plan_milestone
Create a plan milestone.

**Params:**
- `project_id` uuid
- `title` string
- optional `description`
- `status` — `todo` | `in_queue` | `doing` | `verify` | `done` default `todo`
- `visibility` — `private` | `public` | `shared` | `unlisted` default `private`
- optional `target_date` as `YYYY-MM-DD`
- optional `sort_order` integer

**Access:** token owner must be able to write to the project.

---

### devlog_update_plan_milestone
Update a plan milestone.

**Params:** `milestone_id`, optional `title`, `description`, `status`, `visibility`, `target_date`, `sort_order`.

**Access:** token owner must be able to write to the project.

---

### devlog_delete_plan_milestone
Delete a plan milestone and its todos.

**Params:** `milestone_id` uuid.

**Access:** token owner must be able to write to the project.

---

### devlog_create_plan_todo
Create a plan todo under a milestone.

**Params:**
- `milestone_id` uuid
- `title` string
- optional `description`
- `status` — `todo` | `in_queue` | `doing` | `verify` | `done` default `todo`
- `visibility` — `private` | `public` | `shared` | `unlisted` default `private`
- optional `sort_order` integer

**Access:** token owner must be able to write to the project.

---

### devlog_update_plan_todo
Update a plan todo.

**Params:** `todo_id`, optional `title`, `description`, `status`, `visibility`, `milestone_id`, `sort_order`.

**Access:** token owner must be able to write to the project.

---

### devlog_delete_plan_todo
Delete a plan todo.

**Params:** `todo_id` uuid.

**Access:** token owner must be able to write to the project.

---

### devlog_complete_plan_todo
Mark todo(s) as done and record the completing agent token.

**Params:** either `todo_id` uuid, or `project_id` uuid + `todo_ref` (`1.1.3` for one todo, `1.1.*` for all todos in a milestone).

**Access:** token owner must be able to write to the project.

---

### devlog_reopen_plan_todo
Reopen completed todo(s).

**Params:** either `todo_id` uuid, or `project_id` uuid + `todo_ref` (`1.1.3` or `1.1.*`), optional `status` (`todo` | `in_queue` | `doing` | `verify`, default `todo`).

**Access:** token owner must be able to write to the project.

---

## REST endpoints

All requests require `Authorization: Bearer <token>`.

| Method | Path | Access | Description |
|--------|------|-------|-------------|
| GET | `/docs` | Public docs | This file |
| GET | `/projects` | Project access | List projects |
| POST | `/projects` | User project creation | Create project |
| PATCH | `/projects/:id` | Project write access | Update project |
| GET | `/projects/:id/timeline` | Project access | Project + logs |
| POST | `/logs` | Project write access | Create log |
| PATCH | `/logs/:id` | Project write access | Update log |
| GET | `/projects/:id/plan` | Project access | Milestones + todos |
| POST | `/projects/:id/milestones` | Project write access | Create milestone |
| PATCH | `/milestones/:id` | Project write access | Update milestone |
| DELETE | `/milestones/:id` | Project write access | Delete milestone |
| POST | `/milestones/:id/todos` | Project write access | Create todo |
| PATCH | `/todos/:id` | Project write access | Update todo |
| DELETE | `/todos/:id` | Project write access | Delete todo |
| POST | `/todos/:id/complete` | Project write access | Complete todo |
| POST | `/todos/:id/reopen` | Project write access | Reopen todo |
| POST | `/projects/:id/todos/complete` | Project write access | Complete todo(s) by `todo_ref` body (`1.1.3` or `1.1.*`) |
| POST | `/projects/:id/todos/reopen` | Project write access | Reopen todo(s) by `todo_ref` body (`1.1.3` or `1.1.*`) |

## References

Moods: `building` | `shipped` | `stuck` | `reflecting` | `inspired` | `learning`

Visibility: `private` | `public` | `unlisted` | `shared`

Plan statuses: `todo` | `in_queue` | `doing` | `verify` | `done` (`pending` is accepted as a legacy alias for `todo`; `in que` is accepted as an alias for `in_queue`)

Plan refs: `1.<milestone>.<todo>` are generated from sorted plan order, e.g. `1.1.3`; use `1.1.*` to target every todo in milestone `1.1`.

## Notes

- Agents can access projects available to the token owner, further limited by `allowed_project_ids` when present.
- For setup troubleshooting, run `setup.sh status` to inspect local/global/effective token source, then `setup.sh verify` to detect missing tokens, malformed tokens, revoked/expired tokens, project-access restrictions, API reachability issues, or local tokens overriding global tokens.
- Media cannot be uploaded via MCP/REST.
- Agent-created plan items set `created_by_agent_token_id`.
- Agent-completed todos set `completed_by_agent_token_id`.
- All actions are recorded in the owner's audit log.
