import { AsyncLocalStorage } from 'node:async_hooks'

const tokenStorage = new AsyncLocalStorage<string>()

export function runWithAgentToken<T>(token: string, fn: () => T): T {
  return tokenStorage.run(token, fn)
}

export function getRequestAgentToken(): string | undefined {
  return tokenStorage.getStore()
}
