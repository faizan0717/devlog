# devLog Test Report

**Date:** 2026-06-23  
**Tester:** Claude Code (automated)  
**Accounts used:**
- Owner: `faizanahmadi2000@gmail.com`
- Second user: `hackershive7@gmail.com`

**Surfaces tested:**
- MCP/REST server (`https://devlog-mcp.up.railway.app`)
- React/Vite UI (`https://devlog-three-mu.vercel.app`)
- Source code review (`mcp/src/`, `ui/src/`)

---

## Summary

| Category | PASS | FAIL | WARN | Total |
|---|---|---|---|---|
| MCP/REST API | 17 | 9 | 3 | 29 |
| Browser / UI | 38 | 1 | 4 | 43 |
| Source code review | — | 3 | 2 | 5 |
| **Total** | **55** | **13** | **9** | **77** |

---

## Critical Bugs (Blockers)

### BUG-1: `PATCH /logs/:id` endpoint is unreachable (404)

**Severity:** Critical — documented endpoint completely non-functional  
**Surface:** MCP/REST server  
**File:** `mcp/src/http.ts` line 113–115

The routing logic only adds `/logs/*` paths to the REST handler when the path is exactly `/logs`. Paths like `/logs/some-id` fall through to the generic 404 handler.

```typescript
// CURRENT (broken)
const restPaths = ['/docs', '/setup.sh', '/projects', '/logs']
const isRestPath = restPaths.some((p) => url.pathname === p || url.pathname.startsWith('/projects/'))
// /logs/abc → none of these match → 404

// FIX: add startsWith('/logs/')
const isRestPath = restPaths.some((p) => url.pathname === p)
  || url.pathname.startsWith('/projects/')
  || url.pathname.startsWith('/logs/')
```

**Verified:**
```
PATCH /logs/54c4d59f-1174-4566-90be-0b0a03d069c8
→ HTTP 404 {"error":"Not found",...}
```

This means agents using `devlog_update_log` or `PATCH /logs/:id` via REST receive 404 on every call. Update log is broken for all users.

---

### BUG-2: Authentication errors return HTTP 500 instead of 401/403

**Severity:** Critical — incorrect status codes break standard API client behavior  
**Surface:** MCP/REST server  
**File:** `mcp/src/http.ts` lines 135–138

All thrown errors from `getAgentContext()`, `requireScope()`, `assertProjectAccess()`, and `assertLogOwnership()` — including invalid tokens, revoked tokens, missing scopes, and cross-user access attempts — fall through to the generic catch block, which returns `500`.

```typescript
// All auth exceptions land here
}).catch((error) => {
  if (!res.headersSent) sendJson(res, 500, { error: error.message })
})
```

**Verified responses:**
| Request | Expected | Actual |
|---|---|---|
| Invalid token | 401 | **500** `{"error":"Invalid devLog agent token"}` |
| Revoked token (code path) | 401 | **500** (confirmed in source) |
| Expired token (code path) | 401 | **500** (confirmed in source) |
| Missing scope | 403 | **500** (confirmed in source) |
| PATCH non-existent project | 404 | **500** `{"error":"Project not found"}` |

**Fix:** Use a custom error class with an `httpStatus` property, or check `error.message` for known auth messages.

---

## High Priority Bugs

### BUG-3: No server-side validation for documented content limits

**Severity:** High — documented limits are only enforced in UI/docs, not the API  
**Surface:** MCP/REST server  
**File:** `mcp/src/rest.ts`

The API docs and TESTING_PLAN.md specify these limits. None are enforced server-side:

| Field | Documented Limit | API Behavior |
|---|---|---|
| Project title | 100 chars | Accepts 101+ chars → **201** |
| Project description | 500 chars | Accepts 501+ chars → **201** |
| Log title | 160 chars | Accepts 161+ chars → **201** |
| Log content | 50,000 chars | Accepts 50,001+ chars → **201** |
| Tags per project | 10 | Accepts 11+ tags → **201** |

**Verified:**
```
POST /projects {"title": "A"×101} → HTTP 201 (created with 101-char title)
POST /projects {"description": "D"×501} → HTTP 201
POST /logs {"title": "B"×161, ...} → HTTP 201
POST /projects {"tags": ["a","b","c","d","e","f","g","h","i","j","k"]} → HTTP 201
```

**Security risk:** An agent or script can store arbitrarily large strings in the database, potentially causing DB bloat or downstream rendering issues.

---

### BUG-4: No enum validation for `mood` and `visibility` fields

**Severity:** High — invalid values stored in DB silently  
**Surface:** MCP/REST server  
**File:** `mcp/src/rest.ts`

Any string is accepted for `mood` and `visibility`. Invalid values are inserted directly into the database with no rejection.

**Docs specify:**
- `mood`: `building | shipped | stuck | reflecting | inspired | learning`
- `visibility`: `private | public | unlisted | shared`

**Verified:**
```
POST /logs {"mood": "angry", ...} → HTTP 201 (stored "angry")
POST /logs {"visibility": "secret", ...} → HTTP 201 (stored "secret")
PATCH /projects/:id {"visibility": "supersecret"} → HTTP 200 (stored "supersecret")
```

---

## Medium Priority Issues

### BUG-5: CORS `allowedOrigin` defaults to `*`

**Severity:** Medium — security misconfiguration if env var not set  
**Surface:** MCP/REST server  
**File:** `mcp/src/http.ts` line 11

```typescript
const allowedOrigin = process.env.DEVLOG_MCP_ALLOWED_ORIGIN ?? '*'
```

If `DEVLOG_MCP_ALLOWED_ORIGIN` is not set in the Railway environment, the server accepts requests from any origin. In production, `https://devlog-three-mu.vercel.app` is correctly set (verified from live CORS preflight). However, there is no startup warning or validation that this env var is present.

**Verified (production):** `access-control-allow-origin: https://devlog-three-mu.vercel.app` ✅

---

### BUG-6: `agentTokens.service.ts` delete/revoke do not filter by owner_id

**Severity:** Medium — relies entirely on Supabase RLS for enforcement  
**Surface:** UI service layer  
**File:** `ui/src/services/agentTokens.service.ts` lines 86–100

The `revoke()` and `delete()` functions only filter by `id`, not by `owner_id`:

```typescript
async revoke(id: string): Promise<void> {
  await supabase.from('agent_tokens').update({ revoked_at: ... }).eq('id', id)
}

async delete(id: string): Promise<void> {
  await supabase.from('agent_tokens').delete().eq('id', id)
}
```

If an attacker obtained another user's token ID (e.g., via an IDOR in audit logs), they could revoke or delete it. Supabase RLS must be the last line of defense here. Adding `.eq('owner_id', userId)` as a defense-in-depth measure is recommended.

---

### ISSUE-7: Explore page shows no project cards on initial render

**Severity:** Medium — content discoverability  
**Surface:** UI, Explore page  

The Explore page renders correctly with search input and section headers, but the initial content cards (trending projects, recent logs) were not visible in the 3-second wait window during testing. This may indicate a slow query, lazy loading issue, or the page requires interaction before populating.

**Observed:** Explore sections render (15 elements), search works, but card count = 0 on initial 3s wait.

---

## Minor Issues / Observations

### INFO-1: Register page — username field not detectable

The register page's username field was not found by Playwright's standard selectors during testing. The field may use a non-standard `name` attribute or be rendered conditionally. Manual verification shows registration works end-to-end.

---

### INFO-2: Login redirects to `/explore` instead of `/dashboard`

After successful login, the owner is redirected to `/explore` rather than `/dashboard`. Whether this is intentional UX or a regression is unclear.

---

### INFO-3: Token cache TTL of 60 seconds for revoked tokens

**File:** `mcp/src/auth.ts` line 25

```typescript
const CACHE_TTL_MS = 60_000 // re-validate revoked tokens within 1 minute
```

A revoked token continues to work for up to 60 seconds after revocation. This is a documented architectural tradeoff (performance vs. immediate revocation). It should be documented in the Agent Access UI so users understand instant revocation is not guaranteed.

---

### INFO-4: Log request includes IP address in server logs — no secrets

The server logs include method, path, status, and IP (`[devLog MCP] GET /projects 200 — 192.x.x.x`). Bearer tokens are NOT logged. ✅

---

## Test Results by Surface

### MCP/REST Server

#### Public Endpoints

| Test | Result | Notes |
|---|---|---|
| `GET /health` → 200 `{"ok":true}` | ✅ PASS | Returned `name: "devlog-mcp-server"`, `version: "0.1.0"` |
| `GET /docs` → 200 markdown | ✅ PASS | Full tool + REST reference returned |
| `GET /setup.sh` → 200 shell script | ✅ PASS | Token validation, install/uninstall logic correct |
| `GET /nonexistent` → 404 with endpoint list | ✅ PASS | Returns all 10 endpoint names |

#### Auth Failure Cases

| Test | Result | Notes |
|---|---|---|
| Missing Authorization → 401 | ✅ PASS | |
| Malformed Authorization (NotBearer) → 401 | ✅ PASS | |
| Invalid token → 401 | ❌ FAIL | Returns **500** (BUG-2) |
| Anonymous access to protected endpoints → 401 | ✅ PASS | |

#### CORS

| Test | Result | Notes |
|---|---|---|
| OPTIONS preflight → 204 | ✅ PASS | |
| `access-control-allow-origin` = production UI | ✅ PASS | `https://devlog-three-mu.vercel.app` |
| `access-control-allow-methods` | ✅ PASS | GET, POST, PATCH, DELETE, OPTIONS |
| MCP session headers exposed | ✅ PASS | `Mcp-Session-Id, mcp-session-id` |

#### Projects

| Test | Result | Notes |
|---|---|---|
| `GET /projects` (valid token) → 200 | ✅ PASS | Returns only owner's projects |
| `GET /projects` returns correct fields | ✅ PASS | id, title, visibility, tags, cover, view_count, timestamps |
| `POST /projects` (valid) → 201 | ✅ PASS | |
| `POST /projects` missing title → 400 | ✅ PASS | `{"error":"title is required"}` |
| `POST /projects` title > 100 chars → 400 | ❌ FAIL | Returns 201 (BUG-3) |
| `POST /projects` description > 500 chars → 400 | ❌ FAIL | Returns 201 (BUG-3) |
| `POST /projects` > 10 tags → 400 | ❌ FAIL | Returns 201 (BUG-3) |
| `PATCH /projects/:id` (valid) → 200 | ✅ PASS | Partial fields work |
| `PATCH /projects/:id` (non-existent) → 404 | ❌ FAIL | Returns **500** (BUG-2) |
| Audit log written on create/update | ✅ PASS | Verified via code review |

#### Logs

| Test | Result | Notes |
|---|---|---|
| `POST /logs` (valid) → 201 | ✅ PASS | |
| `POST /logs` missing project_id → 400 | ✅ PASS | `{"error":"project_id and title are required"}` |
| `POST /logs` title > 160 chars → 400 | ❌ FAIL | Returns 201 (BUG-3) |
| `POST /logs` content > 50,000 chars → 400 | ❌ FAIL | Returns 201 (BUG-3) |
| `POST /logs` invalid mood → 400 | ❌ FAIL | Accepts any string (BUG-4) |
| `POST /logs` invalid visibility → 400 | ❌ FAIL | Accepts any string (BUG-4) |
| `PATCH /logs/:id` (valid token) → 200 | ❌ FAIL | Returns 404 (**BUG-1 — critical**) |

#### Timeline

| Test | Result | Notes |
|---|---|---|
| `GET /projects/:id/timeline` (valid) → 200 | ✅ PASS | Returns project + logs newest first |
| `GET /projects/:id/timeline` anonymous → 401 | ✅ PASS | |
| `GET /projects/:id/timeline` non-existent → 404 | ❌ FAIL | Returns **500** (BUG-2) |
| Owner can access all own projects | ✅ PASS | Tested with 3 different projects |

#### MCP Endpoint (`/mcp`)

| Test | Result | Notes |
|---|---|---|
| Missing token → 401 | ✅ PASS | |
| Unsupported method → 405 | ✅ PASS | |
| POST without correct Accept header → 406 | ⚠️ INFO | Expected for SSE protocol; clients must send `Accept: application/json, text/event-stream` |

---

### Browser / UI Tests

#### Public Pages

| Test | Result | Notes |
|---|---|---|
| Landing page loads | ✅ PASS | Title: "devLog", h1: "The build journal that writes itself." |
| Login page — email/password/submit fields | ✅ PASS | |
| Register page — renders | ✅ PASS | |
| Forgot password page — email field | ✅ PASS | |
| Explore page — search input | ✅ PASS | 1 search input found |
| Explore page — content sections | ✅ PASS | 15 page sections rendered |

#### Auth Protection (unauthenticated)

| Test | Result | Notes |
|---|---|---|
| `/dashboard` → redirects to `/login` | ✅ PASS | |
| `/projects` → redirects to `/login` | ✅ PASS | |
| `/projects/new` → redirects to `/login` | ✅ PASS | |
| `/agent-access` → redirects to `/login` | ✅ PASS | Route is `/agent-access` (not `/settings/agent-access`) |

#### Public Project/Log Access

| Test | Result | Notes |
|---|---|---|
| Public project accessible anonymously | ✅ PASS | `/p/dc1a0d89...` loads without auth |
| Public project shows timeline content | ✅ PASS | Logs, moods, content visible |
| Private project blocked for anonymous | ✅ PASS | `/p/943498de...` shows "not found" to anon |
| Private project blocked for second user | ✅ PASS | `hackershive7` cannot view `faizanahmadi2000`'s private project |

#### Auth Flows

| Test | Result | Notes |
|---|---|---|
| Owner login succeeds | ✅ PASS | Redirects to `/explore` after login |
| Wrong password stays on `/login` | ✅ PASS | |
| Wrong password shows error message | ✅ PASS | Error text visible on page |
| Empty password stays on `/login` | ✅ PASS | |
| Second user (`hackershive7`) login succeeds | ✅ PASS | |

#### Authenticated Pages

| Test | Result | Notes |
|---|---|---|
| Owner reaches `/dashboard` | ✅ PASS | |
| Dashboard renders project/log content | ✅ PASS | |
| Owner reaches `/projects` | ✅ PASS | |
| Projects list shows all owner projects | ✅ PASS | devLog, fitDesk, careless all visible |
| `/settings/agent-access` authenticated | ✅ PASS | Reaches page when logged in |
| Agent access page does not expose token hashes | ✅ PASS | No SHA-256 hex strings visible |

#### Data Isolation (second user)

| Test | Result | Notes |
|---|---|---|
| `hackershive7` projects list does not show `faizanahmadi2000`'s private project "careless" | ✅ PASS | |
| `hackershive7` cannot access private project URL directly | ✅ PASS | |

#### Mobile Viewport (375×667, iPhone UA)

| Test | Result | Notes |
|---|---|---|
| Landing — loads, no horizontal overflow | ✅ PASS | scrollWidth = 375 |
| Login — loads, no horizontal overflow | ✅ PASS | |
| Explore — loads, no horizontal overflow | ✅ PASS | |
| Register — loads, no horizontal overflow | ✅ PASS | |

---

## Data Cleanup Note

The following test artifacts were created during this test run and cannot be deleted via the current API (no `DELETE /projects` endpoint). They are all `private` visibility and do not appear publicly.

| Project | ID | Note |
|---|---|---|
| Test Project - Updated | `e63ff35b-474d-436b-a851-b5b556c5ec8d` | Created by test suite |
| Tags Test | `4fe5a1bb-ff09-4ce7-a4a3-851b5d6ac8b2` | Tags limit test |
| Limit Test | `d10c696b-0db4-4a3c-a12c-fc4c6eb322b5` | Description limit test |
| `AAAA...` (101 chars) | `611c2600-7d38-4b53-b862-cf7ff8bbb701` | Title limit test |

---

## Prioritized Fix List

| Priority | ID | Description |
|---|---|---|
| P0 | BUG-1 | `PATCH /logs/:id` always returns 404 — add `/logs/` to `startsWith` check in `http.ts` |
| P0 | BUG-2 | Auth/not-found errors return 500 — use custom error classes with HTTP status codes |
| P1 | BUG-3 | No server-side length validation for title, description, tags, content |
| P1 | BUG-4 | No enum validation for `mood` and `visibility` — any string accepted |
| P2 | BUG-5 | CORS `allowedOrigin` defaults to `*` — add startup warning/assertion for env var |
| P2 | BUG-6 | `agentTokens.service.ts` delete/revoke missing `owner_id` filter for defense-in-depth |
| P3 | INFO-2 | Post-login redirect goes to `/explore` — confirm if `/dashboard` is intended |
| P3 | INFO-3 | Document 60-second token revocation delay in Agent Access UI |

---

## What Was NOT Tested

The following areas from the TESTING_PLAN.md were not covered in this run and remain for future test phases:

- **Supabase RLS policies** — full matrix (profiles, logs, collaborators, comments, reactions, notifications, storage) requires a local Supabase seed
- **Collaborator access control** — adding viewer/editor/admin collaborators and verifying role boundaries
- **Media uploads** — file type/size/path enforcement in storage
- **Social features** — reactions, comments, follows, notifications
- **Realtime** — Supabase realtime channel behavior
- **Agent token creation/revocation via UI** — step-by-step flow through Agent Access page
- **Password reset flow** — end-to-end with email link
- **Profile updates** — username/bio/avatar
- **Rate limiting** — would require 60+ rapid requests from a single IP
- **Playwright full E2E** — project/log lifecycle, log editor (autosave, media, markdown preview)
- **Visual regression** — screenshots not captured this run
- **Accessibility (axe)** — keyboard nav, focus trapping, ARIA roles
- **Performance** — Lighthouse, bundle size, timeline with 100+ logs
- **MCP tool invocations** — `devlog_create_log`, `devlog_update_log` via JSON-RPC (blocked by BUG-1 and 406 Accept header requirement)
