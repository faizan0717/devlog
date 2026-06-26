
<!-- devlog:start -->
## devLog
Base URL: https://api.devlog.one
Token: read from ~/.devlog (never commit this file).
Modes: REST is always available. Hosted MCP may also be configured at https://api.devlog.one/mcp when the client supports HTTP MCP with Authorization headers.

Always call GET /docs first for the latest reference. If /docs is unavailable, use mcp/AGENT_DOCS.md in this repo as the fallback reference.

Quick reference:
  GET   /projects                      — list my projects
  POST  /projects                      — create a project
  PATCH /projects/{id}                 — update a project
  GET   /projects/{id}/timeline        — get project + all logs
  POST  /logs {project_id,title,content,mood,visibility} — create a log entry
  PATCH /logs/{id}                     — update a log entry
  GET   /projects/{id}/plan            — get milestones + todos
  POST  /projects/{id}/milestones      — create a milestone
  POST  /milestones/{id}/todos         — create a todo
  PATCH /milestones/{id}               — update a milestone
  PATCH /todos/{id}                    — update a todo
  POST  /todos/{id}/complete           — complete a todo
  POST  /todos/{id}/reopen             — reopen a todo

All requests: Authorization: Bearer $(cat ~/.devlog)
mood: building | shipped | stuck | reflecting | inspired | learning
visibility: private | public | unlisted | shared
<!-- devlog:end -->
