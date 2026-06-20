# devLog

A cinematic timeline platform for makers. Document your projects, ship logs, and share your journey — with full AI agent access via MCP.

![Stack](https://img.shields.io/badge/React_18-TypeScript-blue) ![Supabase](https://img.shields.io/badge/Backend-Supabase-green) ![License](https://img.shields.io/badge/License-MIT-purple)

---

## What is devLog?

devLog is where makers document their work. Create projects, post timeline logs with mood + media, share publicly or keep private, and let your AI coding assistant post updates on your behalf.

**Core loop:** make something → log it → share it → build in public.

---

## Features

- **Cinematic timeline** — vertical log feed grouped by month, smooth animations, media gallery
- **Markdown logs** — write with full markdown, upload images/videos (50 MB), set mood and visibility per entry
- **Visibility system** — private / public / unlisted / shared per project and log
- **Social layer** — follows, reactions, comments, notifications
- **Explore** — discover trending public projects and makers
- **AI agent access** — scoped tokens let Claude, Cursor, Windsurf, or any MCP client post logs on your behalf
- **REST API** — same access without MCP, works with any HTTP client

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, TypeScript, TailwindCSS, Framer Motion |
| State | Zustand, React Router v6 |
| Backend | Supabase (Auth, Postgres, Storage, Realtime, RLS) |
| MCP server | Node.js, `@modelcontextprotocol/sdk`, Zod |

---

## Project structure

```
devLog/
├── ui/          # React frontend (Vite)
├── mcp/         # MCP + REST API server (Node.js)
└── supabase/    # schema.sql — run this against your Supabase project
```

---

## Self-hosting

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Email auth in Authentication → Providers
4. Create storage buckets: `avatars`, `project-covers`, `log-media` (all public)

### 2. UI

```bash
cd ui
cp .env.example .env   # fill in your Supabase URL + anon key
npm install
npm run dev
```

### 3. MCP server (optional — needed for AI agent access)

```bash
cd mcp
cp .env.example .env   # fill in your Supabase URL + service role key
npm install
npm run dev:http       # starts on :8787
```

See [`mcp/README.md`](mcp/README.md) for deployment and agent setup.

---

## AI agent access

devLog has a built-in MCP server so your AI assistant can post logs while you code.

**Setup (30 seconds):**

```bash
curl -fsSL https://your-mcp-host.example.com/setup.sh | bash -s -- <your-token>
```

The interactive script saves your token, gitignores it, and writes the context snippet into CLAUDE.md / `.cursor/rules` / `.windsurfrules` / Copilot instructions — whichever agents you use.

After setup, Claude/Cursor/Windsurf can:
- List and read your projects
- Create and update timeline logs
- Create and update projects

All actions are scoped to the token owner and recorded in an audit log.

---

## Environment variables

**`ui/.env`**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=http://localhost:5173
VITE_DEVLOG_MCP_URL=https://your-mcp-host.example.com
```

**`mcp/.env`**
```env
DEVLOG_SUPABASE_URL=
DEVLOG_SUPABASE_SERVICE_ROLE_KEY=
PORT=8787
DEVLOG_MCP_ALLOWED_ORIGIN=*
```

---

## Contributing

PRs welcome. Open an issue first for anything beyond a small bug fix.

---

## License

MIT — see [LICENSE](LICENSE).
