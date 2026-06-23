import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
  max?: number
}

export function TagInput({ tags, onChange, disabled, max = 10 }: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 20)
    if (!tag || tags.includes(tag) || tags.length >= max) return
    onChange([...tags, tag])
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Tags</label>
      <div
        className={cn(
          'min-h-[44px] flex flex-wrap gap-1.5 rounded-lg border border-border bg-gray-50 px-3 py-2 cursor-text',
          'transition-colors duration-150 focus-within:border-accent/60 focus-within:bg-white',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence initial={false}>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[12px] text-accent"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                  className="hover:text-accent transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>
        {tags.length < max && !disabled && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(input)}
            placeholder={tags.length === 0 ? 'Add tags…' : ''}
            className="flex-1 min-w-[80px] bg-transparent text-caption text-ink-primary placeholder:text-ink-tertiary outline-none"
          />
        )}
      </div>
      <p className="text-caption text-ink-tertiary">
        Press Enter or comma to add · {max - tags.length} remaining
      </p>
    </div>
  )
}
