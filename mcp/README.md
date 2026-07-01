# devLog MCP / REST server

Gives AI agents (Claude, Cursor, Windsurf, Copilot, scripts) delegated access to the token owner's devLog projects via hosted MCP and REST.

REST is the universal interface. Hosted MCP is available at `/mcp` for clients that support HTTP MCP with Authorization headers; unsupported MCP clients should use REST and the setup.sh-written agent instructions.

## Agent capabilities

| Capability | MCP tool / REST endpoint |
|---|---|
| Read docs | `devlog_get_docs` / `GET /docs` |
| List projects | `devlog_list_projects` / `GET /projects` |
| Read timeline | `devlog_get_project_timeline` / `GET /projects/:id/timeline` |
| Create/update projects | `devlog_create_project`, `devlog_update_project` / `POST /projects`, `PATCH /projects/:id` |
| Create/update logs | `devlog_create_log`, `devlog_update_log` / `POST /logs`, `PATCH /logs/:id` |
| Read project plan | `devlog_get_project_plan` / `GET /projects/:id/plan` |
| Manage milestones | create/update/delete milestone tools / `/projects/:id/milestones`, `/milestones/:id` |
| Manage todos | create/update/delete todo tools / `/milestones/:id/todos`, `/todos/:id` |
| Complete/reopen todos | complete/reopen tools / `/todos/:id/complete`, `/todos/:id/reopen`, `/projects/:id/todos/complete`, `/projects/:id/todos/reopen` |

Access is delegated by the token. The server validates token owner/collaborator project access, optional selected-project restrictions, expiry/revocation, and writes audit events.

## REST endpoints

All requests: `Authorization: Bearer <token>`

```
GET     /docs
GET     /projects
POST    /projects
PATCH   /projects/:id
GET     /projects/:id/timeline
POST    /logs
PATCH   /logs/:id
GET     /projects/:id/plan
POST    /projects/:id/milestones
PATCH   /milestones/:id
DELETE  /milestones/:id
POST    /milestones/:id/todos
PATCH   /todos/:id
DELETE  /todos/:id
POST    /todos/:id/complete
POST    /todos/:id/reopen
POST    /projects/:id/todos/complete   # body: { "todo_ref": "1.1.3" } or "1.1.*"
POST    /projects/:id/todos/reopen
GET     /setup.sh
GET     /health
```

Plan statuses: `todo` | `in_queue` | `doing` | `verify` | `done`. Legacy aliases are normalized before writes: `pending` → `todo`, and `queue`/`queued`/`in que` → `in_queue`. Plan refs are generated from sorted plan order, e.g. `1.1.3`; use `1.1.*` for all todos in milestone `1.1`.

## Agent setup (for users)

1. Create a delegated token in devLog → **Agent Access** → **New token**.
2. Choose global machine setup or local repo setup.

```bash
# Global: available from any workspace on this machine
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install dl_agent_your_token --global

# Local: current repo only; writes REST instructions and MCP config where supported
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install dl_agent_your_token --local --agents all --mcp
```

`setup.sh` lifecycle:

```bash
setup.sh status                 # local/global files + effective token source; no network call
setup.sh verify [--local|--global]  # token format, API reachability, docs, project access
setup.sh uninstall --local
setup.sh uninstall --global
setup.sh uninstall --all
```

Token resolution order: `./.devlog` → `~/.devlog` → `DEVLOG_AGENT_TOKEN`. The script writes managed instruction blocks for Claude/Cursor/Windsurf/Copilot and hosted MCP config for known project-local clients when `--mcp` is used. REST always remains the fallback. Uninstall removes local/global files only; revoke remote tokens from the web app.

## Local development

```bash
cp .env.example .env   # fill in Supabase URL + service role key
npm install
npm run dev:http       # dev server on :8787
```

**Env vars:**
```env
DEVLOG_SUPABASE_URL=https://your-project.supabase.co
DEVLOG_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8787
DEVLOG_MCP_ALLOWED_ORIGIN=https://devlog.one
DEVLOG_RATE_LIMIT_WINDOW_MS=60000
DEVLOG_RATE_LIMIT_MAX=120
```

## Deploying

Any Node.js host works — Railway, Fly.io, Render, or a VPS.

**Railway (recommended):**
1. Push repo to GitHub
2. New project → Deploy from GitHub → set root to `mcp/`
3. Add env vars in the dashboard
4. Use the generated URL as `VITE_DEVLOG_MCP_URL` in the UI

**Production start:**
```bash
npm run build
npm run start:http
```

## Security

- Raw tokens are never stored — only SHA-256 hashes
- Every request validates delegated owner/collaborator access, token expiry, and optional project restrictions
- Revoked tokens are invalidated within 60 seconds (cache TTL)
- Rate limiting: configurable per IP with `DEVLOG_RATE_LIMIT_WINDOW_MS` and `DEVLOG_RATE_LIMIT_MAX` (defaults to 60 requests/min)
- All actions are written to `agent_audit_logs`
