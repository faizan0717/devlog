import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerProjectTools } from './tools/projects.js'
import { registerLogTools } from './tools/logs.js'
import { registerPlanTools } from './tools/plan.js'
import { registerDocsTools } from './tools/docs.js'

export function createDevlogMcpServer(): McpServer {
  const server = new McpServer({
    name: 'devlog-mcp-server',
    version: '0.1.0',
  })

  registerDocsTools(server)
  registerProjectTools(server)
  registerLogTools(server)
  registerPlanTools(server)

  return server
}
