# devLog

A cinematic timeline platform for makers. Document your projects, ship logs, and share your journey — with full AI agent access via MCP.

[![UI](https://img.shields.io/badge/UI-devlog.one-black?logo=vercel)](https://devlog.one)
[![MCP](https://img.shields.io/badge/API-api.devlog.one-blueviolet?logo=railway)](https://api.devlog.one/health)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

---

## Live

| Service | URL |
|---|---|
| App | https://devlog.one |
| MCP / REST API | https://api.devlog.one |
| API docs | https://api.devlog.one/docs |
| Support / abuse reports | https://devlog.one/support |
| Health | https://api.devlog.one/health |

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
- **AI agent access** — delegated machine tokens let Claude, Cursor, Windsurf, or scripts use devLog as you
- **REST API** — universal fallback without MCP, works with any HTTP client or script

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
│  • Delegated agent tokens       │
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

The MCP server never shares the Supabase service role key with the browser. Every agent action is validated as delegated access for the token owner, bounded by their project access and any selected-project restriction, and recorded in `agent_audit_logs`.

Public beta operations, moderation, and launch-week monitoring live in [`docs/beta-operations.md`](docs/beta-operations.md).

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
│   │   ├── auth.ts      # token validation, access checks, cache (60s TTL)
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
VITE_APP_URL=https://devlog.one
VITE_DEVLOG_MCP_URL=https://api.devlog.one
```

### MCP server — Railway

Built with Docker (multi-stage, Node 22 Alpine). Root directory: repo root (Dockerfile at `/`).

```
DEVLOG_SUPABASE_URL=
DEVLOG_SUPABASE_SERVICE_ROLE_KEY=
DEVLOG_MCP_ALLOWED_ORIGIN=https://devlog.one
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

Create a token in the app → **Agent Access** → **New token**. A token delegates machine access: your coding assistant can use devLog as you, bounded by your project access and any selected-project restriction. You never give the agent your account password.

### Choose one setup command

Global machine setup (recommended for most users):

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install <your-token> --global
```

Local repo setup (run inside one repo; adds instructions for Claude/Cursor/Windsurf/Copilot and MCP config where supported):

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install <your-token> --local --agents all --mcp
```

### How agents connect

- **REST:** always available at `https://api.devlog.one`; any agent or script can use it with `Authorization: Bearer <token>`.
- **Hosted MCP:** available at `https://api.devlog.one/mcp` only for clients that support HTTP MCP with Authorization headers. Unsupported clients should use the REST instructions written by setup.sh.
- **Skills/rules/instructions:** setup.sh writes managed instruction blocks so agents know to call `GET /docs` first, where to read the token, and which endpoints to use.

### setup.sh lifecycle

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- status          # local files + effective token source
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- verify          # API reachability + token validity
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --local
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --global
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --all
```

Token resolution order is `./.devlog` → `~/.devlog` → `DEVLOG_AGENT_TOKEN`; local overrides global. Uninstall removes setup.sh-managed local/global files only. Revoke/delete remote tokens from **Agent Access**.

### Plan tools

Agents can read and update project plans through REST or MCP: milestones, todos, statuses (`todo`, `in_queue`, `doing`, `verify`, `done`), visibility, and completion/reopen actions. Legacy status aliases such as `pending` → `todo` and `queue`/`queued`/`in que` → `in_queue` are normalized before writes. Plan refs such as `1.1.3` identify todos in sorted order; `1.1.*` targets every todo in a milestone. Full live API reference: `GET /docs`.

---

## Contributing

PRs welcome. Open an issue first for anything beyond a small bug fix.

---

## License

MIT — see [LICENSE](LICENSE).
