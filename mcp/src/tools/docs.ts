import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const docsPath = join(dirname(fileURLToPath(import.meta.url)), '../../AGENT_DOCS.md')

export function registerDocsTools(server: McpServer): void {
  server.tool(
    'devlog_get_docs',
    'Fetch the latest devLog MCP documentation — tool list, params, moods, and usage notes. Call this at the start of any devLog session.',
    {},
    () => ({
      content: [{ type: 'text', text: readFileSync(docsPath, 'utf8') }],
    }),
  )
}
