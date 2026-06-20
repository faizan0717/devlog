import { createHash, randomBytes } from 'node:crypto'

export function hashAgentToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function generateAgentToken(): string {
  return `dl_agent_${randomBytes(32).toString('base64url')}`
}
