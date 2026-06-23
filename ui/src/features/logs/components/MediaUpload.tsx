import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { cn } from '@/utils'

interface MediaUploadProps {
  onUpload: (file: File) => Promise<void>
  uploadingCount: number
  disabled?: boolean
}

export function MediaUpload({ onUpload, uploadingCount, disabled }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((f) => onUpload(f))
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const busy = uploadingCount > 0

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-glass border border-dashed py-6 transition-all duration-200 cursor-pointer',
        dragging
          ? 'border-accent bg-blue-50'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white',
        (disabled || busy) && 'pointer-events-none opacity-60',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || busy}
      />

      {busy ? (
        <>
          <Loader2 size={20} className="text-ink-tertiary animate-spin" />
          <p className="text-caption text-ink-tertiary">
            Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}…
          </p>
        </>
      ) : (
        <>
          <ImagePlus size={20} className="text-ink-tertiary" />
          <p className="text-caption text-ink-tertiary">
            {dragging ? 'Drop to upload' : 'Drop images or videos, or click to browse'}
          </p>
        </>
      )}
    </div>
  )
}
