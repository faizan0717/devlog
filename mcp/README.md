# devLog MCP server

Gives AI agents (Claude, Cursor, Windsurf, Copilot) delegated access to the token owner's devLog projects via hosted MCP and REST.

## Tools

| Tool | Scope required |
|---|---|
| `devlog_get_docs` | none |
| `devlog_list_projects` | `read_projects` |
| `devlog_get_project_timeline` | `read_logs` |
| `devlog_create_project` | `create_project` |
| `devlog_update_project` | `update_project` |
| `devlog_create_log` | `create_log` |
| `devlog_update_log` | `update_log` |

## REST endpoints

Same coverage without MCP — works with any HTTP client.

```
GET    /docs
GET    /projects
POST   /projects
PATCH  /projects/:id
GET    /projects/:id/timeline
POST   /logs
PATCH  /logs/:id
GET    /health
```

All requests: `Authorization: Bearer <token>`

## Setup

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

## Agent setup (for users)

1. Create a delegated token in devLog → Agent Access → New token.
2. Connect globally for this machine, or locally for one repo:

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install dl_agent_your_token --global
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install dl_agent_your_token --local --agents all --mcp
```

`setup.sh` is a local setup manager:

```bash
setup.sh verify [--local|--global]
setup.sh status
setup.sh uninstall --local
setup.sh uninstall --global
setup.sh uninstall --all
```

Token resolution order: `./.devlog` → `~/.devlog` → `DEVLOG_AGENT_TOKEN`. The script writes managed instruction blocks for Claude/Cursor/Windsurf/Copilot and hosted MCP config where the client supports it. REST always remains the fallback. Uninstall removes local/global files only; revoke remote tokens from the web app.

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
- All actions written to `agent_audit_logs`
