import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Trash2, Eye, Pen, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import { VisibilitySelector } from '@/features/projects/components/VisibilitySelector'
import { MoodSelector } from './MoodSelector'
import { MediaUpload } from './MediaUpload'
import { MediaGallery } from './MediaGallery'
import { useLogEditor } from '../hooks/useLogEditor'
import type { Log } from '@/types'

interface LogEditorProps {
  projectId: string
  userId: string
  logId: string | null
  initialLog?: Log | null
}

export function LogEditor({ projectId, userId, logId, initialLog }: LogEditorProps) {
  const navigate = useNavigate()
  const [preview, setPreview] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const editor = useLogEditor({ logId, projectId, userId, initialLog })

  function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      setTimeout(() => setDeleteConfirm(false), 3000)
      return
    }
    editor.deleteLog()
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-paper/95 backdrop-blur-sm px-8 h-12 shrink-0">

        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-ink-tertiary hover:text-ink-primary transition-colors shrink-0"
        >
          <ArrowLeft size={15} />
          <span className="text-[13px]">Back</span>
        </button>

        <div className="w-px h-4 bg-border" />

        {/* Autosave status */}
        <div className="flex items-center h-5 min-w-[56px]">
          <AnimatePresence mode="wait">
            {editor.saving && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[11px] text-ink-disabled"
              >
                <Loader2 size={11} className="animate-spin" />
                Saving…
              </motion.span>
            )}
            {!editor.saving && editor.savedAt && (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[11px] text-mood-shipped"
              >
                <CheckCheck size={11} />
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* Write / Preview toggle */}
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-all duration-150 ${
              !preview ? 'bg-white text-ink-primary shadow-sm' : 'text-ink-disabled hover:text-ink-tertiary'
            }`}
          >
            <Pen size={11} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-all duration-150 ${
              preview ? 'bg-white text-ink-primary shadow-sm' : 'text-ink-disabled hover:text-ink-tertiary'
            }`}
          >
            <Eye size={11} />
            Preview
          </button>
        </div>

        {logId && (
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/logs/${logId}/preview`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] text-ink-tertiary hover:text-ink-secondary hover:border-gray-300 transition-colors"
          >
            <ExternalLink size={12} />
            View
          </button>
        )}

        {editor.isNew && (
          <button
            type="button"
            onClick={editor.publish}
            disabled={editor.publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editor.publishing && <Loader2 size={12} className="animate-spin" />}
            {editor.publishing ? 'Saving…' : 'Save'}
          </button>
        )}

        {logId && (
          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-colors ${
              deleteConfirm
                ? 'border-red-200 bg-red-50 text-danger'
                : 'border-border text-ink-disabled hover:border-red-200 hover:text-danger'
            }`}
          >
            <Trash2 size={12} />
            {deleteConfirm ? 'Confirm?' : 'Delete'}
          </button>
        )}
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 min-h-0 divide-x divide-border">

        {/* Left — title + content */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto px-8 py-8">
          <input
            value={editor.title}
            onChange={(e) => editor.handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent text-ink-primary placeholder:text-ink-disabled outline-none border-none mb-5"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em' }}
          />

          <div className="h-px bg-border mb-6" />

          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="write"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <textarea
                  value={editor.content}
                  onChange={(e) => editor.handleContentChange(e.target.value)}
                  placeholder="Start writing… markdown is supported."
                  className="w-full min-h-[60vh] bg-transparent text-[14px] text-ink-primary placeholder:text-ink-disabled outline-none border-none resize-none font-mono leading-relaxed"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="min-h-[60vh]"
              >
                {editor.content ? (
                  <div className="prose prose-sm max-w-none prose-p:text-ink-secondary prose-headings:text-ink-primary prose-a:text-accent prose-code:text-accent-dark prose-pre:bg-gray-50 prose-pre:border prose-pre:border-border prose-blockquote:border-l-accent prose-blockquote:text-ink-secondary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{editor.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[14px] text-ink-disabled italic">Nothing to preview yet.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* Right — metadata + media */}
        <div className="w-[280px] shrink-0 overflow-y-auto px-6 py-8 flex flex-col gap-6 bg-chalk">

          {/* Mood */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled mb-3">Mood</p>
            <MoodSelector value={editor.mood} onChange={editor.handleMoodChange} />
          </div>

          <div className="h-px bg-border" />

          {/* Visibility */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled mb-3">Visibility</p>
            <VisibilitySelector value={editor.visibility} onChange={editor.handleVisibilityChange} />
          </div>

          <div className="h-px bg-border" />

          {/* Media */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">Media</p>
            <MediaGallery media={editor.media} onRemove={editor.removeMedia} />
            <MediaUpload
              onUpload={editor.uploadMedia}
              uploadingCount={editor.uploadingCount}
              disabled={editor.isNew}
            />
            {editor.isNew && (
              <p className="text-[11px] text-ink-disabled leading-relaxed">
                Save the entry first to enable media uploads.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
