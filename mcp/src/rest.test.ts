import { beforeAll, describe, expect, it } from 'vitest'

let rest: typeof import('./rest.js')

beforeAll(async () => {
  process.env.DEVLOG_SUPABASE_URL = process.env.DEVLOG_SUPABASE_URL ?? 'http://127.0.0.1:54321'
  process.env.DEVLOG_SUPABASE_SERVICE_ROLE_KEY = process.env.DEVLOG_SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'
  rest = await import('./rest.js')
})

describe('REST validation helpers', () => {
  it('trims strings and enforces required/max length contracts', () => {
    expect(rest.validateStringField('  Ship it  ', 'title', 20, true)).toBe('Ship it')
    expect(rest.validateStringField('', 'description', 20)).toBeNull()
    expect(() => rest.validateStringField('', 'title', 20, true)).toThrow('title is required')
    expect(() => rest.validateStringField('abcdef', 'title', 5)).toThrow('title must be at most 5 characters')
    expect(() => rest.validateStringField(123, 'title', 20)).toThrow('title must be a string')
  })

  it('validates enum fields with defaults', () => {
    const allowed = new Set(['private', 'public'])
    expect(rest.validateEnumField(undefined, 'visibility', allowed, 'private')).toBe('private')
    expect(rest.validateEnumField('public', 'visibility', allowed)).toBe('public')
    expect(() => rest.validateEnumField('shared', 'visibility', allowed)).toThrow('visibility must be one of: private, public')
  })

  it('validates plan statuses and normalizes legacy aliases', () => {
    expect(rest.validatePlanStatusField(undefined, 'status', new Set(['todo', 'in_queue', 'doing', 'verify', 'done']), 'todo')).toBe('todo')
    expect(rest.validatePlanStatusField('pending')).toBe('todo')
    expect(rest.validatePlanStatusField('in que')).toBe('in_queue')
    expect(rest.validatePlanStatusField('verify')).toBe('verify')
    expect(() => rest.validatePlanStatusField('blocked')).toThrow('status must be one of')
  })

  it('validates and normalizes tag arrays', () => {
    expect(rest.validateTags([' react ', '', 'supabase'])).toEqual(['react', 'supabase'])
    expect(rest.validateTags(undefined)).toEqual([])
    expect(() => rest.validateTags('react')).toThrow('tags must be an array')
    expect(() => rest.validateTags(Array.from({ length: 11 }, (_, i) => `tag-${i}`))).toThrow('tags must contain at most 10 items')
    expect(() => rest.validateTags(['ok', 42])).toThrow('tags must contain only strings')
  })

  it('validates date-only fields', () => {
    expect(rest.validateDateField('2026-06-27', 'target_date')).toBe('2026-06-27')
    expect(rest.validateDateField('', 'target_date')).toBeNull()
    expect(() => rest.validateDateField('06/27/2026', 'target_date')).toThrow('target_date must be YYYY-MM-DD')
  })
})

describe('withPlanRefs', () => {
  it('assigns stable milestone and todo plan refs from sorted rows', () => {
    const { milestones, todos } = rest.withPlanRefs(
      [{ id: 'm1' }, { id: 'm2' }],
      [{ id: 't1', milestone_id: 'm1' }, { id: 't2', milestone_id: 'm1' }, { id: 't3', milestone_id: 'm2' }],
    )

    expect(milestones.map((m) => m.plan_ref)).toEqual(['1.1', '1.2'])
    expect(todos.map((todo) => todo.plan_ref)).toEqual(['1.1.1', '1.1.2', '1.2.1'])
  })
})
