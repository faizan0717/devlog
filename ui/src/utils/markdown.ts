export function normalizeMarkdownLineBreaks(value: string): string {
  return value.replace(/\\n/g, '\n')
}
