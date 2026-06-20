#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createDevlogMcpServer } from './server.js'

const server = createDevlogMcpServer()

const transport = new StdioServerTransport()
await server.connect(transport)
