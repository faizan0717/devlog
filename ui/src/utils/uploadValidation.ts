type UploadKind = 'avatar' | 'projectCover' | 'logMedia'

type UploadRule = {
  label: string
  maxBytes: number
  allowedMimeTypes: readonly string[]
  allowedExtensions: readonly string[]
}

export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  avatar: {
    label: 'Avatar',
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  projectCover: {
    label: 'Project cover',
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  logMedia: {
    label: 'Log media',
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'],
  },
}

export const UPLOAD_ACCEPT = {
  avatar: 'image/jpeg,image/png,image/gif,image/webp',
  projectCover: 'image/jpeg,image/png,image/gif,image/webp',
  logMedia: 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime',
} satisfies Record<UploadKind, string>

export const UPLOAD_HELP_TEXT = {
  avatar: 'JPG, PNG, GIF, or WebP. Max 5 MB.',
  projectCover: 'JPG, PNG, GIF, or WebP. Max 10 MB.',
  logMedia: 'Images or videos: JPG, PNG, GIF, WebP, MP4, WebM, or MOV. Max 50 MB each.',
} satisfies Record<UploadKind, string>

function extensionFor(file: File): string {
  return (file.name.split('.').pop() ?? '').toLowerCase()
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`
}

export function validateUploadFile(file: File, kind: UploadKind): void {
  const rule = UPLOAD_RULES[kind]
  if (file.size > rule.maxBytes) {
    throw new Error(`${rule.label} is too large — max ${formatBytes(rule.maxBytes)}.`)
  }

  const ext = extensionFor(file)
  if (!rule.allowedExtensions.includes(ext)) {
    throw new Error(`${rule.label} file extension is not allowed. Use ${rule.allowedExtensions.join(', ')}.`)
  }

  if (!file.type || !rule.allowedMimeTypes.includes(file.type)) {
    throw new Error(`${rule.label} file type is not allowed. ${UPLOAD_HELP_TEXT[kind]}`)
  }
}

export function safeUploadExtension(file: File, kind: UploadKind): string {
  validateUploadFile(file, kind)
  const ext = extensionFor(file)
  if (ext === 'jpeg') return 'jpg'
  if (file.type === 'video/quicktime') return 'mov'
  return ext
}
