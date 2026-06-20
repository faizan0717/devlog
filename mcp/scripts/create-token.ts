#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { generateAgentToken, hashAgentToken } from '../src/crypto.js'

type Args = Record<string, string | boolean>

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i]
    if (!item.startsWith('--')) continue
    const key = item.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = next
      i++
    }
  }
  return args
}

function required(args: Args, key: string): string {
  const value = args[key]
  if (!value || typeof value !== 'string') throw new Error(`Missing --${key}`)
  return value
}

const args = parseArgs(process.argv.slice(2))

const supabaseUrl = process.env.DEVLOG_SUPABASE_URL
const serviceRoleKey = process.env.DEVLOG_SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl) throw new Error('Missing DEVLOG_SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing DEVLOG_SUPABASE_SERVICE_ROLE_KEY')

const ownerId = required(args, 'owner-id')
const name = typeof args.name === 'string' ? args.name : 'Local MCP agent'
const scopes = typeof args.scopes === 'string'
  ? args.scopes.split(',').map((s) => s.trim()).filter(Boolean)
  : ['read_projects', 'read_logs', 'create_log']
const allowedProjectIds = typeof args.projects === 'string'
  ? args.projects.split(',').map((s) => s.trim()).filter(Boolean)
  : null
const expiresAt = typeof args['expires-at'] === 'string' ? args['expires-at'] : null

const token = generateAgentToken()
const tokenHash = hashAgentToken(token)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase
  .from('agent_tokens')
  .insert({
    owner_id: ownerId,
    name,
    token_hash: tokenHash,
    scopes,
    allowed_project_ids: allowedProjectIds,
    expires_at: expiresAt,
  })
  .select('id, owner_id, name, scopes, allowed_project_ids, expires_at, created_at')
  .single()

if (error) throw new Error(`Failed to create token: ${error.message}`)

console.log('\nCreated devLog agent token. Copy it now; it is not stored in plaintext.\n')
console.log(`Token: ${token}`)
console.log('\nDatabase row:')
console.log(JSON.stringify(data, null, 2))
console.log('\nSuggested MCP env:')
console.log(`DEVLOG_AGENT_TOKEN=${token}`)
