# devLog MCP server

Gives AI agents (Claude, Cursor, Windsurf, Copilot) scoped access to the token owner's devLog projects via MCP and REST.

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
DEVLOG_MCP_ALLOWED_ORIGIN=*
```

## Agent setup (for users)

1. Create a token in devLog → Agents → New token
2. Run the setup script:

```bash
curl -fsSL https://your-mcp-host.example.com/setup.sh | bash -s -- dl_agent_your_token
```

The script interactively handles token storage, `.gitignore`, and writes the context snippet into your agent's config file (CLAUDE.md, `.cursor/rules`, `.windsurfrules`, or Copilot instructions).

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
- Every request validates scope, token expiry, and project ownership
- Revoked tokens are invalidated within 60 seconds (cache TTL)
- Rate limiting: 60 requests/min per IP
- All actions written to `agent_audit_logs`
