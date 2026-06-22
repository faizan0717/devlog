#!/usr/bin/env node
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createDevlogMcpServer } from './server.js'
import { runWithAgentToken } from './requestContext.js'
import { handleRest } from './rest.js'
import { supabase } from './supabase.js'
import { getErrorMessage, getHttpStatus } from './errors.js'

const port = Number(process.env.PORT ?? process.env.DEVLOG_MCP_PORT ?? 8787)
const host = process.env.HOST ?? '0.0.0.0'
const allowedOrigin = process.env.DEVLOG_MCP_ALLOWED_ORIGIN ?? '*'
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, mcp-session-id')
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, mcp-session-id')
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  setCors(res)
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(payload))
}

function checkRateLimit(req: IncomingMessage): boolean {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown'
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

function log(req: IncomingMessage, status: number): void {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress
  console.log(`[devLog MCP] ${req.method} ${req.url} ${status} — ${ip}`)
}

function getBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match?.[1]?.trim() || null
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  if (chunks.length === 0) return undefined
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return undefined
  return JSON.parse(raw)
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCors(res)

  const token = getBearerToken(req)
  if (!token) {
    sendJson(res, 401, { error: 'Missing Authorization: Bearer <devLog agent token>' })
    return
  }

  const server = createDevlogMcpServer()
  const transport = new StreamableHTTPServerTransport({
    // Stateless mode is easiest for hosted/serverless deployments.
    sessionIdGenerator: undefined,
  })

  res.on('close', () => {
    void transport.close().catch(() => undefined)
    void server.close().catch(() => undefined)
  })

  await server.connect(transport)

  const parsedBody = req.method === 'POST' ? await readJsonBody(req) : undefined
  await runWithAgentToken(token, () => transport.handleRequest(req, res, parsedBody))
}

const ALL_ENDPOINTS = ['/health', '/docs', '/setup.sh', 'GET /projects', 'POST /projects', 'PATCH /projects/:id', 'GET /projects/:id/timeline', 'POST /logs', 'PATCH /logs/:id', '/mcp']

const server = http.createServer((req, res) => {
  void (async () => {
    if (req.method === 'OPTIONS') {
      setCors(res)
      res.writeHead(204)
      res.end()
      return
    }

    if (!checkRateLimit(req)) {
      log(req, 429)
      sendJson(res, 429, { error: 'Too many requests' })
      return
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

    if (url.pathname === '/health') {
      log(req, 200)
      sendJson(res, 200, { ok: true, name: 'devlog-mcp-server', version: '0.1.0' })
      return
    }

    const restPaths = ['/docs', '/setup.sh', '/projects', '/logs']
    const isRestPath = restPaths.some((p) => url.pathname === p) || url.pathname.startsWith('/projects/') || url.pathname.startsWith('/logs/')
    if (isRestPath) {
      setCors(res)
      await handleRest(req, res, url.pathname)
      log(req, res.statusCode)
      return
    }

    if (url.pathname === '/mcp') {
      if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) {
        log(req, 405)
        sendJson(res, 405, { error: 'Method not allowed' })
        return
      }
      await handleMcp(req, res)
      log(req, res.statusCode)
      return
    }

    log(req, 404)
    sendJson(res, 404, { error: 'Not found', endpoints: ALL_ENDPOINTS })
  })().catch((error) => {
    const status = getHttpStatus(error)
    if (status >= 500) console.error('[devLog MCP] request error:', error)
    else console.warn('[devLog MCP] request rejected:', getErrorMessage(error))
    if (!res.headersSent) sendJson(res, status, { error: getErrorMessage(error) })
    else res.end()
  })
})

// ── startup validation ────────────────────────────────────────────────────
async function validateStartup(): Promise<void> {
  const { error } = await supabase.from('agent_tokens').select('id').limit(1)
  if (error) throw new Error(`Supabase connection failed: ${error.message}`)
  console.log('[devLog MCP] Supabase connection OK')
}

// ── graceful shutdown ─────────────────────────────────────────────────────
function shutdown(signal: string): void {
  console.log(`[devLog MCP] ${signal} received — shutting down`)
  server.close(() => {
    console.log('[devLog MCP] Server closed')
    process.exit(0)
  })
  setTimeout(() => { console.error('[devLog MCP] Forced exit'); process.exit(1) }, 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

process.on('uncaughtException', (err) => {
  console.error('[devLog MCP] Uncaught exception:', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  console.error('[devLog MCP] Unhandled rejection:', reason)
  process.exit(1)
})

// ── start ─────────────────────────────────────────────────────────────────
try {
  await validateStartup()
  server.listen(port, host, () => {
    console.log(`[devLog MCP] listening on http://${host}:${port}`)
    console.log(`[devLog MCP] endpoints: ${ALL_ENDPOINTS.join('  ')}`)
  })
} catch (err) {
  console.error('[devLog MCP] Failed to start:', err)
  process.exit(1)
}
