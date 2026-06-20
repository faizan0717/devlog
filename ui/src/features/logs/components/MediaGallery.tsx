import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils'
import type { LogMedia } from '@/types'

interface MediaGalleryProps {
  media: LogMedia[]
  onRemove?: (url: string) => void
  readonly?: boolean
}

export function MediaGallery({ media, onRemove, readonly }: MediaGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
    }
    if (lightbox) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  if (media.length === 0) return null

  return (
    <>
      <div
        className={cn(
          'grid gap-2',
          media.length === 1 && 'grid-cols-1',
          media.length === 2 && 'grid-cols-2',
          media.length >= 3 && 'grid-cols-3',
        )}
      >
        {media.map((item) => (
          <div key={item.url} className="group relative rounded-glass overflow-hidden aspect-video bg-surface-900">
            {item.type === 'video' ? (
              <video
                src={item.url}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
                onClick={() => setLightbox(item.url)}
              />
            )}

            {!readonly && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.url)}
                className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-surface-950/80 border border-surface-700 text-ink-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-danger hover:border-danger/50"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-surface-900/80 border border-surface-700 text-ink-secondary hover:text-ink-primary transition-colors"
          >
            <X size={16} />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-glass object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
