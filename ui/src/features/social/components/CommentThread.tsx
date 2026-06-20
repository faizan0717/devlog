import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Avatar, Spinner } from '@/components/ui'
import { formatDate } from '@/utils'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { useComments } from '../hooks/useComments'
import type { CommentWithProfile } from '@/types'

interface CommentItemProps {
  comment: CommentWithProfile
  isOwn: boolean
  onDelete: () => void
  onEdit: (content: string) => Promise<void>
}

function CommentItem({ comment, isOwn, onDelete, onEdit }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!draft.trim() || draft === comment.content) { setEditing(false); return }
    setSaving(true)
    try { await onEdit(draft.trim()) } finally { setSaving(false); setEditing(false) }
  }

  return (
    <div className="flex gap-3">
      <Avatar
        src={comment.profiles?.avatar_url}
        name={comment.profiles?.username}
        size="sm"
        className="flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-caption font-medium text-ink-primary">
            @{comment.profiles?.username}
          </span>
          <span className="text-label text-ink-disabled">
            {formatDate(comment.created_at, 'relative')}
          </span>
          {isOwn && !editing && (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setDraft(comment.content); setEditing(true) }}
                className="text-label text-ink-tertiary hover:text-ink-secondary transition-colors px-1"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-label text-ink-tertiary hover:text-danger transition-colors px-1"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full glass rounded-glass text-body text-ink-primary px-3 py-2 outline-none border border-accent/40 resize-none min-h-[60px]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-caption text-accent-light hover:text-accent transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-caption text-ink-tertiary hover:text-ink-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-body text-ink-secondary whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  )
}

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  userAvatar?: string | null
  username?: string
}

function CommentInput({ onSubmit, userAvatar, username }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar src={userAvatar} name={username} size="sm" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Leave a comment… (⌘+Enter to submit)"
          className="w-full glass rounded-glass text-body text-ink-primary placeholder:text-ink-disabled px-3 py-2 outline-none border border-transparent focus:border-accent/40 resize-none min-h-[72px] transition-all duration-200"
        />
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="px-4 py-1.5 rounded-glass text-caption font-medium bg-accent/15 text-accent-light border border-accent/30 hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading ? 'Posting…' : 'Post comment'}
        </button>
      </div>
    </form>
  )
}

interface CommentThreadProps {
  logId: string
  logOwnerId: string
  projectId: string
  currentUserId?: string
  currentUserAvatar?: string | null
  currentUsername?: string
}

export function CommentThread({
  logId,
  logOwnerId,
  projectId,
  currentUserId,
  currentUserAvatar,
  currentUsername,
}: CommentThreadProps) {
  const { data: comments, loading, add, edit, remove } = useComments(logId)
  const count = comments?.length ?? 0

  return (
    <div className="space-y-5">
      <h3 className="text-title text-ink-primary flex items-center gap-2">
        <MessageCircle size={18} className="text-ink-tertiary" />
        Comments {count > 0 && <span className="text-ink-tertiary">({count})</span>}
      </h3>

      {loading && (
        <div className="flex justify-center py-6">
          <Spinner size="md" />
        </div>
      )}

      {!loading && comments && comments.length === 0 && (
        <p className="text-body text-ink-tertiary py-4">
          Be the first to leave a comment.
        </p>
      )}

      {!loading && comments && comments.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-5"
        >
          {comments.map((c, i) => (
            <motion.div key={c.id} variants={fadeUp} custom={i}>
              <CommentItem
                comment={c}
                isOwn={currentUserId === c.user_id}
                onDelete={() => remove(c.id)}
                onEdit={(content) => edit(c.id, content)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {currentUserId && (
        <CommentInput
          onSubmit={(content) => add(content, currentUserId, logOwnerId, projectId)}
          userAvatar={currentUserAvatar}
          username={currentUsername}
        />
      )}

      {!currentUserId && (
        <p className="text-body text-ink-tertiary">
          <a href="/login" className="text-accent-light hover:underline">Sign in</a> to leave a comment.
        </p>
      )}
    </div>
  )
}
