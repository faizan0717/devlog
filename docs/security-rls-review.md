# Final security / RLS review — public beta

Date: 2026-06-28

## Summary

Reviewed RLS and browser/server access paths for profiles, projects, logs, log media, comments, reactions, follows, collaborators, notifications, agent tokens, plan milestones, todos, and audit logs.

Implemented hardening in:

- `supabase/final-rls-hardening.sql` for existing beta databases
- appended same hardening block to `supabase/schema.sql` for fresh installs
- `ui/src/pages/PublicProject.tsx` to match public roadmap filtering

## Access model checked

| Area | Expected beta behavior | Result |
|---|---|---|
| Profiles | Public profiles readable; email not exposed through public table API | Hardened |
| Projects | Owner full access; collaborators can read; anonymous only public/unlisted projects | Existing policy OK |
| Logs | Owner/collaborator access; anonymous only public logs under public/unlisted projects | Existing policy OK |
| Comments | Follow parent log visibility; only author writes own comments | Hardened insert/update/read |
| Reactions | Follow parent log visibility; only reactor creates/deletes own reaction | Hardened insert/read |
| Follows | Public social graph; only follower creates/deletes own rows | Existing policy OK for beta |
| Collaborators | Owner manages; collaborator can read own row; no public collaborator list for private/shared projects | Existing policy OK |
| Notifications | Recipient reads/updates; actors can only create coherent follow/comment/reaction notifications | Hardened |
| Agent tokens | Owner-only UI access; service role validates raw token hash server-side | Existing policy OK |
| Agent audit logs | Owner-only read; service role writes from MCP/REST server | Existing policy OK |
| Plan milestones/todos | Owner all; editor/admin write; viewer/collab read non-private; anonymous only public plan rows under public/unlisted projects | Hardened public read |
| Security-definer functions | No browser service-role exposure; functions set `search_path`; view counter only public/unlisted | Hardened |

## Key fixes made

1. **Profile email exposure**
   - Previous policy allowed public `select` on all profile columns, including `email`.
   - Fixed by revoking column select on `profiles.email` from `anon` and `authenticated`, granting explicit non-email columns, and changing profile read policy to `is_public = true or auth.uid() = id`.

2. **Comments / reactions write-through to private logs**
   - Previous insert policies only checked `auth.uid() = user_id`, so an authenticated user who guessed a private `log_id` could attach comments/reactions.
   - Added `public.can_read_log(log_id, auth.uid())` helper and applied it to comment/reaction read and insert policies.
   - Added own-comment update policy with the same visibility check.

3. **Notification spoofing**
   - Previous notification insert allowed any authenticated actor to create arbitrary notifications as themselves.
   - Restricted inserts to coherent follow/comment/reaction shapes and verified comment/reaction notifications reference a readable log whose project owner is the notification recipient.

4. **Public Plan visibility**
   - Anonymous roadmap reads now expose only `visibility = 'public'` plan rows. `unlisted` plan rows are not listed publicly until item-level share links exist.
   - Public project UI now filters roadmap items the same way.

5. **Security definer hygiene**
   - `get_project_owner` and `increment_project_views` now set a safe `search_path`.
   - `increment_project_views` no longer increments private/shared projects.

## Agent-token review

The MCP/REST server uses the Supabase service role only in `mcp/src/supabase.ts`. Browser code uses only `VITE_SUPABASE_ANON_KEY` in `ui/src/lib/supabase.ts`; no service-role env var is referenced by UI code.

Agent access checks reviewed in `mcp/src/auth.ts` and `mcp/src/rest.ts`:

- revoked/expired token rejection
- 60s token cache TTL for revocation propagation
- `allowed_project_ids` enforced in `getProjectRole`
- project read requires owner/collaborator role
- project writes require owner/admin/editor role
- project metadata updates are owner-only
- plan/log writes require project write role
- audit events written for agent actions

## Explicit beta risks / follow-ups

1. **Log media bucket is public.**
   - `log-media` objects are publicly readable if the object URL is known. RLS protects the log row/media JSON, but Supabase public bucket URLs do not inherit project/log visibility.
   - Beta posture: acceptable only if documented as a limitation and users are warned not to upload sensitive media to private/shared logs until signed URLs or a media ownership table is implemented.
   - Recommended follow-up: make `log-media` private, add a `log_media` table with `log_id`, and serve signed URLs after checking log access.

2. **Follows are public.**
   - Current product model treats follows as a public social graph. If private profiles become important, add profile privacy-aware follow read policies.

3. **Collaborator privacy on project cards.**
   - Project collaborators are not publicly readable for private/shared projects, but owner/collaborator UIs can show collaborator profile rows only when those profiles are public or self. If private teammate profiles are needed in shared projects, add a collaborator-aware profile read policy.

## Manual verification checklist

Run after applying `supabase/final-rls-hardening.sql` to production/staging:

- Anonymous cannot select private/shared projects, logs, comments, reactions, milestones, or todos.
- Anonymous can select public projects/logs and public plan rows under public/unlisted projects.
- Anonymous cannot select `profiles.email`.
- Owner can CRUD own project/log/plan rows and manage collaborators/tokens.
- Viewer collaborator can read project/log/shared-or-public plan rows but cannot write logs/plan.
- Editor/admin collaborator can create/update logs and plan rows, but cannot update project metadata or manage collaborators.
- Unrelated authenticated user cannot read private/shared content and cannot comment/react on inaccessible logs.
- Restricted agent token cannot access projects outside `allowed_project_ids`.
- Revoked agent token fails within cache TTL.
- UI build contains no service-role env references.
