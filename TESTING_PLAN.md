# devLog Testing Plan

## 1. Purpose and Scope

This plan defines how to test devLog across its three main surfaces:

1. **React/Vite UI** in `ui/`
2. **Supabase data model, RLS policies, storage, realtime behavior** in `supabase/`
3. **MCP/REST server** in `mcp/`

The goal is to protect the core product loop:

> use a manually provisioned test account → create a project → add timeline logs with media/visibility → share/discover → use agent tokens to read/write updates safely.

Account creation/sign-up is **not** part of the automated test scope. Test accounts should be created manually by the project owner before running authenticated tests.

## 2. Current Test Baseline

Current scripts:

- Root:
  - `npm run lint` — UI ESLint gate.
  - `npm run build` — UI production build plus MCP TypeScript build.
  - `npm test` — MCP Vitest unit/contract tests.
  - `npm run check` — lint, build, and unit tests.
  - `npm run ci` — quality gates plus Playwright smoke tests.
  - `npm run test:e2e` — Playwright smoke tests against `PLAYWRIGHT_BASE_URL` or local Vite by default.
  - `npm run test:e2e:local` — Playwright smoke tests against `http://localhost:5173`.
  - `npm run test:e2e:prod` — Playwright smoke tests against `https://devlog.one`.
  - `npm run dev` — local UI + MCP development servers.
- UI:
  - `npm run build`
  - `npm run lint`
- MCP:
  - `npm run build`
  - `npm test`
  - `npm run test:setup`

GitHub Actions runs the same beta quality gates on pull requests and pushes to `main`: install, UI lint, UI/MCP build, MCP tests, and Playwright public smoke tests. These checks do not require production secrets.

## 3. Recommended Test Stack

### UI

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **MSW** or Supabase client mocks for service-layer isolation
- **Playwright** for browser E2E and visual smoke tests
- **axe-core / @axe-core/playwright** for accessibility checks

### MCP/REST Server

- **Vitest** for unit and integration tests
- **undici/fetch** or Supertest-style HTTP helpers for endpoint tests
- Supabase client mocks for auth/scope/unit tests
- Optional local Supabase integration tests for true DB behavior

### Supabase

- **Supabase CLI local stack** for schema/RLS/storage validation
- SQL seed files for deterministic users/projects/logs/collaborators/tokens
- Optional pgTAP or script-based SQL assertions for RLS policies

### CI

- GitHub Actions or equivalent:
  - install dependencies
  - lint UI
  - build UI
  - build MCP
  - run unit/integration tests
  - run Playwright smoke tests against preview or local services

## 4. Test Environments

### Local Developer Environment

Used for fast feedback.

- UI: `http://localhost:5173`
- MCP/REST: `http://localhost:8787`
- Supabase: local Supabase CLI instance preferred
- Seed/manual test users. These accounts are created manually, not by automated signup tests:
  - `owner@example.com`
  - `collab-viewer@example.com`
  - `collab-editor@example.com`
  - `outsider@example.com`

### CI Environment

Used for every pull request.

- No production data
- Local or ephemeral Supabase project
- Deterministic test seed
- Headless Playwright
- Secrets supplied through CI vault only

### Staging/Preview Environment

Used before production deploy.

- Vercel preview UI
- Railway preview or staging MCP server
- Staging Supabase project
- Synthetic test data only

### Production Smoke Environment

Minimal checks only. Use the exact production endpoints below and do not run destructive tests against production.

#### Production endpoint inventory

| Surface | Exact endpoint | Purpose |
|---|---|---|
| UI app | `https://devlog.one` | Production React/Vite app |
| UI landing | `https://devlog.one/` | Public landing page smoke test |
| UI login | `https://devlog.one/login` | Auth page smoke test |
| UI register | `https://devlog.one/register` | Registration page smoke test |
| UI forgot password | `https://devlog.one/forgot-password` | Password reset request page smoke test |
| UI explore | `https://devlog.one/explore` | Public discovery page smoke test |
| MCP/REST base | `https://api.devlog.one` | Hosted MCP/REST server |
| MCP health | `https://api.devlog.one/health` | Production server health check |
| MCP/REST docs | `https://api.devlog.one/docs` | Live agent/API documentation |
| Setup script | `https://api.devlog.one/setup.sh` | Agent setup script |
| MCP protocol endpoint | `https://api.devlog.one/mcp` | MCP client endpoint |
| REST list projects | `https://api.devlog.one/projects` | `GET`, requires Bearer token with `read_projects` |
| REST create project | `https://api.devlog.one/projects` | `POST`, requires Bearer token with `create_project` |
| REST update project | `https://api.devlog.one/projects/{project_id}` | `PATCH`, requires Bearer token with `update_project` |
| REST project timeline | `https://api.devlog.one/projects/{project_id}/timeline` | `GET`, requires Bearer token with `read_logs` |
| REST create log | `https://api.devlog.one/logs` | `POST`, requires Bearer token with `create_log` |
| REST update log | `https://api.devlog.one/logs/{log_id}` | `PATCH`, requires Bearer token with `update_log` |

#### Production smoke checks

- `GET https://api.devlog.one/health` returns 200 and `{ "ok": true }`
- `GET https://api.devlog.one/docs` returns markdown documentation
- `GET https://api.devlog.one/setup.sh` returns shell script text
- `GET https://devlog.one/` loads landing page
- `GET https://devlog.one/login` loads login page
- `GET https://devlog.one/register` loads register page
- `GET https://devlog.one/explore` loads explore page
- No production smoke test should create, update, or delete projects/logs unless it uses a dedicated synthetic production test account and is explicitly approved

## 5. Test Data Model

Create a repeatable seed with:

### Users

| User | Purpose |
|---|---|
| Owner | Owns private/public/unlisted/shared projects |
| Viewer collaborator | Can read shared project/logs only |
| Editor collaborator | Can create/update shared project logs where allowed |
| Outsider | Confirms private/shared data is blocked |
| Public anonymous | Confirms public and unlisted behavior |

### Projects

| Project | Visibility | Owner | Notes |
|---|---|---|---|
| Private Project | private | Owner | owner-only |
| Public Project | public | Owner | visible in explore/public pages |
| Unlisted Project | unlisted | Owner | accessible by direct link/API policy |
| Shared Project | shared/private with collaborators | Owner | validates collaborator access |

### Logs

Each project should include logs with:

- all moods: `building`, `shipped`, `stuck`, `reflecting`, `inspired`, `learning`
- all visibilities: `private`, `public`, `shared`, `unlisted`
- markdown content
- empty content
- long content near limits
- image media
- video media

### Agent Tokens

Create tokens with:

- all scopes
- read-only scopes
- create-only scopes
- missing-scope token
- expired token
- revoked token
- project-restricted token

## 6. UI Unit Test Plan

### Shared Components

Test files should live near code or in `ui/src/__tests__/`.

#### Buttons, Inputs, Cards, Badges, Modals, Avatars, Spinners

- render correctly with required props
- support variants/sizes
- propagate disabled/loading states
- preserve accessible labels/roles
- call handlers on user interaction
- handle missing optional data, such as avatar URL

#### Layout Components

- `ProtectedRoute` redirects unauthenticated users
- `RootLayout` renders nav/sidebar and outlet
- public layout does not require auth
- error boundary catches child errors and renders fallback

### Utility Functions

Test:

- `cn` class merging behavior
- date/time formatting
- route constants
- visibility/mood formatting helpers if present

### Zustand Stores

Test:

- auth state initialization
- sign-in/sign-out transitions
- profile/session persistence behavior
- UI store toggles and reset behavior

## 7. UI Service Test Plan

Mock Supabase client responses and verify service behavior.

### `auth.service.ts`

- sign up passes email/password/username metadata
- login handles success and invalid credentials
- logout clears session
- reset password submits expected redirect URL
- error responses are thrown consistently

### `projects.service.ts`

- list owned projects ordered by creation time
- list shared projects maps nested rows correctly
- fetch project with collaborators/owner
- create defaults visibility to `private` and tags to `[]`
- update only sends changed fields
- upload cover uses path `{ownerId}/{projectId}.{ext}` and returns public URL
- delete cover attempts supported extensions
- delete project propagates errors

### `logs.service.ts`

- list logs by project ordered newest first
- create defaults visibility to `private`
- update supports title/content/mood/media/visibility
- delete log propagates errors
- upload media rejects files over 50 MB
- upload media rejects unsupported extensions
- upload media stores under `{userId}/{logId}/{timestamp}.{ext}`
- image/video type detection is correct
- delete media extracts storage path from public URL safely

### Social Services

For comments, reactions, follows, notifications:

- create/read/update/delete happy paths
- auth-required operations fail cleanly
- optimistic UI assumptions match service results
- notification list limits and ordering
- duplicate reaction/follow behavior

### `agentTokens.service.ts`

- generated tokens start with `dl_agent_`
- token generation uses 32 random bytes
- SHA-256 hashing returns expected hex format
- create stores only `token_hash`, never raw token
- list excludes token hash
- revoke sets `revoked_at`
- delete removes row
- audit log listing is owner-scoped and newest first

### `explore.service.ts`

- trending projects map owner fields correctly
- recent public logs only return public logs from public projects
- public user/project pages filter private content
- search limits projects/users/logs and only returns public data
- heatmap counts logs per day over the last year
- project view increment tolerates RPC failure where product allows

## 8. UI Page and Flow Tests

Use React Testing Library for route-level behavior with mocked services.

### Public Pages

#### Landing

- renders product value proposition
- primary CTAs navigate to register/login/explore
- works on mobile viewport

#### Explore

- shows trending projects
- shows recent logs
- search returns grouped project/user/log results
- empty search and no-results states
- pagination or cursor loading if present

#### Public Profile

- public user profile renders bio/avatar/projects
- private profile handling
- missing user renders not found

#### Public Project

- public project renders project details and public logs
- unlisted project direct link works where intended
- private project is not visible anonymously
- view count increments once per visit/session as intended

#### Public Log

- public log renders markdown and media
- private/shared log is not visible anonymously
- missing log renders not found

### Auth Pages

#### Register

Automated tests should only verify that the registration page renders and basic client-side validation works if desired. Do **not** run automated tests that create accounts. Account creation is manual.

Allowed automated checks:

- page loads without crashing
- required-field validation appears without submitting a real signup
- navigation links work

Manual-only checks:

- create user with username
- email verification flow
- duplicate email/username behavior
- Supabase/auth signup errors

#### Login

- validates fields
- logs in with valid credentials
- shows invalid credential errors
- redirects authenticated users away from login

#### Forgot/Reset Password

- validates email
- sends reset request
- handles reset token flow
- rejects weak or mismatched passwords if applicable

### Protected App Pages

#### Dashboard

- requires auth
- loads owner projects/log summaries
- handles empty state
- handles service errors

#### Projects

- lists owned projects
- lists shared-with-me projects
- filters/sorts if present
- empty state CTA works

#### New Project

- creates project with title/description/visibility/tags/cover
- validates title required and length
- upload failures are surfaced
- save button loading/disabled state

#### Project Detail

- loads project, collaborators, logs
- owner can edit/delete project
- collaborator actions follow role permissions
- delete confirmations work
- public/share/preview links are correct

#### Log Editor

- create log path `/projects/:id/logs/new`
- edit log path `/projects/:id/logs/:logId`
- validates title required and length
- markdown editing and preview
- mood selection
- visibility selection
- media upload/delete
- rejects unsupported/oversize media before upload
- saves draft or handles unsaved changes if supported

#### Profile

- loads and updates username/bio/social links/public status/avatar
- avatar upload path and preview
- duplicate username error
- invalid social link validation if present

#### Agent Access

- lists tokens without raw token
- creates token and displays raw token only once
- scope selection works
- project restriction selection works
- expiration selection works
- copy token/setup command works
- revoke disables token
- delete removes token
- audit logs render actions/metadata

## 9. Browser E2E Test Plan

Use Playwright with seeded local/staging data.

### Critical Smoke Suite

Run on every PR.

1. Landing page loads
2. Login/register pages render, but no automated account creation is attempted
3. Manually provisioned authenticated user can reach dashboard
4. Authenticated user can create a project
5. Authenticated user can create a log
6. Public project/log can be opened anonymously when visibility is public
7. MCP health endpoint returns OK
8. REST docs endpoint returns documentation

### Full E2E Suite

Run nightly or before release.

#### Authentication

- use a manually provisioned test account
- login/logout
- session persists after refresh
- protected route redirects unauthenticated user
- registration/account creation is verified manually only, not automated

#### Project Lifecycle

- create project with cover/tags/visibility
- edit title/description/visibility/tags
- preview project
- delete project and confirm logs cascade or disappear from UI

#### Log Lifecycle

- create log with markdown/mood/media
- edit log
- preview log
- delete log
- verify timeline ordering newest first

#### Visibility

- anonymous cannot view private project/log
- anonymous can view public project/log
- unlisted direct link works if intended
- unlisted does not appear in explore/search if intended
- shared content visible only to collaborators/auth users with access

#### Collaboration

- owner adds viewer/editor/admin collaborators
- viewer can read but not edit
- editor can create/update logs, cannot delete project
- outsider cannot access shared/private resources

#### Social

- follow/unfollow maker
- react/unreact to log
- comment/create/delete own comment
- notifications appear for follow/comment/reaction
- realtime updates appear or polling fallback works

#### Explore

- trending projects visible
- recent public logs visible
- search for project/user/log
- pagination/cursor loading

#### Agent Access UI + REST

- create all-scope token in UI
- copy token
- call REST API using token
- revoke token
- revoked token is rejected after cache TTL or immediately if cache invalidation is implemented

## 10. MCP/REST Unit Test Plan

### Auth and Scope Logic

Test `mcp/src/auth.ts`:

- missing token throws helpful error
- invalid token rejected
- expired token rejected
- revoked token rejected
- valid token returns context
- context cache returns cached data within TTL
- last used timestamp is updated
- `requireScope` accepts present scope
- `requireScope` rejects missing scope
- `assertProjectAccess` allows owner project
- rejects project owned by another user
- rejects project outside `allowed_project_ids`
- `assertLogOwnership` allows owner log
- rejects other owner's log
- rejects log outside restricted project list

### Crypto

Test `mcp/src/crypto.ts`:

- hashing is deterministic
- output format matches expected SHA-256 hex/base64 strategy
- different tokens produce different hashes

### Request Context

- token context is scoped per async request
- parallel requests do not leak tokens
- missing context falls back only where intended

### Audit

- successful write creates audit row
- metadata/project/log IDs are included
- audit failures do not corrupt successful user action if intended, or fail transaction if that is the product decision

### Tool Definitions

For `mcp/src/tools/*`:

- input schemas validate required fields
- max title/content/tag limits enforced
- invalid mood/visibility rejected
- scope requirements match docs
- returned shape matches docs

## 11. MCP/REST Integration Test Plan

Run against a local Supabase seed or mocked Supabase where appropriate.

### Public Endpoints

#### `GET /health`

- returns 200
- includes `{ ok: true, name, version }`
- includes CORS headers

#### `GET /docs`

- returns 200 markdown
- no token required
- content includes tool and REST reference

#### `GET /setup.sh`

- returns shell script
- no token required
- generated base URL uses forwarded proto/host
- script refuses missing/invalid tokens
- script writes `.devlog` and appends `.gitignore` in install mode
- uninstall removes devLog snippets

### Auth Failure Cases

For all protected REST endpoints:

- missing Authorization → 401
- malformed Authorization → 401
- invalid token → error response
- expired token → error response
- revoked token → error response
- missing scope → error response

### Project Endpoints

#### `GET /projects`

- requires `read_projects`
- returns only owner projects
- respects `allowed_project_ids`
- ordered by `updated_at` descending
- writes audit log

#### `POST /projects`

- requires `create_project`
- title required
- trims title/description
- defaults visibility to `private`
- handles tags
- rejects invalid visibility/tags when validation is added
- writes audit log

#### `PATCH /projects/:id`

- requires `update_project`
- only owner can update
- project restriction enforced
- updates allowed fields only
- non-existent project handled clearly
- writes audit log

#### `GET /projects/:id/timeline`

- requires `read_logs`
- only owner token/project-restricted token can read
- returns project and logs newest first
- writes audit log with log count

### Log Endpoints

#### `POST /logs`

- requires `create_log`
- `project_id` and title required
- only owner project allowed
- project restriction enforced
- defaults visibility to `private`
- accepts mood and content
- rejects invalid mood/visibility when validation is added
- writes audit log

#### `PATCH /logs/:id`

- requires `update_log`
- only owner log allowed
- project restriction enforced
- updates partial fields
- rejects non-existent log
- writes audit log

### MCP Endpoint `/mcp`

- missing token returns 401
- unsupported methods return 405
- JSON-RPC initialize/list tools works
- each MCP tool mirrors REST behavior
- invalid schema returns MCP validation error
- parallel stateless requests do not share token context

### Rate Limiting and CORS

- CORS preflight returns 204 and expected headers
- allowed origin config is honored
- `Access-Control-Expose-Headers` includes MCP session header names
- more than 60 requests/minute per IP returns 429
- forwarded-for first IP is used

### Error Handling

- malformed JSON returns controlled error, not process crash
- Supabase errors map to useful HTTP responses
- unknown routes return 404 with endpoint list
- request logs include method/path/status/IP and no secrets

## 12. Supabase Schema and RLS Test Plan

Run against local Supabase with seeded users.

### Profiles

- profile auto-created on auth signup
- username unique constraint enforced
- anyone can read public profile data
- only owner can update profile
- owner cannot update another profile

### Projects

- owner can create/read/update/delete own projects
- anonymous can read public projects
- anonymous can read unlisted projects by direct ID if policy intends this
- anonymous cannot read private/shared projects
- collaborator can read shared/collaborated project
- outsider cannot read shared/private project
- owner deletion cascades logs/collaborators/comments as expected

### Logs

- owner can CRUD own project logs
- public log readable only when parent project is public/unlisted per policy
- private/shared logs not anonymous-readable
- collaborator viewer can read allowed logs
- editor/admin collaborator can insert/update logs
- collaborator cannot delete logs unless policy intentionally allows
- outsider cannot read/write logs

### Collaborators

- owner can add/update/remove collaborators
- collaborator can read own collaborator row
- outsider cannot list collaborators
- uniqueness prevents duplicate collaborator rows
- invalid role rejected

### Comments

- users with log access can read comments
- authenticated users can insert own comments
- user cannot insert comment as another user
- user can delete own comments
- user cannot delete others' comments

### Social Tables

If present in schema:

- follows are unique per follower/following pair
- users cannot follow self if constrained
- reactions unique per user/log/type or per intended design
- notifications are readable only by recipient
- realtime publication covers comments/reactions/notifications as intended

### Storage

#### Avatars

- authenticated owner uploads under own folder
- owner can update/delete own avatar
- other users cannot update/delete avatar
- public read works

#### Project Covers

- owner uploads cover under own folder/project path
- owner can update/delete
- other users cannot mutate
- public read works if bucket is public

#### Log Media

- owner/collaborator upload permissions match product design
- upload file size limit enforced in UI and optionally storage policy
- public read works if bucket is public
- delete permissions prevent other users deleting media

### Database Functions and Views

- `increment_project_views` increments exactly once per call
- trending view returns only public projects
- trending score ordering is deterministic enough for tests
- notification triggers create expected rows
- updated_at triggers run on profiles/projects/logs updates

## 13. Security Test Plan

### Authentication and Authorization

- all protected UI routes redirect unauthenticated users
- all protected REST endpoints require Bearer token
- Supabase service role key is never exposed to UI bundle
- agent token raw value is shown only once
- token hash only is stored
- revoked/expired/project-restricted tokens are enforced
- cross-user and cross-project access attempts fail

### RLS Regression Matrix

For each user role, test read/create/update/delete across:

- profiles
- projects
- logs
- collaborators
- comments
- agent tokens
- audit logs
- notifications
- storage objects

### Input and Content Security

- markdown rendering does not execute scripts
- uploaded file extensions are restricted
- oversized files are rejected
- public URLs do not leak private data beyond intended public buckets
- setup script cannot inject untrusted header values into shell commands without sanitization
- logs do not print Bearer tokens
- CORS configuration is restrictive in production

### Abuse Controls

- REST/MCP rate limiting works
- repeated invalid token attempts are rate limited
- large JSON body handling is bounded or should be bounded
- content length limits for titles/content/tags are enforced server-side, not only in docs

## 14. Accessibility Test Plan

For core pages and modals:

- keyboard-only navigation works
- visible focus states
- logical heading order
- forms have labels and error text associated with fields
- buttons have accessible names
- dialogs trap focus and close with Escape
- images have useful alt text or are decorative
- color contrast meets WCAG AA
- loading states are announced where practical
- animated timeline respects reduced motion preference

Automated axe tests should run against:

- landing
- login/register
- dashboard
- projects list
- project detail
- log editor
- explore
- public project/log
- agent access modal flows

## 15. Responsive and Cross-Browser Test Plan

### Viewports

- mobile: 375x667
- large mobile: 430x932
- tablet: 768x1024
- laptop: 1366x768
- desktop: 1440x900+

### Browsers

- Chromium
- Firefox
- WebKit/Safari via Playwright
- real mobile Safari/Chrome before major release if possible

### Areas to Validate

- nav/sidebar behavior
- timeline layout
- modals/forms
- media gallery
- markdown content wrapping
- project/log cards
- public share pages
- agent token table/card layout

## 16. Performance Test Plan

### UI

- Lighthouse checks on landing, dashboard, project detail, public project
- initial bundle size budget
- lazy routes load correctly
- timeline remains smooth with 100+ logs
- media gallery lazy-loads images/video
- search response perceived latency under target

### Backend/API

- `GET /projects` with 100+ projects
- `GET /projects/:id/timeline` with 500+ logs
- concurrent REST requests with valid tokens
- rate limit memory map behavior under many IPs
- cold start/startup validation time

### Suggested Budgets

- landing LCP < 2.5s on good connection
- route transition < 300ms after code loaded
- REST p95 < 500ms for normal project/log requests in staging
- no route chunk over agreed bundle threshold without review

## 17. Visual Regression Plan

Use Playwright screenshots or a visual testing service.

Capture stable states for:

- landing hero
- auth split layout
- dashboard empty and populated
- project card grid
- project timeline with media
- log editor markdown preview
- explore page
- public profile/project/log
- agent token creation modal
- dark theme/cinematic styling

Disable or stabilize animations/timestamps before screenshots.

## 18. Release Gates

### Pull Request Gate

Required:

- UI lint passes
- UI build passes
- MCP build passes
- unit tests pass
- critical UI route tests pass
- MCP REST unit/integration tests pass

### Pre-Merge or Preview Gate

Required:

- Playwright smoke suite passes
- RLS policy tests pass against local/staging Supabase
- accessibility smoke passes on key pages
- no secrets in built artifacts/logs

### Pre-Production Gate

Required:

- full E2E suite passes in staging
- production config review:
  - CORS origin is not `*` unless intentional
  - service role key only in MCP server
  - Vercel/Railway env vars set correctly
- database migrations applied and verified
- rollback plan documented

## 19. Coverage Targets

Initial targets:

- UI utilities/services/stores: 80% line coverage
- UI critical pages/flows: route tests plus E2E smoke, no strict line target initially
- MCP auth/rest/tools: 90% line coverage
- Supabase RLS: 100% policy matrix coverage for critical tables

Coverage should not replace behavioral tests. Missing authorization/visibility cases are release blockers even if line coverage is high.

## 20. Implementation Roadmap

### Phase 0: Remediate Current Test Report Findings

These items come from `test-report.md` dated 2026-06-23 and should be fixed before expanding the automated test suite.

#### P0 — Release blockers

1. Fix `PATCH /logs/:id` routing in `mcp/src/http.ts`.
   - Current behavior: `/logs/{log_id}` falls through to 404.
   - Required behavior: route `/logs/{log_id}` into the REST handler.
   - Regression test: `PATCH https://api.devlog.one/logs/{log_id}` returns 200 for a valid owner token and valid log.
2. Fix REST/MCP error status mapping.
   - Invalid, revoked, or expired token → 401.
   - Missing scope → 403.
   - Cross-owner/project-restricted access → 403.
   - Missing project/log → 404.
   - Actual server failures → 500.
   - Regression tests must cover invalid token, missing scope, non-existent project, non-existent log, and cross-user access.

#### P1 — API validation

3. Add server-side validation in `mcp/src/rest.ts`, preferably with Zod.
   - Project title max 100 chars.
   - Project description max 500 chars.
   - Project tags max 10.
   - Log title max 160 chars.
   - Log content max 50,000 chars.
   - Reject invalid `visibility` values.
   - Reject invalid `mood` values.
4. Add validation regression tests for all documented REST limits and enums.

#### P2 — Security hardening

5. Add a startup warning or production assertion if `DEVLOG_MCP_ALLOWED_ORIGIN` is not set.
6. Add defense-in-depth owner filtering to `agentTokens.service.ts` revoke/delete flows, or document reliance on RLS if keeping current implementation.
7. Document the 60-second revoked-token cache TTL in the Agent Access UI.

#### P3 — Product/UX follow-up

8. Confirm intended post-login redirect target: `/explore` vs `/dashboard`.
9. Investigate Explore initial content loading when no project cards appear within the first 3 seconds.

### Phase 1: Test Foundation

1. Add Vitest to `ui/` and `mcp/`
2. Add React Testing Library to `ui/`
3. Add Playwright at repo root or under `ui/`
4. Add test scripts:
   - root `test`
   - root `test:ui`
   - root `test:mcp`
   - root `test:e2e`
5. Add CI workflow for lint/build/test
6. Add shared test docs for env setup and seed data

### Phase 2: High-Value Unit Tests

1. UI services: projects, logs, agent tokens, auth
2. UI auth store and protected route
3. MCP auth, crypto, request context, REST validation helpers
4. Add coverage reporting

### Phase 3: Integration Tests

1. REST endpoint tests with mocked or local Supabase
2. Supabase RLS tests using local seed
3. Storage policy tests
4. Audit logging tests

### Phase 4: E2E Smoke

1. landing/auth/dashboard smoke
2. create project/log flow
3. public visibility flow
4. agent token REST flow

### Phase 5: Full Regression

1. collaboration flows
2. social features
3. media upload flows
4. search/explore/realtime
5. visual regression and accessibility expansion

## 21. Suggested Initial Test Scripts

Root `package.json` should eventually expose:

```json
{
  "scripts": {
    "test": "npm run test:ui && npm run test:mcp",
    "test:ui": "npm run test --prefix ui",
    "test:mcp": "npm run test --prefix mcp",
    "test:e2e": "playwright test",
    "ci": "npm run ui:build && npm run mcp:build && npm run test"
  }
}
```

UI `package.json` should eventually expose:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

MCP `package.json` should eventually expose:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 22. Known Risk Areas to Prioritize

1. **Visibility and RLS:** private/shared/unlisted/public access rules must be correct.
2. **Agent tokens:** scope enforcement, project restrictions, revoked/expired token behavior, audit logging.
3. **Server-side validation:** docs mention limits, but tests should confirm limits are actually enforced.
4. **Media uploads:** file type/size/path/storage permissions.
5. **Markdown rendering:** prevent script injection and layout breakage.
6. **Collaborator permissions:** viewer/editor/admin boundaries.
7. **CORS and secrets:** production safety.
8. **Realtime/social features:** notifications/comments/reactions consistency.

## 23. Acceptance Criteria for This Plan

The testing strategy is considered implemented when:

- developers can run one command locally for all non-E2E tests
- CI blocks merges on lint/build/test failures
- seeded local/staging data supports repeatable tests
- core project/log/auth/visibility/agent-token flows are covered by automated tests
- every RLS policy has at least one allow and one deny test where applicable
- production smoke checks are safe and documented
