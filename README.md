# devLog

A cinematic timeline platform for makers. Document your projects, ship logs, and share your journey — with full AI agent access via MCP.

[![UI](https://img.shields.io/badge/UI-devlog--three--mu.vercel.app-black?logo=vercel)](https://devlog-three-mu.vercel.app)
[![MCP](https://img.shields.io/badge/MCP-railway-blueviolet?logo=railway)](https://devlog-mcp.up.railway.app/health)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

---

## Live

| Service | URL |
|---|---|
| App | https://devlog-three-mu.vercel.app |
| MCP / REST API | https://devlog-mcp.up.railway.app |
| API docs | https://devlog-mcp.up.railway.app/docs |
| Health | https://devlog-mcp.up.railway.app/health |

---

## What is devLog?

devLog is where makers document their work. Create projects, post timeline logs with mood + media, share publicly or keep private, and let your AI coding assistant post updates on your behalf.

**Core loop:** make something → log it → share it → build in public.

---

## Features

- **Cinematic timeline** — vertical log feed grouped by month, smooth Framer Motion animations, media gallery
- **Markdown logs** — write with full markdown, upload images/videos (50 MB), set mood and visibility per entry
- **Visibility system** — private / public / unlisted / shared per project and log
- **Social layer** — follows, reactions, comments, real-time notifications
- **Explore** — discover trending public projects and makers
- **AI agent access** — scoped tokens let Claude, Cursor, Windsurf, or any MCP client post logs on your behalf
- **REST API** — same access without MCP, works with any HTTP client or script

---

## How it works

```
┌─────────────────────────────────┐
│  Browser (React + Vite)         │
│  Vercel — global CDN            │
└────────────┬────────────────────┘
             │ Supabase JS (anon key)
             ▼
┌─────────────────────────────────┐
│  Supabase                       │
│  • Postgres + RLS               │
│  • Auth (email/password)        │
│  • Storage (avatars, media)     │
│  • Realtime (comments, notifs)  │
└─────────────────────────────────┘
             ▲
             │ service role key (server-only)
┌─────────────────────────────────┐
│  MCP Server (Node.js)           │
│  Railway — always-on HTTP       │
│  • MCP protocol (Claude etc.)   │
│  • REST API (any HTTP client)   │
│  • Scoped agent tokens          │
│  • Audit logging                │
└─────────────────────────────────┘
             ▲
             │ Bearer token
┌─────────────────────────────────┐
│  AI agents                      │
│  Claude Code / Cursor /         │
│  Windsurf / Copilot / scripts   │
└─────────────────────────────────┘
```

The MCP server never shares the Supabase service role key with the browser. Every agent action is validated against the token owner's scopes and recorded in `agent_audit_logs`.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5 (strict), TailwindCSS v3, Framer Motion |
| State | Zustand, React Router v6 |
| Backend | Supabase (Auth, Postgres, Storage, Realtime, RLS) |
| MCP server | Node.js 22, `@modelcontextprotocol/sdk`, Zod |
| Hosting | Vercel (UI) + Railway (MCP server) |

---

## Project structure

```
devlog/
├── ui/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/       # Route-level components
│   │   ├── features/    # auth, logs, projects, social, explore, profile
│   │   ├── components/  # shared UI + layout
│   │   ├── services/    # Supabase wrappers
│   │   ├── stores/      # Zustand (authStore, uiStore)
│   │   └── types/       # database.ts + domain types
│   └── vercel.json
├── mcp/                 # MCP + REST API server
│   ├── src/
│   │   ├── http.ts      # HTTP server, rate limiting, CORS, health
│   │   ├── rest.ts      # REST endpoints + setup.sh script
│   │   ├── auth.ts      # token validation, scope checks, cache (60s TTL)
│   │   ├── audit.ts     # agent_audit_logs writer
│   │   └── tools/       # MCP tool definitions (docs, projects, logs)
│   ├── AGENT_DOCS.md    # live docs served at GET /docs
│   └── railpack.toml
├── supabase/
│   └── schema.sql       # full DB schema + RLS policies
└── Dockerfile           # multi-stage build for Railway
```

---

## Deployment

### UI — Vercel

Auto-deploys from `main` branch. Root directory: `ui/`.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=https://devlog-three-mu.vercel.app
VITE_DEVLOG_MCP_URL=https://devlog-mcp.up.railway.app
```

### MCP server — Railway

Built with Docker (multi-stage, Node 22 Alpine). Root directory: repo root (Dockerfile at `/`).

```
DEVLOG_SUPABASE_URL=
DEVLOG_SUPABASE_SERVICE_ROLE_KEY=
DEVLOG_MCP_ALLOWED_ORIGIN=https://devlog-three-mu.vercel.app
```

Railway sets `PORT` automatically.

---

## Self-hosting

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Email auth in **Authentication → Providers**
4. Create storage buckets: `avatars`, `project-covers`, `log-media` (all public)

### 2. UI

```bash
cd ui
cp .env.example .env   # fill in Supabase URL + anon key
npm install
npm run dev            # http://localhost:5173
```

### 3. MCP server

```bash
cd mcp
cp .env.example .env   # fill in Supabase URL + service role key
npm install
npm run dev:http       # http://localhost:8787
```

---

## AI agent access

Get a token from the app → **Agents** → **New token**, then run the interactive setup script:

```bash
curl -fsSL https://devlog-mcp.up.railway.app/setup.sh | bash -s -- <your-token>
```

The script:
1. Saves your token to `.devlog` (gitignored automatically)
2. Asks which agents you use (Claude Code, Cursor, Windsurf, Copilot)
3. Writes the context snippet into the right config file for each

After setup your AI assistant can:

| Action | Scope needed |
|---|---|
| List projects | `read_projects` |
| Read project timeline | `read_logs` |
| Create a project | `create_project` |
| Update a project | `update_project` |
| Create a log entry | `create_log` |
| Update a log entry | `update_log` |

All actions are scoped to the token owner and recorded in an audit log visible in the app.

Full API reference: `GET /docs` on the MCP server.

---

## Contributing

PRs welcome. Open an issue first for anything beyond a small bug fix.

---

## License

MIT — see [LICENSE](LICENSE).
