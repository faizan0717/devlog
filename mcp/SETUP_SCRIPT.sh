#!/usr/bin/env bash
set -euo pipefail

BASE_URL="__BASE_URL__"
CMD="${1:-}"
TOKEN=""
SCOPE=""
AGENTS=""
YES="false"
MCP="false"

BOLD="\033[1m"; DIM="\033[2m"; GREEN="\033[32m"; CYAN="\033[36m"; YELLOW="\033[33m"; RED="\033[31m"; RESET="\033[0m"
header() { printf "\n%bdevLog agent setup%b\n\n" "$BOLD$CYAN" "$RESET"; }
ok()     { printf "  %b✓%b %s\n" "$GREEN" "$RESET" "$1"; }
info()   { printf "  %b%s%b\n" "$DIM" "$1" "$RESET"; }
warn()   { printf "  %b!%b %s\n" "$YELLOW" "$RESET" "$1"; }
err()    { printf "  %b✗%b %s\n" "$RED" "$RESET" "$1"; }

usage() {
  cat <<EOF
Usage:
  setup.sh install <token> --global
      Save token to ~/.devlog and add global Claude instructions.

  setup.sh install <token> --local [--agents all|claude,cursor,windsurf,copilot] [--mcp]
      Save token to ./.devlog, add repo agent instructions, and optionally write
      hosted MCP config for clients setup.sh can configure. REST instructions are
      always installed and are the fallback for unsupported MCP clients.

  setup.sh status
      Print local/global files and the effective token source. No network call.

  setup.sh verify [--local|--global]
      Check token format, API reachability, docs, and basic project access.

  setup.sh uninstall --local|--global|--all
      Remove setup.sh-managed local/global files. This does not revoke remote tokens;
      revoke/delete tokens in devLog → Agent Access.

Token resolution for agents and verify:
  ./.devlog → ~/.devlog → DEVLOG_AGENT_TOKEN

Backwards compatible:
  setup.sh <token>   # installs globally
EOF
}

is_token() { [[ "${1:-}" == dl_agent_* ]]; }
mask_token() {
  local t="${1:-}"
  if [ ${#t} -le 16 ]; then printf "****"; else printf "%s…%s" "${t:0:12}" "${t: -4}"; fi
}
have_tty() { [ -t 0 ] && return 0; { [ -e /dev/tty ] && : </dev/tty; } 2>/dev/null; }
ask() {
  local prompt="$1" var="$2"
  printf "  %b%s%b " "$BOLD" "$prompt" "$RESET"
  if [ -t 0 ]; then
    read -r "$var"
  elif { [ -e /dev/tty ] && : </dev/tty; } 2>/dev/null; then
    read -r "$var" </dev/tty
  else
    return 1
  fi
}
confirm() {
  [ "$YES" = "true" ] && return 0
  local answer=""
  ask "$1 [y/N]:" answer
  [[ "$answer" =~ ^[Yy]$ ]]
}

prompt_for_token() {
  local pasted=""
  have_tty || return 1
  ask "Paste your devLog agent token:" pasted
  pasted="$(printf "%s" "$pasted" | tr -d '[:space:]')"
  is_token "$pasted" || return 1
  TOKEN="$pasted"
}

resolve_token() {
  EFFECTIVE_SOURCE="none"; EFFECTIVE_TOKEN=""
  if [ -f ".devlog" ]; then EFFECTIVE_SOURCE="local ./.devlog"; EFFECTIVE_TOKEN="$(tr -d '[:space:]' < .devlog)"; return; fi
  if [ -f "$HOME/.devlog" ]; then EFFECTIVE_SOURCE="global ~/.devlog"; EFFECTIVE_TOKEN="$(tr -d '[:space:]' < "$HOME/.devlog")"; return; fi
  if [ -n "${DEVLOG_AGENT_TOKEN:-}" ]; then EFFECTIVE_SOURCE="DEVLOG_AGENT_TOKEN"; EFFECTIVE_TOKEN="$DEVLOG_AGENT_TOKEN"; return; fi
}

token_file_for_scope() {
  case "$1" in
    local) printf ".devlog" ;;
    global) printf "%s/.devlog" "$HOME" ;;
    *) resolve_token; case "$EFFECTIVE_SOURCE" in local*) printf ".devlog";; global*) printf "%s/.devlog" "$HOME";; *) printf "";; esac ;;
  esac
}

devlog_block() {
  local token_ref="$1"
  cat <<EOF
<!-- devlog:start -->
## devLog
Base URL: $BASE_URL
Token: read from $token_ref (never commit this file).
Modes: REST is always available. Hosted MCP may also be configured at $BASE_URL/mcp when the client supports HTTP MCP with Authorization headers. If MCP is unsupported or misconfigured, use the REST endpoints below.

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

All requests: Authorization: Bearer \$(cat $token_ref)
mood: building | shipped | stuck | reflecting | inspired | learning
visibility: private | public | unlisted | shared
<!-- devlog:end -->
EOF
}

write_managed_block() {
  local file="$1" token_ref="$2" dir block tmp
  dir="$(dirname "$file")"
  [ "$dir" != "." ] && mkdir -p "$dir"
  block="$(devlog_block "$token_ref")"
  if [ -f "$file" ] && grep -q '<!-- devlog:start -->' "$file"; then
    tmp="$(mktemp)"
    awk -v block="$block" '
      /<!-- devlog:start -->/ { print block; skip=1; next }
      /<!-- devlog:end -->/ { skip=0; next }
      !skip { print }
    ' "$file" > "$tmp"
    mv "$tmp" "$file"
    ok "Updated devLog managed block in $file"
  else
    printf "\n%s\n" "$block" >> "$file"
    ok "Added devLog managed block to $file"
    if grep -q '^## devLog' "$file" && ! grep -q '<!-- devlog:start -->' "$file"; then
      warn "$file has an older unmarked devLog section. I left it untouched. Remove it manually if needed."
    fi
  fi
}

remove_managed_block() {
  local file="$1" tmp
  [ -f "$file" ] || { info "$file not found"; return; }
  if grep -q '<!-- devlog:start -->' "$file"; then
    tmp="$(mktemp)"
    awk '
      /<!-- devlog:start -->/ { skip=1; next }
      /<!-- devlog:end -->/ { skip=0; next }
      !skip { print }
    ' "$file" > "$tmp"
    mv "$tmp" "$file"
    ok "Removed devLog managed block from $file"
  elif grep -q '^## devLog' "$file"; then
    warn "$file has an older unmarked devLog section. I left it untouched; remove it manually if needed."
  else
    info "No devLog managed block in $file"
  fi
}

remove_mcp_json() {
  local file="$1" tmp
  [ -f "$file" ] || { info "$file not found"; return; }
  if ! grep -q '"devlog"' "$file"; then info "No devLog MCP config in $file"; return; fi
  if ! command -v python3 >/dev/null 2>&1; then warn "Python 3 not found; remove devlog from $file manually if needed."; return; fi
  tmp="$(mktemp)"
  DEVLOG_MCP_FILE="$file" python3 > "$tmp" <<'PY'
import json, os
path = os.environ['DEVLOG_MCP_FILE']
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
if isinstance(data, dict) and isinstance(data.get('mcpServers'), dict):
    data['mcpServers'].pop('devlog', None)
print(json.dumps(data, indent=2))
PY
  mv "$tmp" "$file"
  ok "Removed devLog MCP config from $file"
}

local_files() { printf "%s\n" "CLAUDE.md" ".cursor/rules/devlog.mdc" ".windsurfrules" ".github/copilot-instructions.md"; }
global_files() { printf "%s\n" "$HOME/.claude/CLAUDE.md"; }

choose_agents_if_needed() {
  [ -n "$AGENTS" ] && return
  if have_tty; then
    local answer=""
    ask "Which agents for this repo? [all/claude,cursor,windsurf,copilot]:" answer
    answer="$(printf "%s" "$answer" | tr '[:upper:]' '[:lower:]' | xargs)"
    AGENTS="${answer:-all}"
  else
    AGENTS="all"
  fi
}

write_local_agent_blocks() {
  local token_ref="$1" token="$2"
  choose_agents_if_needed
  IFS=',' read -ra selected <<< "$AGENTS"
  for agent in "${selected[@]}"; do
    agent="$(printf "%s" "$agent" | tr '[:upper:]' '[:lower:]' | xargs)"
    case "$agent" in
      claude|claude-code) write_managed_block "CLAUDE.md" "$token_ref"; [ "$MCP" = "true" ] && configure_mcp_for_agent "claude" "local" "$token" ;;
      cursor) write_managed_block ".cursor/rules/devlog.mdc" "$token_ref"; [ "$MCP" = "true" ] && configure_mcp_for_agent "cursor" "local" "$token" ;;
      windsurf) write_managed_block ".windsurfrules" "$token_ref"; [ "$MCP" = "true" ] && configure_mcp_for_agent "windsurf" "local" "$token" ;;
      copilot|github-copilot) write_managed_block ".github/copilot-instructions.md" "$token_ref"; [ "$MCP" = "true" ] && configure_mcp_for_agent "copilot" "local" "$token" ;;
      all) write_managed_block "CLAUDE.md" "$token_ref"; write_managed_block ".cursor/rules/devlog.mdc" "$token_ref"; write_managed_block ".windsurfrules" "$token_ref"; write_managed_block ".github/copilot-instructions.md" "$token_ref"; if [ "$MCP" = "true" ]; then configure_mcp_for_agent "claude" "local" "$token"; configure_mcp_for_agent "cursor" "local" "$token"; configure_mcp_for_agent "windsurf" "local" "$token"; configure_mcp_for_agent "copilot" "local" "$token"; fi ;;
      "") ;;
      *) warn "Unknown agent '$agent' skipped" ;;
    esac
  done
}

write_mcp_json() {
  local file="$1" token="$2" client="$3" dir tmp
  dir="$(dirname "$file")"
  [ "$dir" != "." ] && mkdir -p "$dir"

  if ! command -v python3 >/dev/null 2>&1; then
    warn "Python 3 not found; skipped $client MCP config. REST instructions still work."
    return
  fi

  tmp="$(mktemp)"
  DEVLOG_MCP_FILE="$file" DEVLOG_MCP_URL="$BASE_URL/mcp" DEVLOG_MCP_TOKEN="$token" python3 > "$tmp" <<'PY'
import json, os
path = os.environ['DEVLOG_MCP_FILE']
url = os.environ['DEVLOG_MCP_URL']
token = os.environ['DEVLOG_MCP_TOKEN']
try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    data = {}
except Exception as exc:
    raise SystemExit(f"Could not parse existing {path}: {exc}")
if not isinstance(data, dict):
    data = {}
servers = data.setdefault('mcpServers', {})
servers['devlog'] = {
    'type': 'http',
    'url': url,
    'headers': {
        'Authorization': f'Bearer {token}'
    }
}
print(json.dumps(data, indent=2))
PY
  mv "$tmp" "$file"
  chmod 600 "$file" 2>/dev/null || true
  ok "Configured hosted MCP for $client in $file"
  warn "$file stores an agent token for MCP headers. Keep it private and do not commit it."
}

configure_mcp_for_agent() {
  local agent="$1" scope="$2" token="$3"
  case "$agent" in
    claude|claude-code)
      if [ "$scope" = "local" ]; then
        write_mcp_json ".mcp.json" "$token" "Claude Code"
      else
        warn "Global Claude MCP config differs by client/version; installed REST instructions globally. Use local --mcp for project .mcp.json."
      fi
      ;;
    cursor)
      if [ "$scope" = "local" ]; then
        write_mcp_json ".cursor/mcp.json" "$token" "Cursor"
      else
        warn "Global Cursor MCP config is not written by setup.sh yet; installed REST instructions globally."
      fi
      ;;
    windsurf)
      warn "Windsurf MCP config is not written automatically yet; installed REST instructions instead."
      ;;
    copilot|github-copilot)
      warn "GitHub Copilot MCP config is not written automatically; installed instruction fallback instead."
      ;;
  esac
}

install_scope() {
  local scope="$1" token="$2" token_file token_ref
  token_file="$(token_file_for_scope "$scope")"
  [ -n "$token_file" ] || { err "Could not resolve token file"; exit 1; }
  token_ref="$token_file"
  [ "$scope" = "global" ] && token_ref="~/.devlog"

  printf "%s\n" "$token" > "$token_file"
  chmod 600 "$token_file" 2>/dev/null || true
  ok "Token saved to $token_ref"

  if [ "$scope" = "local" ]; then
    touch .gitignore
    if grep -qxF ".devlog" .gitignore; then info ".devlog already in .gitignore"; else printf "\n.devlog\n" >> .gitignore; ok "Added .devlog to .gitignore"; fi
    write_local_agent_blocks ".devlog" "$token"
  else
    mkdir -p "$HOME/.claude"
    write_managed_block "$HOME/.claude/CLAUDE.md" "~/.devlog"
    if [ "$MCP" = "true" ]; then
      configure_mcp_for_agent "claude" "global" "$token"
      info "REST instructions remain the global fallback for all agents."
    fi
    if have_tty; then
      local answer=""
      ask "Also configure this repo for Claude/Cursor/Windsurf/Copilot using ~/.devlog? [Y/n]:" answer
      case "$(printf "%s" "$answer" | tr '[:upper:]' '[:lower:]')" in n|no) ;; *) write_local_agent_blocks "~/.devlog" "$token" ;; esac
    fi
  fi
}

status_cmd() {
  header
  printf "%bLocal%b\n" "$BOLD" "$RESET"
  [ -f .devlog ] && ok "./.devlog present ($(mask_token "$(tr -d '[:space:]' < .devlog)"))" || info "./.devlog not found"
  for f in $(local_files); do [ -f "$f" ] && grep -q '<!-- devlog:start -->' "$f" && ok "$f has devLog block" || info "$f has no devLog block"; done
  [ -f .mcp.json ] && grep -q '"devlog"' .mcp.json && ok ".mcp.json has devLog MCP config" || info ".mcp.json has no devLog MCP config"
  [ -f .cursor/mcp.json ] && grep -q '"devlog"' .cursor/mcp.json && ok ".cursor/mcp.json has devLog MCP config" || info ".cursor/mcp.json has no devLog MCP config"
  printf "\n%bGlobal%b\n" "$BOLD" "$RESET"
  [ -f "$HOME/.devlog" ] && ok "~/.devlog present ($(mask_token "$(tr -d '[:space:]' < "$HOME/.devlog")"))" || info "~/.devlog not found"
  for f in $(global_files); do [ -f "$f" ] && grep -q '<!-- devlog:start -->' "$f" && ok "$f has devLog block" || info "$f has no devLog block"; done
  printf "\n%bEffective%b\n" "$BOLD" "$RESET"
  resolve_token
  if [ -n "$EFFECTIVE_TOKEN" ]; then ok "$EFFECTIVE_SOURCE is active ($(mask_token "$EFFECTIVE_TOKEN"))"; else warn "No token found"; fi
  [ -f .devlog ] && [ -f "$HOME/.devlog" ] && info "Local ./.devlog overrides global ~/.devlog"
  printf "\n%bAPI%b\n" "$BOLD" "$RESET"
  info "Run setup.sh verify to check API reachability, token validity, and project access."
}

http_code() {
  local url="$1" token="${2:-}" out
  command -v curl >/dev/null 2>&1 || { printf "000"; return; }
  if [ -n "$token" ]; then
    out=$(curl -sS -o /tmp/devlog_verify_body -w "%{http_code}" -H "Authorization: Bearer $token" "$url" 2>/dev/null) || { printf "000"; return; }
  else
    out=$(curl -sS -o /tmp/devlog_verify_body -w "%{http_code}" "$url" 2>/dev/null) || { printf "000"; return; }
  fi
  printf "%s" "$out"
}

verify_cmd() {
  header
  local token_file="$(token_file_for_scope "$SCOPE")"
  if [ -n "$token_file" ] && [ -f "$token_file" ]; then EFFECTIVE_TOKEN="$(tr -d '[:space:]' < "$token_file")"; EFFECTIVE_SOURCE="$token_file"; else resolve_token; fi
  [ -n "${EFFECTIVE_TOKEN:-}" ] || { err "Missing token. Run install first or set DEVLOG_AGENT_TOKEN."; exit 1; }
  is_token "$EFFECTIVE_TOKEN" || { err "Malformed token at $EFFECTIVE_SOURCE"; exit 1; }
  ok "Using $EFFECTIVE_SOURCE ($(mask_token "$EFFECTIVE_TOKEN"))"
  local code
  code="$(http_code "$BASE_URL/health")"
  [ "$code" = "200" ] && ok "GET /health reachable" || warn "GET /health returned $code"
  code="$(http_code "$BASE_URL/docs")"
  [ "$code" = "200" ] && ok "GET /docs reachable" || warn "GET /docs returned $code"
  code="$(http_code "$BASE_URL/projects" "$EFFECTIVE_TOKEN")"
  case "$code" in
    200) ok "GET /projects succeeded; REST fallback is ready" ;;
    401) err "Token is invalid, revoked, expired, or not accepted"; exit 1 ;;
    403) warn "Token is valid but cannot list projects. It may be limited to selected project actions." ;;
    000) err "Network failure or curl unavailable"; exit 1 ;;
    *) warn "GET /projects returned $code" ;;
  esac
  info "Hosted MCP endpoint: $BASE_URL/mcp (only for clients with HTTP MCP + Authorization header support)."
}

uninstall_scope() {
  local scope="$1" token_file
  token_file="$(token_file_for_scope "$scope")"
  if [ -n "$token_file" ] && [ -f "$token_file" ]; then rm "$token_file"; ok "Removed $token_file"; else info "$token_file not found"; fi
  if [ "$scope" = "local" ]; then
    while IFS= read -r f; do remove_managed_block "$f"; done < <(local_files)
    remove_mcp_json ".mcp.json"
    remove_mcp_json ".cursor/mcp.json"
  else
    while IFS= read -r f; do remove_managed_block "$f"; done < <(global_files)
  fi
}

# Backwards compatible: setup.sh <token>
if is_token "$CMD"; then TOKEN="$CMD"; CMD="install"; shift || true; fi

# No args: if already configured, show status. Otherwise prompt for a token and install globally by default.
if [ -z "$CMD" ]; then
  resolve_token
  if [ -n "$EFFECTIVE_TOKEN" ]; then
    CMD="status"
  elif prompt_for_token; then
    CMD="install"
    SCOPE="global"
  else
    header
    err "No devLog token found."
    info "Create one in devLog → Agent Access → New token, then run this script again."
    usage
    exit 1
  fi
fi

[ "$CMD" != "install" ] || { [ -n "$TOKEN" ] || { TOKEN="${2:-}"; shift 2 || true; }; }
if [ "$CMD" = "install" ] && { [ -z "${TOKEN:-}" ] || ! is_token "$TOKEN"; }; then
  if ! prompt_for_token; then
    header
    err "No valid devLog token provided."
    info "Create one in devLog → Agent Access → New token."
    exit 1
  fi
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --local) SCOPE="local" ;;
    --global) SCOPE="global" ;;
    --all) SCOPE="all" ;;
    --agents) AGENTS="${2:-claude}"; shift ;;
    --agents=*) AGENTS="${1#--agents=}" ;;
    --mcp) MCP="true" ;;
    --rest-only) MCP="false" ;;
    -y|--yes) YES="true" ;;
    *) ;;
  esac
  shift || true
done

case "$CMD" in
  install)
    header
    if [ -z "$SCOPE" ]; then
      if have_tty; then
        answer=""; ask "Install globally for this machine? [Y/n, type local for repo-only]:" answer
        case "$(printf "%s" "$answer" | tr '[:upper:]' '[:lower:]')" in local|l|n|no) SCOPE="local";; *) SCOPE="global";; esac
      else
        SCOPE="global"
      fi
    fi
    install_scope "$SCOPE" "$TOKEN"
    printf "\n%bAll done.%b Your agent has devLog REST instructions.\n" "$BOLD$GREEN" "$RESET"
    [ "$MCP" = "true" ] && info "MCP config was attempted where supported; REST remains available if your client does not support hosted HTTP MCP."
    ;;
  verify) verify_cmd ;;
  status) status_cmd ;;
  uninstall)
    header
    [ -n "$SCOPE" ] || { err "Choose --local, --global, or --all"; exit 1; }
    if [ "$SCOPE" = "all" ]; then
      confirm "Remove local and global devLog setup?" || exit 1
      uninstall_scope local
      uninstall_scope global
    else
      confirm "Remove $SCOPE devLog setup?" || exit 1
      uninstall_scope "$SCOPE"
    fi
    warn "Remote token is still active. Revoke/delete it from devLog → Agent Access if needed."
    ;;
  help|-h|--help) usage ;;
  *) header; err "Unknown command: $CMD"; usage; exit 1 ;;
esac
