import { useRef, useState, DragEvent } from 'react'
import { ImagePlus, X, Upload } from 'lucide-react'
import { cn } from '@/utils'
import { Spinner } from '@/components/ui'

interface CoverUploadProps {
  value?: string | null
  onChange: (file: File | null) => void
  uploading?: boolean
  onRemove?: () => void
  disabled?: boolean
}

export function CoverUpload({
  value,
  onChange,
  uploading,
  onRemove,
  disabled,
}: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const displaySrc = preview ?? value

  function handleFile(file: File | null) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(file)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    onRemove?.()
  }

  if (displaySrc) {
    return (
      <div className="relative rounded-glass overflow-hidden aspect-[21/6] bg-surface-800 group">
        <img
          src={displaySrc}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-surface-950/0 group-hover:bg-surface-950/40 transition-colors duration-200" />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-950/60">
            <Spinner size="md" />
          </div>
        )}
        {!uploading && !disabled && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-glass bg-surface-900/90 backdrop-blur px-3 py-1.5 text-caption text-ink-secondary hover:text-ink-primary transition-colors border border-surface-700"
            >
              <Upload size={12} />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 rounded-glass bg-surface-900/90 backdrop-blur px-3 py-1.5 text-caption text-danger hover:text-danger/80 transition-colors border border-surface-700"
            >
              <X size={12} />
              Remove
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center rounded-glass border-2 border-dashed',
        'aspect-[21/6] cursor-pointer transition-all duration-150',
        dragging
          ? 'border-accent bg-accent-muted'
          : 'border-surface-700 bg-surface-800 hover:border-surface-600 hover:bg-surface-700/50',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <ImagePlus size={24} className="text-ink-tertiary mb-2" />
      <p className="text-body text-ink-secondary">Add a cover image</p>
      <p className="text-caption text-ink-tertiary mt-1">Drag and drop or click to upload</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
