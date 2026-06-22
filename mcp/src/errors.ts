export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function getHttpStatus(error: unknown): number {
  if (error instanceof HttpError) return error.status
  if (error instanceof SyntaxError) return 400
  return 500
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Internal server error'
}
