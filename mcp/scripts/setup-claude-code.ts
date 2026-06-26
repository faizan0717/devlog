#!/usr/bin/env tsx
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const token = process.argv[2]
if (!token || !token.startsWith('dl_agent_')) {
  console.error('Usage: tsx scripts/setup-claude-code.ts <dl_agent_token>')
  process.exit(1)
}

const mcpUrl = process.env.DEVLOG_MCP_URL ?? 'http://localhost:8787'
const mcpJsonPath = join(homedir(), '.claude', 'mcp.json')

const existing = existsSync(mcpJsonPath)
  ? JSON.parse(readFileSync(mcpJsonPath, 'utf8'))
  : {}

const updated = {
  ...existing,
  mcpServers: {
    ...(existing.mcpServers ?? {}),
    devlog: {
      type: 'http',
      url: `${mcpUrl}/mcp`,
      headers: { Authorization: `Bearer ${token}` },
    },
  },
}

writeFileSync(mcpJsonPath, JSON.stringify(updated, null, 2) + '\n')
console.log(`✓ devLog MCP connection configured in ${mcpJsonPath}`)
console.log('  Run /mcp in Claude Code to reload, then call devlog_get_docs.')
