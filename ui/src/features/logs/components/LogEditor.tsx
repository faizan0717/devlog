import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Trash2, Eye, Pen, CheckCheck, Loader2, Save } from 'lucide-react'
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-3xl mx-auto pb-16">
      {/* Toolbar */}
      <div className="flex items-center gap-3 py-4 mb-2 sticky top-0 z-20 bg-surface-950/80 backdrop-blur-sm border-b border-surface-800/50">
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-ink-tertiary hover:text-ink-primary transition-colors duration-150 text-body"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Save indicator (existing logs only) */}
        {!editor.isNew && (
          <div className="flex items-center gap-1.5 ml-2">
            <AnimatePresence mode="wait">
              {editor.saving && (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-caption text-ink-tertiary"
                >
                  <Loader2 size={12} className="animate-spin" />
                  Saving…
                </motion.span>
              )}
              {!editor.saving && editor.savedAt && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-caption text-success"
                >
                  <CheckCheck size={12} />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex-1" />

        {/* Save button (new logs only) */}
        {editor.isNew && (
          <button
            type="button"
            onClick={editor.publish}
            disabled={editor.publishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-glass text-caption font-medium transition-all duration-150 border border-accent/60 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editor.publishing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            {editor.publishing ? 'Saving…' : 'Save'}
          </button>
        )}

        {/* Write / Preview toggle */}
        <div className="flex items-center gap-1 rounded-glass bg-surface-900 border border-surface-700 p-0.5">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-caption transition-all duration-150 ${
              !preview ? 'bg-surface-700 text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            <Pen size={12} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-caption transition-all duration-150 ${
              preview ? 'bg-surface-700 text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            <Eye size={12} />
            Preview
          </button>
        </div>

        {/* Delete */}
        {logId && (
          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-glass text-caption transition-all duration-150 border ${
              deleteConfirm
                ? 'border-danger/50 bg-danger/10 text-danger'
                : 'border-surface-700 text-ink-tertiary hover:border-danger/40 hover:text-danger'
            }`}
          >
            <Trash2 size={13} />
            {deleteConfirm ? 'Confirm?' : 'Delete'}
          </button>
        )}
      </div>

      {/* Title */}
      <input
        value={editor.title}
        onChange={(e) => editor.handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent text-display text-ink-primary placeholder:text-ink-disabled outline-none border-none py-4 resize-none"
        style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: '1.2', fontWeight: 700 }}
      />

      {/* Mood selector */}
      <div className="mb-6">
        <MoodSelector value={editor.mood} onChange={editor.handleMoodChange} />
      </div>

      {/* Visibility */}
      <div className="mb-6">
        <p className="text-label uppercase text-ink-tertiary tracking-wider mb-2">Visibility</p>
        <VisibilitySelector
          value={editor.visibility}
          onChange={editor.handleVisibilityChange}
        />
      </div>

      {/* Editor / Preview area */}
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="write"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1"
          >
            <textarea
              value={editor.content}
              onChange={(e) => editor.handleContentChange(e.target.value)}
              placeholder="Start writing… markdown is supported."
              className="w-full min-h-[40vh] bg-transparent text-body text-ink-primary placeholder:text-ink-disabled outline-none border-none resize-none font-mono leading-relaxed"
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-[40vh]"
          >
            {editor.content ? (
              <div className="prose prose-invert prose-sm max-w-none prose-p:text-ink-secondary prose-headings:text-ink-primary prose-a:text-accent-light prose-code:text-accent-light prose-pre:bg-surface-900 prose-pre:border prose-pre:border-surface-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editor.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-body text-ink-disabled italic">Nothing to preview yet.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="h-px bg-surface-800 my-6" />

      {/* Media */}
      <div className="space-y-4">
        <p className="text-label uppercase text-ink-tertiary tracking-wider">Media</p>
        <MediaGallery
          media={editor.media}
          onRemove={editor.removeMedia}
        />
        <MediaUpload
          onUpload={editor.uploadMedia}
          uploadingCount={editor.uploadingCount}
          disabled={editor.isNew}
        />
      </div>
    </div>
  )
}
