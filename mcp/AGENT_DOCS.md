# devLog MCP — Agent Documentation

devLog is a cinematic timeline platform for makers. You are connected as a scoped agent on behalf of the token owner. Use these tools to read their projects and post timeline log entries.

## Tools

### devlog_get_docs
Fetch this help file. Call this at the start of any devLog session to get the latest tool docs.

No params, no scope required.

---

### devlog_list_projects
List all projects owned by the token owner (filtered to allowed projects if the token is restricted).

Returns an array of projects with: `id`, `title`, `description`, `visibility`, `tags`, `cover_image_url`, `view_count`, `created_at`, `updated_at`.

**Requires scope:** `read_projects`

---

### devlog_get_project_timeline
Read a single project and its full log timeline.

**Params:**
- `project_id` (uuid, required)

Returns `{ project, logs[] }`. Logs include: `id`, `title`, `content` (markdown), `visibility`, `mood`, `media`, `created_at`, `updated_at`.

**Requires scope:** `read_logs`

---

### devlog_create_project
Create a new project owned by the token owner.

**Params:**
- `title` (string, max 100 chars, required)
- `description` (string, max 500 chars, optional)
- `visibility` — `private` | `public` | `unlisted` (default: `private`)
- `tags` (string array, max 10, optional)

Returns the created project row.

**Requires scope:** `create_project`

---

### devlog_update_project
Update an existing project owned by the token owner. All fields are optional — only the fields you pass will be changed.

**Params:**
- `project_id` (uuid, required)
- `title` (string, max 100 chars, optional)
- `description` (string, max 500 chars, optional)
- `visibility` — `private` | `public` | `unlisted` (optional)
- `tags` (string array, max 10, optional)

Returns the updated project row.

**Requires scope:** `update_project`

---

### devlog_create_log
Create a new timeline log entry in a project.

**Params:**
- `project_id` (uuid, required)
- `title` (string, max 160 chars, required)
- `content` (markdown string, max 50 000 chars, optional)
- `visibility` — `private` | `public` | `shared` | `unlisted` (default: `private`)
- `mood` — `building` | `shipped` | `stuck` | `reflecting` | `inspired` | `learning` (optional)

Returns the created log row.

**Requires scope:** `create_log`

---

### devlog_update_log
Update an existing timeline log entry. All fields are optional — only the fields you pass will be changed.

**Params:**
- `log_id` (uuid, required)
- `title` (string, max 160 chars, optional)
- `content` (markdown string, max 50 000 chars, optional)
- `visibility` — `private` | `public` | `shared` | `unlisted` (optional)
- `mood` — `building` | `shipped` | `stuck` | `reflecting` | `inspired` | `learning` (optional)

Returns the updated log row.

**Requires scope:** `update_log`

---

## REST endpoints (alternative to MCP tools)

All requests require `Authorization: Bearer <token>`.

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/docs` | none | This file |
| GET | `/projects` | `read_projects` | List projects |
| GET | `/projects/:id/timeline` | `read_logs` | Project + all logs |
| POST | `/projects` | `create_project` | Create project |
| PATCH | `/projects/:id` | `update_project` | Update project fields |
| POST | `/logs` | `create_log` | Create log entry |
| PATCH | `/logs/:id` | `update_log` | Update log fields |

---

## Moods reference

| Value | When to use |
|---|---|
| `building` | Actively building a feature |
| `shipped` | Something just launched or merged |
| `stuck` | Blocked, debugging, frustrated |
| `reflecting` | Looking back, retrospective |
| `inspired` | New idea, motivation spike |
| `learning` | Reading, researching, exploring |

## Visibility reference

| Value | Who sees it |
|---|---|
| `private` | Owner only |
| `public` | Everyone |
| `unlisted` | Anyone with the link |
| `shared` | Project collaborators |

## Notes

- Agents can only access projects owned by the token owner — not shared/collaborator projects.
- Media (images/video) cannot be uploaded via MCP — only title, content, mood, and visibility.
- All actions are recorded in the owner's audit log visible on the Agent Access page.
