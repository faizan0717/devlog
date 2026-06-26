#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/SETUP_SCRIPT.sh"
BASE_URL="https://api.devlog.one"
TOKEN="dl_agent_testtoken1234567890"

bash -n "$SCRIPT" || exit 1

work="$(mktemp -d)"
cp "$SCRIPT" "$work/setup.sh"
sed -i "s#__BASE_URL__#$BASE_URL#g" "$work/setup.sh"
chmod +x "$work/setup.sh"

pass=0
fail=0

check() {
  if eval "$2"; then
    echo "✓ $1"
    pass=$((pass + 1))
  else
    echo "✗ $1"
    fail=$((fail + 1))
  fi
}

run_setup() {
  local repo="$1" home="$2"
  shift 2
  (cd "$repo" && HOME="$home" bash "$work/setup.sh" "$@")
}

repo1="$(mktemp -d)"; home1="$(mktemp -d)"
run_setup "$repo1" "$home1" install "$TOKEN" --local --yes >/tmp/devlog-setup-t1.out 2>&1
check "local install writes .devlog" "test -f '$repo1/.devlog'"
check "local install gitignores .devlog" "grep -qxF .devlog '$repo1/.gitignore'"
check "local default writes Claude" "grep -q '<!-- devlog:start -->' '$repo1/CLAUDE.md'"
check "local default writes Cursor" "grep -q '<!-- devlog:start -->' '$repo1/.cursor/rules/devlog.mdc'"
check "local default writes Windsurf" "grep -q '<!-- devlog:start -->' '$repo1/.windsurfrules'"
check "local default writes Copilot" "grep -q '<!-- devlog:start -->' '$repo1/.github/copilot-instructions.md'"

repo2="$(mktemp -d)"; home2="$(mktemp -d)"
run_setup "$repo2" "$home2" install "$TOKEN" --local --agents claude,cursor --mcp --yes >/tmp/devlog-setup-t2.out 2>&1
check "Claude MCP config created" "grep -q '\"devlog\"' '$repo2/.mcp.json'"
check "Cursor MCP config created" "grep -q '\"devlog\"' '$repo2/.cursor/mcp.json'"
check "MCP config has hosted endpoint" "grep -q '$BASE_URL/mcp' '$repo2/.mcp.json'"

run_setup "$repo2" "$home2" status >/tmp/devlog-setup-t3.out 2>&1
check "status masks token" "grep -q 'dl_agent_tes' /tmp/devlog-setup-t3.out && ! grep -q '$TOKEN' /tmp/devlog-setup-t3.out"
check "status reports MCP" "grep -q '.mcp.json has devLog MCP config' /tmp/devlog-setup-t3.out"

run_setup "$repo2" "$home2" verify >/tmp/devlog-setup-t4.out 2>&1
verify_code=$?
check "verify fake token exits nonzero" "test '$verify_code' -ne 0"
check "verify reaches health" "grep -q 'GET /health reachable' /tmp/devlog-setup-t4.out"
check "verify invalid token message" "grep -q 'invalid\|revoked\|expired' /tmp/devlog-setup-t4.out"

run_setup "$repo2" "$home2" uninstall --local --yes >/tmp/devlog-setup-t5.out 2>&1
check "uninstall local removes .devlog" "test ! -f '$repo2/.devlog'"
check "uninstall local removes Claude block" "! grep -q '<!-- devlog:start -->' '$repo2/CLAUDE.md'"
check "uninstall local removes MCP devlog entry" "! grep -q '\"devlog\"' '$repo2/.mcp.json'"

repo3="$(mktemp -d)"; home3="$(mktemp -d)"
run_setup "$repo3" "$home3" install "$TOKEN" --global --yes >/tmp/devlog-setup-t6.out 2>&1
check "global install writes ~/.devlog" "test -f '$home3/.devlog'"
check "global install writes Claude" "grep -q '<!-- devlog:start -->' '$home3/.claude/CLAUDE.md'"
run_setup "$repo3" "$home3" uninstall --global --yes >/tmp/devlog-setup-t7.out 2>&1
check "global uninstall removes ~/.devlog" "test ! -f '$home3/.devlog'"
check "global uninstall removes global block" "! grep -q '<!-- devlog:start -->' '$home3/.claude/CLAUDE.md'"

repo4="$(mktemp -d)"; home4="$(mktemp -d)"
run_setup "$repo4" "$home4" >/tmp/devlog-setup-t8.out 2>&1
no_args_code=$?
check "no args without token fails" "test '$no_args_code' -ne 0"
check "no args gives create-token guidance" "grep -q 'Create one in devLog' /tmp/devlog-setup-t8.out"

repo5="$(mktemp -d)"; home5="$(mktemp -d)"
run_setup "$repo5" "$home5" "$TOKEN" --yes >/tmp/devlog-setup-t9.out 2>&1
check "legacy token command writes global token" "test -f '$home5/.devlog'"

repo6="$(mktemp -d)"; home6="$(mktemp -d)"
printf 'before\n' > "$repo6/CLAUDE.md"
run_setup "$repo6" "$home6" install "$TOKEN" --local --agents claude --yes >/tmp/devlog-setup-t10.out 2>&1
printf 'after\n' >> "$repo6/CLAUDE.md"
run_setup "$repo6" "$home6" uninstall --local --yes >/tmp/devlog-setup-t11.out 2>&1
check "uninstall preserves content before block" "grep -q '^before$' '$repo6/CLAUDE.md'"
check "uninstall preserves content after block" "grep -q '^after$' '$repo6/CLAUDE.md'"

printf '\nPassed: %s Failed: %s\n' "$pass" "$fail"
exit "$fail"
