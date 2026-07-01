# devLog Public Beta Operations

This document is the launch-week runbook for public beta monitoring, user feedback, and emergency moderation. It is intentionally lightweight: enough process to respond quickly without building a full admin console before v1.

## Public support channels

- Product feedback / bug reports: https://github.com/faizan0717/devlog/issues/new?title=Beta%20feedback
- Abuse or unsafe public content: support@devlog.one or `/support` in the app
- Privacy questions: privacy@devlog.one

Ask reporters to include the project/log/profile URL, screenshots, browser/device details, and a short description of expected vs actual behavior.

## Daily launch-week monitoring checklist

Do this at least once per day during public beta launch week, and immediately after any deploy:

1. Vercel UI
   - Check latest deployment status and build logs.
   - Review runtime/client errors if available.
   - Visit `/`, `/explore`, `/projects`, `/kanban`, `/agent-access`, `/support`.
2. Railway API/MCP
   - Check service health at `https://api.devlog.one/health`.
   - Review logs for spikes in `401`, `403`, `429`, and `500` responses.
   - Verify `GET /docs` and one authenticated `GET /projects` with a test/beta token.
3. Supabase
   - Check auth signup/login activity and errors.
   - Check Postgres/API error graphs.
   - Check Storage errors for `avatars`, `project-covers`, and `log-media`.
4. User reports
   - Triage new GitHub feedback issues and support inbox messages.
   - Label/block critical issues: auth, data loss, upload failure, API outage, abuse.

## Critical signals

Escalate immediately if any of these appear repeatedly:

- Signup/login failures.
- Project/log creation failures.
- Public visibility leaks or unauthorized private content access.
- Upload failures or unexpected file-size bypasses.
- MCP/REST `500` responses.
- Agent token validation errors for valid tokens.
- Spam, harassment, leaked secrets, copyrighted media, impersonation, or illegal content.

## Emergency public-content moderation

Preferred product path:

1. Identify the exact resource URL and owner if possible.
2. Preserve basic evidence for audit: URL, reporter, timestamp, reason, screenshot if needed.
3. Hide content by changing visibility to `private` or deleting it if required.
4. Notify the user when appropriate.
5. Create a follow-up issue if tooling was missing or manual database work was required.

### Temporary admin/manual path

Until a dedicated admin console exists, use Supabase SQL editor with service-role/admin access. Avoid broad updates; always target a single UUID and record the action in a private log or issue.

Hide a public project:

```sql
update projects
set visibility = 'private', updated_at = now()
where id = '<project-id>';
```

Hide a public log:

```sql
update logs
set visibility = 'private', updated_at = now()
where id = '<log-id>';
```

Hide plan content:

```sql
update plan_milestones
set visibility = 'private', updated_at = now()
where id = '<milestone-id>';

update plan_todos
set visibility = 'private', updated_at = now()
where id = '<todo-id>';
```

Remove an abusive public comment:

```sql
delete from comments
where id = '<comment-id>';
```

If media must be removed, delete the exact object from the Supabase Storage bucket (`avatars`, `project-covers`, or `log-media`) after noting the object path. Prefer making the parent project/log private first so the public UI stops surfacing it quickly.

## Known beta risks / follow-ups

- No dedicated admin moderation dashboard yet.
- Abuse reporting is email/support-link based, not an in-app report form per resource.
- No external error tracker is wired by default; launch-week monitoring relies on Vercel, Railway, Supabase, and user reports.
- Media buckets are public; sensitive media should not be uploaded even inside private logs.

## Release-note wording

> devLog is in public beta. Please report bugs or product feedback from the Support page. To report spam, harassment, leaked secrets, copyrighted media, or other unsafe public content, use “Report abuse” on Support or email support@devlog.one.
