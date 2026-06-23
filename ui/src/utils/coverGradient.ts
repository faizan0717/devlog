export const COVER_GRADIENTS = [
  { key: 'amber',   css: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fef08a 100%)' },
  { key: 'ocean',   css: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%)' },
  { key: 'forest',  css: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 50%, #ccfbf1 100%)' },
  { key: 'rose',    css: 'linear-gradient(135deg, #ffe4e6 0%, #fce7f3 50%, #fae8ff 100%)' },
  { key: 'slate',   css: 'linear-gradient(135deg, #f1f5f9 0%, #f3f4f6 50%, #f4f4f5 100%)' },
  { key: 'purple',  css: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #e0e7ff 100%)' },
  { key: 'sunset',  css: 'linear-gradient(135deg, #fed7aa 0%, #fecaca 50%, #fce7f3 100%)' },
  { key: 'sky',     css: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #cffafe 100%)' },
  { key: 'mint',    css: 'linear-gradient(135deg, #d1fae5 0%, #ccfbf1 50%, #cffafe 100%)' },
  { key: 'dusk',    css: 'linear-gradient(135deg, #fae8ff 0%, #ede9fe 50%, #dbeafe 100%)' },
  { key: 'gold',    css: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 50%, #fed7aa 100%)' },
  { key: 'night',   css: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' },
]

const GRADIENT_MAP = Object.fromEntries(COVER_GRADIENTS.map((g) => [g.key, g.css]))

export function getCoverGradient(project: { id: string; cover_gradient?: string | null }): string {
  if (project.cover_gradient && GRADIENT_MAP[project.cover_gradient]) {
    return GRADIENT_MAP[project.cover_gradient]
  }
  // Deterministic fallback keyed by project id
  const idx = (project.id.charCodeAt(0) + project.id.charCodeAt(project.id.length - 1)) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx].css
}
