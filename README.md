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

Get a token from the app → **Agent Access** → **New token**. A token is the permission: it lets your local agent use devLog as you, limited by your project access and any selected-project restriction.

Connect this machine globally:

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install <your-token> --global
```

Or connect only the current repo, with hosted MCP config where supported and REST instructions as fallback:

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- install <your-token> --local --agents all --mcp
```

Useful setup manager commands:

```bash
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- verify
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- status
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --local
curl -fsSL https://api.devlog.one/setup.sh | bash -s -- uninstall --global
```

Token resolution order is `./.devlog` → `~/.devlog` → `DEVLOG_AGENT_TOKEN`. `setup.sh` manages local files only; revoke/delete remote tokens from Agent Access.

Full API reference: `GET /docs` on the MCP server.

---

## Contributing

PRs welcome. Open an issue first for anything beyond a small bug fix.

---

## License

MIT — see [LICENSE](LICENSE).
