import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Globe, Link2, Lock, Users, UserPlus, BookOpen, Plus, Check, Upload,
  Pencil, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react'
import { Button, Avatar, Spinner, Modal } from '@/components/ui'
import { useProject } from '@/features/projects/hooks/useProject'
import { useLogs } from '@/features/logs/hooks/useLogs'
import { usePlan } from '@/features/plan/hooks/usePlan'
import { useAuthStore } from '@/stores/authStore'
import { CollaboratorRow } from '@/features/projects/components/CollaboratorRow'
import { CollaboratorInviteModal } from '@/features/projects/components/CollaboratorInviteModal'
import { DeleteProjectModal } from '@/features/projects/components/DeleteProjectModal'
import { GradientPicker } from '@/features/projects/components/GradientPicker'
import { TagInput } from '@/features/projects/components/TagInput'
import { VisibilitySelector } from '@/features/projects/components/VisibilitySelector'
import { projectsService } from '@/services/projects.service'
import { planService } from '@/services/plan.service'
import type { Log, PlanMilestone, PlanMilestoneWithTodos, PlanStatus, PlanTodo, PlanTodoWithSources, Visibility } from '@/types'
import { cn, formatDate } from '@/utils'
import { COVER_GRADIENTS, getCoverGradient } from '@/utils/coverGradient'

// ── Share modal ───────────────────────────────────────────────────────────────

function ShareModal({ open, onClose, projectTitle, projectId }: {
  open: boolean
  onClose: () => void
  projectTitle: string
  projectId: string
}) {
  const shareUrl = `${window.location.origin}/p/${projectId}`
  const text = encodeURIComponent(`Check out "${projectTitle}" on devLog — a public build journal where makers log their progress. ${shareUrl}`)
  const linkedinText = encodeURIComponent(`Check out "${projectTitle}" on devLog`)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => toast.success('Link copied'))
  }

  const links = [
    {
      label: 'WhatsApp',
      color: '#25D366',
      href: `https://wa.me/?text=${text}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.549 4.099 1.505 5.823L.057 23.945a.75.75 0 0 0 .918.919l6.183-1.43A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.71 9.71 0 0 1-4.947-1.351l-.355-.21-3.67.849.872-3.596-.229-.368A9.71 9.71 0 0 1 2.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
      ),
    },
    {
      label: 'X / Twitter',
      color: '#000',
      href: `https://twitter.com/intent/tweet?text=${text}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${linkedinText}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Share project" className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2.5">
          <span className="flex-1 text-[13px] text-ink-secondary truncate font-mono">{shareUrl}</span>
          <button
            type="button"
            onClick={copyLink}
            className="text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors shrink-0"
          >
            Copy
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-[13px] font-medium text-ink-secondary hover:bg-gray-50 transition-colors"
              style={{ color: l.color }}
            >
              {l.icon}
              <span className="text-ink-secondary">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </Modal>
  )
}

// ── Mood helpers ──────────────────────────────────────────────────────────────

const MOOD_DOT: Record<string, string> = {
  building:   'bg-mood-building',
  shipped:    'bg-mood-shipped',
  stuck:      'bg-mood-stuck',
  learning:   'bg-mood-learning',
  inspired:   'bg-mood-inspired',
  reflecting: 'bg-mood-reflecting',
}

// Brand guide: rgba tints derived from each mood color, not generic Tailwind palette
const MOOD_BADGE_STYLE: Record<string, React.CSSProperties> = {
  building:   { color: '#f97316', background: 'rgba(249,115,22,0.08)',   borderColor: 'rgba(249,115,22,0.2)'   },
  shipped:    { color: '#22c55e', background: 'rgba(34,197,94,0.08)',    borderColor: 'rgba(34,197,94,0.2)'    },
  stuck:      { color: '#ef4444', background: 'rgba(239,68,68,0.08)',    borderColor: 'rgba(239,68,68,0.2)'    },
  learning:   { color: '#60a5fa', background: 'rgba(96,165,250,0.08)',   borderColor: 'rgba(96,165,250,0.2)'   },
  inspired:   { color: '#c084fc', background: 'rgba(192,132,252,0.08)', borderColor: 'rgba(192,132,252,0.2)'  },
  reflecting: { color: '#94a3b8', background: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.2)'  },
}

const MOOD_PULSE: Record<string, string> = {
  building:   'animate-pulse-slow',
  shipped:    '',
  stuck:      '',
  learning:   '',
  inspired:   '',
  reflecting: '',
}

// ── Visibility meta ───────────────────────────────────────────────────────────

const VIS_META: Record<Visibility, { icon: React.ElementType; label: string }> = {
  private:  { icon: Lock,  label: 'Private'  },
  public:   { icon: Globe, label: 'Public'   },
  unlisted: { icon: Link2, label: 'Unlisted' },
  shared:   { icon: Users, label: 'Shared'   },
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'logs' | 'plan' | 'settings'

// ── Content strip helper ──────────────────────────────────────────────────────

function stripMd(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/>\s/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MoodDot({ mood, pulse }: { mood: string | null; pulse?: boolean }) {
  const base = mood ? MOOD_DOT[mood] : 'bg-gray-300'
  return (
    <div
      className={cn(
        'w-2.5 h-2.5 rounded-full flex-shrink-0',
        base,
        pulse && mood === 'building' ? MOOD_PULSE[mood] : '',
      )}
    />
  )
}

function MoodBadge({ mood }: { mood: string | null }) {
  if (!mood) return null
  const style = MOOD_BADGE_STYLE[mood] ?? { color: '#9ca3af', background: 'rgba(156,163,175,0.08)', borderColor: 'rgba(156,163,175,0.2)' }
  return (
    <span className="font-mono text-[10px] font-medium border rounded-[4px] px-2 py-[1px]" style={style}>
      {mood}
    </span>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function ProjectTimeline({
  logs,
  projectId,
  loading,
  canEdit,
}: {
  logs: Log[]
  projectId: string
  loading: boolean
  canEdit: boolean
}) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-[680px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-px flex-1 bg-gray-100 mt-1.5" />
            </div>
            <div className="flex-1 pb-7">
              <div className="h-3 bg-gray-100 rounded animate-pulse mb-2 w-32" />
              <div className="h-4 bg-gray-100 rounded animate-pulse mb-1 w-full" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-24 gap-4 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 border border-border flex items-center justify-center">
          <BookOpen size={20} className="text-ink-disabled" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-ink-secondary mb-1">Begin your archive.</p>
          <p className="text-[14px] text-ink-tertiary max-w-xs">
            Every great project starts with a first entry.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/projects/${projectId}/logs/new`)}>
            <Plus size={14} className="mr-1.5" />
            Write first log
          </Button>
        )}
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col max-w-[680px]">
      {logs.map((log, i) => {
        const isLast = i === logs.length - 1
        const preview = log.content ? stripMd(log.content).slice(0, 220) : null
        return (
          <div
            key={log.id}
            className="flex gap-4"
            style={{ paddingBottom: isLast ? 0 : 28 }}
          >
            {/* Left: dot + connector */}
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
              <MoodDot mood={log.mood} pulse={i === 0} />
              {!isLast && (
                <div className="w-px flex-1 bg-border mt-1.5" />
              )}
            </div>

            {/* Right: content */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-[11px] text-ink-disabled">
                  {formatDate(log.created_at, 'long')}
                </span>
                <MoodBadge mood={log.mood} />
                <span className="font-mono text-[10px] text-ink-disabled ml-auto">
                  {formatDate(log.created_at, 'relative')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}/logs/${log.id}/preview`)}
                className="w-full text-left group"
              >
                {log.title && (
                  <h3 className="text-[14px] font-semibold text-ink-primary mb-1 group-hover:text-accent transition-colors line-clamp-2">
                    {log.title}
                  </h3>
                )}
                {preview && (
                  <p className="text-[14px] text-ink-secondary leading-relaxed line-clamp-3">
                    {preview}
                  </p>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Plan Tab ──────────────────────────────────────────────────────────────────

const PLAN_STATUS_META = {
  pending: {
    label: 'pending',
    dotClass: 'bg-transparent border-[1.5px] border-gray-300',
    badgeStyle: { color: '#9ca3af', background: '#f3f4f6' } as React.CSSProperties,
    textClass: 'text-ink-disabled',
    opacity: 'opacity-70',
  },
  doing: {
    label: 'doing',
    dotClass: 'bg-mood-building animate-pulse-slow',
    badgeStyle: { color: '#f97316', background: 'rgba(249,115,22,0.1)' } as React.CSSProperties,
    textClass: 'text-mood-building',
    opacity: '',
  },
  done: {
    label: 'done',
    dotClass: 'bg-mood-shipped',
    badgeStyle: { color: '#22c55e', background: 'rgba(34,197,94,0.1)' } as React.CSSProperties,
    textClass: 'text-mood-shipped',
    opacity: 'opacity-60',
  },
} as const

function TodoCheck({ done }: { done: boolean }) {
  return (
    <div
      className={cn(
        'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center',
        done ? 'bg-mood-shipped' : 'border-[1.5px] border-gray-300',
      )}
    >
      {done && <Check size={9} strokeWidth={2.5} className="text-white" />}
    </div>
  )
}

function formatTargetDate(targetDate: string | null) {
  if (!targetDate) return 'No target date'
  return formatDate(targetDate)
}

function statusCompletedAt(status: PlanStatus, previousCompletedAt?: string | null) {
  if (status === 'done') return previousCompletedAt ?? new Date().toISOString()
  return null
}

function userSourceLabel(userId: string | null, profile: { username?: string | null } | null | undefined, currentUserId?: string) {
  if (!userId) return null
  if (userId === currentUserId) return 'you'
  if (profile?.username) return `@${profile.username}`
  return 'teammate'
}

function agentSourceLabel(agent: { name?: string | null } | null | undefined) {
  return agent?.name ? `agent ${agent.name}` : 'agent'
}

function addedSourceLabel(todo: PlanTodoWithSources, currentUserId?: string) {
  if (todo.created_by_agent_token_id) return `added by ${agentSourceLabel(todo.created_by_agent)}`
  const userLabel = userSourceLabel(todo.created_by, todo.created_by_profile, currentUserId)
  return userLabel ? `added by ${userLabel}` : 'added manually'
}

function completionSourceLabel(todo: PlanTodoWithSources, currentUserId?: string) {
  if (todo.status !== 'done') return null
  if (todo.completed_by_agent_token_id) return `completed by ${agentSourceLabel(todo.completed_by_agent)}`
  const userLabel = userSourceLabel(todo.completed_by, todo.completed_by_profile, currentUserId)
  return userLabel ? `completed by ${userLabel}` : 'completed'
}

function planMilestoneRef(milestoneIndex: number) {
  return `1.${milestoneIndex + 1}`
}

function planTodoRef(milestoneIndex: number, todoIndex: number) {
  return `${planMilestoneRef(milestoneIndex)}.${todoIndex + 1}`
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">{children}</label>
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 outline-none focus:border-accent/60 focus:bg-white transition-colors disabled:opacity-60 placeholder:text-ink-disabled',
        props.className,
      )}
    />
  )
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])
  useEffect(() => { resize() }, [props.value, resize])
  return (
    <textarea
      ref={ref}
      {...props}
      onInput={(e) => { resize(); props.onInput?.(e) }}
      className={cn(
        'w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 py-2.5 outline-none focus:border-accent/60 focus:bg-white transition-colors resize-none disabled:opacity-60 placeholder:text-ink-disabled max-h-64 overflow-y-auto',
        props.className,
      )}
    />
  )
}

function DescriptionEditor({
  value,
  onChange,
  disabled,
  placeholder = 'Add a description… markdown is supported.',
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden focus-within:border-accent/60 transition-colors">
      <div className="flex items-center gap-0 border-b border-border bg-gray-50 px-1 py-1">
        {(['write', 'preview'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'px-3 py-1 rounded text-[12px] font-medium capitalize transition-colors',
              mode === m
                ? 'bg-white text-ink-primary shadow-sm border border-border'
                : 'text-ink-disabled hover:text-ink-secondary',
            )}
          >
            {m}
          </button>
        ))}
      </div>
      {mode === 'write' ? (
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={5}
          className="rounded-none border-0 bg-white focus:bg-white min-h-[120px]"
        />
      ) : (
        <div className="min-h-[120px] max-h-64 overflow-y-auto px-3.5 py-2.5 bg-white">
          {value.trim() ? (
            <div className="prose prose-sm max-w-none prose-p:text-ink-secondary prose-headings:text-ink-primary prose-a:text-accent prose-code:text-accent-dark prose-pre:bg-gray-50 prose-pre:border prose-pre:border-border prose-blockquote:border-l-accent prose-blockquote:text-ink-secondary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[14px] text-ink-disabled italic">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 outline-none focus:border-accent/60 focus:bg-white transition-colors disabled:opacity-60',
        props.className,
      )}
    />
  )
}

function MilestoneEditorModal({
  open,
  milestone,
  projectId,
  ownerId,
  userId,
  sortOrder,
  projectVisibility,
  onClose,
  onSaved,
}: {
  open: boolean
  milestone: PlanMilestone | null
  projectId: string
  ownerId: string
  userId: string | undefined
  sortOrder: number
  projectVisibility: Visibility
  onClose: () => void
  onSaved: (id?: string) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<PlanStatus>('pending')
  const [visibility, setVisibility] = useState<Visibility>(projectVisibility)
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(milestone?.title ?? '')
    setDescription(milestone?.description ?? '')
    setStatus(milestone?.status ?? 'pending')
    setVisibility(milestone?.visibility ?? projectVisibility)
    setTargetDate(milestone?.target_date ?? '')
  }, [open, milestone, projectVisibility])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      if (milestone) {
        await planService.updateMilestone(milestone.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          visibility,
          target_date: targetDate || null,
          completed_at: statusCompletedAt(status, milestone.completed_at),
        })
        toast.success('Milestone updated')
        onSaved(milestone.id)
      } else {
        const created = await planService.createMilestone({
          project_id: projectId,
          owner_id: ownerId,
          title: title.trim(),
          description: description.trim() || null,
          status,
          visibility,
          target_date: targetDate || null,
          sort_order: sortOrder,
          created_by: userId,
        })
        toast.success('Milestone added')
        onSaved(created.id)
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save milestone')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={milestone ? 'Edit milestone' : 'Add milestone'} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Title</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus disabled={saving} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Description</FieldLabel>
          <DescriptionEditor value={description} onChange={setDescription} disabled={saving} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Status</FieldLabel>
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)} disabled={saving}>
              <option value="pending">Pending</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </SelectInput>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Target date</FieldLabel>
            <TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} disabled={saving} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>Visibility</FieldLabel>
          <VisibilitySelector value={visibility} onChange={setVisibility} disabled={saving} />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{milestone ? 'Save changes' : 'Add milestone'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function TodoEditorModal({
  open,
  todo,
  milestones,
  selectedMilestone,
  ownerId,
  userId,
  sortOrder,
  projectVisibility,
  onClose,
  onSaved,
}: {
  open: boolean
  todo: PlanTodo | null
  milestones: PlanMilestoneWithTodos[]
  selectedMilestone: PlanMilestoneWithTodos
  ownerId: string
  userId: string | undefined
  sortOrder: number
  projectVisibility: Visibility
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<PlanStatus>('pending')
  const [visibility, setVisibility] = useState<Visibility>(projectVisibility)
  const [milestoneId, setMilestoneId] = useState(selectedMilestone.id)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(todo?.title ?? '')
    setDescription(todo?.description ?? '')
    setStatus(todo?.status ?? 'pending')
    setVisibility(todo?.visibility ?? projectVisibility)
    setMilestoneId(todo?.milestone_id ?? selectedMilestone.id)
  }, [open, todo, selectedMilestone.id, projectVisibility])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      if (todo) {
        await planService.updateTodo(todo.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          visibility,
          milestone_id: milestoneId,
          completed_at: statusCompletedAt(status, todo.completed_at),
          completed_by: status === 'done' ? todo.completed_by ?? userId : null,
        })
        toast.success('Todo updated')
      } else {
        await planService.createTodo({
          project_id: selectedMilestone.project_id,
          milestone_id: milestoneId,
          owner_id: ownerId,
          title: title.trim(),
          description: description.trim() || null,
          status,
          visibility,
          sort_order: sortOrder,
          created_by: userId,
        })
        toast.success('Todo added')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save todo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={todo ? 'Edit todo' : 'Add todo'} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Title</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus disabled={saving} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Description</FieldLabel>
          <DescriptionEditor value={description} onChange={setDescription} disabled={saving} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Status</FieldLabel>
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)} disabled={saving}>
              <option value="pending">Pending</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </SelectInput>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Milestone</FieldLabel>
            <SelectInput value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} disabled={saving}>
              {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </SelectInput>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>Visibility</FieldLabel>
          <VisibilitySelector value={visibility} onChange={setVisibility} disabled={saving} />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>{todo ? 'Save changes' : 'Add todo'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function PlanTab({
  milestones,
  loading,
  error,
  selectedId,
  projectId,
  ownerId,
  userId,
  canEdit,
  projectVisibility,
  onSelect,
  onRefresh,
}: {
  milestones: PlanMilestoneWithTodos[]
  loading: boolean
  error: string | null
  selectedId: string | null
  projectId: string
  ownerId: string
  userId: string | undefined
  canEdit: boolean
  projectVisibility: Visibility
  onSelect: (id: string) => void
  onRefresh: () => void
}) {
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<PlanMilestone | null>(null)
  const [todoModalOpen, setTodoModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<PlanTodo | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(236)
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  function startResize(e: ReactMouseEvent) {
    e.preventDefault()
    isResizing.current = true

    function onMouseMove(ev: MouseEvent) {
      if (!isResizing.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = Math.min(Math.max(ev.clientX - rect.left, 160), 420)
      setSidebarWidth(newWidth)
    }

    function onMouseUp() {
      isResizing.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) return <p className="text-[14px] text-danger">{error}</p>

  function openCreateMilestone() {
    setEditingMilestone(null)
    setMilestoneModalOpen(true)
  }

  function openEditMilestone(milestone: PlanMilestone) {
    setEditingMilestone(milestone)
    setMilestoneModalOpen(true)
  }

  function openCreateTodo() {
    setEditingTodo(null)
    setTodoModalOpen(true)
  }

  function openEditTodo(todo: PlanTodo) {
    setEditingTodo(todo)
    setTodoModalOpen(true)
  }

  async function deleteMilestone(milestone: PlanMilestoneWithTodos) {
    if (!window.confirm(`Delete "${milestone.title}" and its ${milestone.todos.length} todos?`)) return
    setMutatingId(milestone.id)
    try {
      await planService.deleteMilestone(milestone.id)
      toast.success('Milestone deleted')
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete milestone')
    } finally {
      setMutatingId(null)
    }
  }

  async function deleteTodo(todo: PlanTodo) {
    if (!window.confirm(`Delete "${todo.title}"?`)) return
    setMutatingId(todo.id)
    try {
      await planService.deleteTodo(todo.id)
      toast.success('Todo deleted')
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete todo')
    } finally {
      setMutatingId(null)
    }
  }

  async function updateMilestoneOrder(index: number, direction: -1 | 1) {
    const target = milestones[index]
    const swap = milestones[index + direction]
    if (!target || !swap) return
    setMutatingId(target.id)
    try {
      await Promise.all([
        planService.updateMilestone(target.id, { sort_order: index + direction }),
        planService.updateMilestone(swap.id, { sort_order: index }),
      ])
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder milestone')
    } finally {
      setMutatingId(null)
    }
  }

  async function updateTodoOrder(todos: PlanTodo[], index: number, direction: -1 | 1) {
    const target = todos[index]
    const swap = todos[index + direction]
    if (!target || !swap) return
    setMutatingId(target.id)
    try {
      await Promise.all([
        planService.updateTodo(target.id, { sort_order: index + direction }),
        planService.updateTodo(swap.id, { sort_order: index }),
      ])
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder todo')
    } finally {
      setMutatingId(null)
    }
  }

  async function toggleTodo(todo: PlanTodo) {
    const nextStatus: PlanStatus = todo.status === 'done' ? 'pending' : 'done'
    setMutatingId(todo.id)
    try {
      await planService.updateTodo(todo.id, {
        status: nextStatus,
        completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
        completed_by: nextStatus === 'done' ? userId : null,
      })
      toast.success(nextStatus === 'done' ? `Done — "${todo.title}" moved to completed` : `Reopened — "${todo.title}" moved back to open`)
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update todo')
    } finally {
      setMutatingId(null)
    }
  }

  if (milestones.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[360px] text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-50 border border-border flex items-center justify-center">
            <Check size={18} className="text-ink-disabled" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-ink-secondary mb-1">No milestones yet.</p>
            <p className="text-[14px] text-ink-tertiary max-w-xs mb-4">
              Add roadmap milestones to turn your project plan into visible progress.
            </p>
            {canEdit && <Button size="sm" onClick={openCreateMilestone}><Plus size={13} /> Add milestone</Button>}
          </div>
        </div>
        <MilestoneEditorModal
          open={milestoneModalOpen}
          milestone={editingMilestone}
          projectId={projectId}
          ownerId={ownerId}
          userId={userId}
          sortOrder={0}
          projectVisibility={projectVisibility}
          onClose={() => setMilestoneModalOpen(false)}
          onSaved={(id) => { if (id) onSelect(id); onRefresh() }}
        />
      </>
    )
  }

  const selected = milestones.find((m) => m.id === selectedId) ?? milestones[0]
  const selectedMilestoneIndex = Math.max(0, milestones.findIndex((m) => m.id === selected.id))
  const shipped = milestones.filter((m) => m.status === 'done').length
  const total = milestones.length
  const totalProgress = Math.round((shipped / total) * 100)
  const todos = selected.todos ?? []
  const doneTodos = todos.filter((todo) => todo.status === 'done').length
  const openTodos = todos.length - doneTodos
  const todoProgress = todos.length === 0 ? 0 : Math.round((doneTodos / todos.length) * 100)
  const statusMeta = PLAN_STATUS_META[selected.status]

  return (
    <>
      <div ref={containerRef} className="-mx-10 flex min-h-[520px]" style={{ userSelect: isResizing.current ? 'none' : undefined }}>
        <div className="bg-chalk px-3 py-5 flex flex-col shrink-0 overflow-y-auto" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
          <div className="flex items-center justify-between px-1.5 mb-3.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">Milestones</span>
            {canEdit && (
              <button type="button" onClick={openCreateMilestone} className="text-[12px] font-medium text-accent hover:text-accent-dark transition-colors">
                + Add
              </button>
            )}
          </div>

          <div className="px-1.5 mb-4">
            <div className="h-[3px] bg-gray-200 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-mood-shipped rounded-full" style={{ width: `${totalProgress}%` }} />
            </div>
            <span className="font-mono text-[10px] text-ink-disabled">{shipped} of {total} done</span>
          </div>

          <div className="flex flex-col gap-0.5">
            {milestones.map((m, index) => {
              const active = selected.id === m.id
              const meta = PLAN_STATUS_META[m.status]
              return (
                <div key={m.id} className="group flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect(m.id)}
                    className={cn(
                      'flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-left',
                      meta.opacity,
                      active ? 'bg-blue-50 shadow-[inset_2px_0_0_theme(colors.accent.DEFAULT)]' : 'hover:bg-gray-100',
                    )}
                  >
                    <div className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0', meta.dotClass)} />
                    <div className="flex-1 min-w-0">
                      <div className={cn('text-[12px] truncate', active ? 'font-semibold text-ink-primary' : 'text-ink-secondary')}>{m.title}</div>
                      <div className="font-mono text-[10px] text-ink-disabled mt-0.5">#{planMilestoneRef(index)} · {formatTargetDate(m.target_date)}</div>
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-[1px] rounded-[3px] flex-shrink-0" style={meta.badgeStyle}>{meta.label}</span>
                  </button>
                  {canEdit && (
                    <div className="flex flex-col shrink-0">
                      {active ? (
                        <>
                          <button type="button" disabled={index === 0 || mutatingId === m.id} onClick={() => updateMilestoneOrder(index, -1)} className="p-0.5 text-ink-disabled hover:text-ink-secondary disabled:opacity-20"><ChevronUp size={13} /></button>
                          <button type="button" disabled={index === milestones.length - 1 || mutatingId === m.id} onClick={() => updateMilestoneOrder(index, 1)} className="p-0.5 text-ink-disabled hover:text-ink-secondary disabled:opacity-20"><ChevronDown size={13} /></button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditMilestone(m) }}
                          className="p-1 text-ink-disabled hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={startResize}
          className="w-[5px] shrink-0 cursor-col-resize relative group"
        >
          <div className="absolute inset-y-0 left-[2px] w-px bg-border group-hover:bg-accent/40 transition-colors duration-150" />
        </div>

        <div className="flex-1 min-w-0 bg-paper px-8 py-7 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[10px] text-accent bg-blue-50 border border-blue-100 rounded px-1.5 py-[1px]">#{planMilestoneRef(selectedMilestoneIndex)}</span>
                <h3 className="text-[15px] font-semibold text-ink-primary">{selected.title}</h3>
              </div>
              {selected.description && <p className="text-[13px] text-ink-secondary max-w-xl mb-2">{selected.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('font-mono text-[10px]', statusMeta.textClass)}>{statusMeta.label}</span>
                <span className="text-gray-200">·</span>
                <span className="font-mono text-[10px] text-ink-primary">{openTodos} open</span>
                <span className="font-mono text-[10px] text-ink-disabled">{doneTodos} done</span>
                <span className="text-gray-200">·</span>
                <span className="font-mono text-[10px] text-ink-disabled">{selected.visibility}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-[10px] text-ink-disabled hidden sm:inline">{formatTargetDate(selected.target_date)}</span>
              {canEdit && (
                <>
                  <button type="button" onClick={() => openEditMilestone(selected)} className="p-1.5 text-ink-tertiary hover:text-accent transition-colors"><Pencil size={14} /></button>
                  <button type="button" onClick={() => deleteMilestone(selected)} className="p-1.5 text-ink-tertiary hover:text-danger transition-colors"><Trash2 size={14} /></button>
                  <button type="button" onClick={openCreateTodo} className="text-[12px] font-medium text-accent hover:text-accent-dark transition-colors ml-1">+ Add todo</button>
                </>
              )}
            </div>
          </div>

          <div className="h-[2px] bg-gray-100 rounded-full overflow-hidden mb-5">
            <div className={cn('h-full rounded-full', selected.status === 'done' ? 'bg-mood-shipped' : 'bg-mood-building')} style={{ width: `${todoProgress}%` }} />
          </div>

          {todos.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-[14px] text-ink-disabled mb-2.5">No todos yet for this milestone.</p>
              {canEdit && <button type="button" onClick={openCreateTodo} className="text-[13px] font-medium text-accent hover:text-accent-dark transition-colors">+ Add the first one</button>}
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {todos.map((todo, index) => {
                const done = todo.status === 'done'
                const source = completionSourceLabel(todo, userId)
                return (
                  <div key={todo.id} className={cn('px-4 py-3.5 flex items-start gap-3 transition-colors', done ? 'bg-green-50/30' : 'bg-white')}>
                    <button type="button" disabled={!canEdit || mutatingId === todo.id} onClick={() => toggleTodo(todo)} className="mt-0.5 disabled:cursor-default" aria-label={done ? `Reopen ${planTodoRef(selectedMilestoneIndex, index)} ${todo.title}` : `Complete ${planTodoRef(selectedMilestoneIndex, index)} ${todo.title}`}>
                      <TodoCheck done={done} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-accent bg-blue-50 border border-blue-100 rounded px-1.5 py-[1px] flex-shrink-0">#{planTodoRef(selectedMilestoneIndex, index)}</span>
                        <div className={cn('text-[14px]', done ? 'text-ink-disabled line-through decoration-green-500/50' : 'text-ink-primary')}>{todo.title}</div>
                      </div>
                      {todo.description && <div className={cn('text-[13px] text-ink-tertiary mt-1 line-clamp-2', done && 'opacity-70')}>{todo.description}</div>}
                      <div className="font-mono text-[10px] text-ink-disabled mt-0.5">
                        {done
                          ? <>{source ?? 'completed'} {formatDate(todo.completed_at ?? todo.updated_at, 'relative')}</>
                          : <>{addedSourceLabel(todo, userId)} {formatDate(todo.created_at, 'relative')}</>}
                        {' · '}{todo.visibility}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button" disabled={index === 0 || mutatingId === todo.id} onClick={() => updateTodoOrder(todos, index, -1)} className="p-1 text-ink-disabled hover:text-ink-secondary disabled:opacity-20"><ChevronUp size={13} /></button>
                        <button type="button" disabled={index === todos.length - 1 || mutatingId === todo.id} onClick={() => updateTodoOrder(todos, index, 1)} className="p-1 text-ink-disabled hover:text-ink-secondary disabled:opacity-20"><ChevronDown size={13} /></button>
                        <button type="button" onClick={() => openEditTodo(todo)} className="p-1.5 text-ink-tertiary hover:text-accent transition-colors"><Pencil size={14} /></button>
                        <button type="button" onClick={() => deleteTodo(todo)} className="p-1.5 text-ink-tertiary hover:text-danger transition-colors"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <MilestoneEditorModal
        open={milestoneModalOpen}
        milestone={editingMilestone}
        projectId={projectId}
        ownerId={ownerId}
        userId={userId}
        sortOrder={milestones.length}
        projectVisibility={projectVisibility}
        onClose={() => setMilestoneModalOpen(false)}
        onSaved={(id) => { if (id) onSelect(id); onRefresh() }}
      />
      <TodoEditorModal
        open={todoModalOpen}
        todo={editingTodo}
        milestones={milestones}
        selectedMilestone={selected}
        ownerId={ownerId}
        userId={userId}
        sortOrder={todos.length}
        projectVisibility={projectVisibility}
        onClose={() => setTodoModalOpen(false)}
        onSaved={onRefresh}
      />
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { data: project, loading, error, refresh } = useProject(id)
  const { data: logs, loading: logsLoading } = useLogs(id)
  const { data: plan, loading: planLoading, error: planError, refresh: refreshPlan } = usePlan(id)

  // Tab & plan
  const [tab, setTab] = useState<Tab>('logs')
  const [planMilestoneId, setPlanMilestoneId] = useState<string | null>(null)

  // Cover upload
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  // Modals
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Settings form
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editVisibility, setEditVisibility] = useState<Visibility>('private')
  const [editGradient, setEditGradient] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [settingsInit, setSettingsInit] = useState(false)

  const isOwner = project?.owner_id === user?.id
  const isEditor = isOwner || project?.collaborators?.some(
    (c) => c.user_id === user?.id && (c.role === 'editor' || c.role === 'admin'),
  )

  const latestMood = logs?.[0]?.mood ?? null

  useEffect(() => {
    if (!plan?.length) {
      setPlanMilestoneId(null)
      return
    }

    const requestedMilestone = searchParams.get('milestone')
    if (requestedMilestone && plan.some((milestone) => milestone.id === requestedMilestone)) {
      setPlanMilestoneId(requestedMilestone)
      return
    }

    setPlanMilestoneId((current) => (
      current && plan.some((milestone) => milestone.id === current)
        ? current
        : plan[0].id
    ))
  }, [plan, searchParams])

  useEffect(() => {
    if (searchParams.get('tab') === 'plan') setTab('plan')
  }, [searchParams])

  function openSettings() {
    if (project && !settingsInit) {
      setEditTitle(project.title)
      setEditDesc(project.description ?? '')
      setEditTags(project.tags ?? [])
      setEditVisibility(project.visibility)
      setEditGradient(project.cover_gradient ?? null)
      setSettingsInit(true)
    }
    setTab('settings')
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !project || !user) return
    setCoverUploading(true)
    try {
      const url = await projectsService.uploadCover(project.id, file, user.id)
      await projectsService.update(project.id, { cover_image_url: url })
      refresh()
      toast.success('Cover updated')
    } catch {
      toast.error('Failed to upload cover')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !user) return
    setSaving(true)
    try {
      await projectsService.update(project.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        tags: editTags,
        visibility: editVisibility,
        cover_gradient: editGradient,
      })
      toast.success('Project updated')
      setSettingsInit(false)
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleShare() {
    setShareOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="px-10 py-8">
        <p className="text-[14px] text-danger">{error ?? 'Project not found.'}</p>
      </div>
    )
  }

  const vis = VIS_META[project.visibility]
  const VisIcon = vis.icon

  return (
    <div className="min-h-full">

      {/* ── Cover ── */}
      <div
        className="h-[200px] relative w-full overflow-hidden group"
        style={!project.cover_image_url ? { background: getCoverGradient(project) } : undefined}
      >
        {project.cover_image_url && (
          <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}

        {/* Upload overlay (hover) */}
        {isEditor && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={() => coverInputRef.current?.click()}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-5 py-2.5 flex items-center gap-2 text-[13px] font-medium text-ink-secondary shadow-sm">
              {coverUploading ? <Spinner size="sm" /> : <Upload size={14} />}
              {coverUploading ? 'Uploading…' : 'Upload cover photo'}
            </div>
          </div>
        )}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* ── Project header ── */}
      <div className="bg-paper border-b border-border px-10 pt-6">
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            {/* Name + badges */}
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <h1 className="font-mono text-[22px] font-semibold text-ink-primary tracking-[-0.02em]">
                {project.title}
              </h1>
              {latestMood && <MoodBadge mood={latestMood} />}
              <span className="font-mono text-[10px] text-ink-disabled bg-gray-100 px-2.5 py-[3px] rounded-full flex items-center gap-1">
                <VisIcon size={10} />
                {vis.label}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-[11px] text-ink-disabled">
                {logs?.length ?? 0} {logs?.length === 1 ? 'entry' : 'entries'}
              </span>
              <span className="font-mono text-[11px] text-ink-disabled">
                started {formatDate(project.created_at)}
              </span>
              <span className="font-mono text-[11px] text-ink-disabled">
                last active {formatDate(project.updated_at, 'relative')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 items-center flex-shrink-0">
            {project.visibility === 'public' && (
              <button
                type="button"
                onClick={handleShare}
                className="text-[13px] font-medium text-ink-secondary bg-gray-100 hover:bg-gray-200 px-3.5 py-[7px] rounded-lg transition-colors"
              >
                Share
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={openSettings}
                className={cn(
                  'text-[13px] font-medium px-3.5 py-[7px] rounded-lg transition-colors',
                  tab === 'settings'
                    ? 'bg-accent text-white'
                    : 'text-ink-secondary bg-gray-100 hover:bg-gray-200',
                )}
              >
                Settings
              </button>
            )}
            {isEditor && (
              <button
                type="button"
                onClick={() => navigate(`/projects/${project.id}/logs/new`)}
                className="flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-white px-4 py-[7px] rounded-lg text-[13px] font-semibold transition-colors"
              >
                <Plus size={12} strokeWidth={2.5} />
                Log entry
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0">
          {(['logs', 'plan'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative px-5 py-2.5 text-[13px] capitalize transition-colors duration-150',
                tab === t ? 'text-accent font-semibold' : 'text-ink-tertiary hover:text-ink-secondary',
              )}
            >
              {t === 'logs' ? 'Logs' : 'Plan'}
              {tab === t && (
                <motion.div
                  layoutId="pd-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">

        {/* Logs */}
        {tab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-10 py-8"
          >
            <ProjectTimeline
              logs={logs ?? []}
              projectId={project.id}
              loading={logsLoading}
              canEdit={!!isEditor}
            />
          </motion.div>
        )}

        {/* Plan */}
        {tab === 'plan' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-10 py-8"
          >
            <PlanTab
              milestones={plan ?? []}
              loading={planLoading}
              error={planError}
              selectedId={planMilestoneId}
              projectId={project.id}
              ownerId={project.owner_id}
              userId={user?.id}
              canEdit={!!isEditor}
              projectVisibility={project.visibility}
              onSelect={setPlanMilestoneId}
              onRefresh={refreshPlan}
            />
          </motion.div>
        )}

        {/* Settings (hidden from tab bar, triggered by Settings button) */}
        {tab === 'settings' && isOwner && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-10 py-8"
          >
            <div className="mb-5">
              <h2 className="text-[18px] font-semibold text-ink-primary">Project settings</h2>
              <p className="text-[13px] text-ink-tertiary mt-0.5">Manage project details and access</p>
            </div>

            {/* Two-column grid */}
            <div className="grid grid-cols-[3fr_2fr] gap-4 mb-4">

              {/* Left — General */}
              <form onSubmit={handleSaveSettings} className="bg-paper border border-border rounded-xl p-6 flex flex-col gap-4">
                <p className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">General</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={saving}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 outline-none focus:border-accent/60 focus:bg-white transition-colors disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    disabled={saving}
                    rows={4}
                    placeholder="What are you building?"
                    className="w-full rounded-lg border border-border bg-gray-50 text-ink-primary text-[14px] px-3.5 py-2.5 outline-none focus:border-accent/60 focus:bg-white transition-colors resize-none disabled:opacity-60 placeholder:text-ink-disabled"
                  />
                </div>
                <TagInput tags={editTags} onChange={setEditTags} disabled={saving} />
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Visibility</label>
                  <VisibilitySelector value={editVisibility} onChange={setEditVisibility} disabled={saving} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Cover gradient</label>
                  <div className="flex items-center gap-3">
                    <GradientPicker value={editGradient} onChange={setEditGradient} disabled={saving} />
                    {editGradient && (
                      <div
                        className="h-8 w-16 rounded-lg border border-border flex-shrink-0"
                        style={{ background: COVER_GRADIENTS.find((g) => g.key === editGradient)?.css }}
                        aria-hidden
                      />
                    )}
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={saving || !editTitle.trim()}
                    className="text-[13px] font-semibold bg-accent text-white hover:bg-accent-dark px-5 py-[9px] rounded-[7px] transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>

              {/* Right — Collaborators */}
              <div className="bg-paper border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] uppercase tracking-wider font-medium text-ink-disabled">Collaborators</p>
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-dark transition-colors"
                  >
                    <UserPlus size={12} />
                    Invite
                  </button>
                </div>
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50">
                    <Avatar
                      src={project.owner?.avatar_url ?? undefined}
                      name={project.owner?.username}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[13px] text-ink-primary truncate">@{project.owner?.username}</p>
                    </div>
                    <span className="text-[11px] font-medium text-accent bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                      owner
                    </span>
                  </div>
                  {project.collaborators?.map((c) => (
                    <div key={c.user_id} className="px-4">
                      <CollaboratorRow collaborator={c} isOwner={isOwner} />
                    </div>
                  ))}
                </div>
                {project.collaborators?.length === 0 && (
                  <p className="text-[13px] text-ink-disabled mt-3">No collaborators yet.</p>
                )}
              </div>
            </div>

            {/* Danger zone — full width */}
            <div className="border border-red-200 bg-red-50/40 rounded-xl p-6">
              <p className="text-[12px] uppercase tracking-wider font-medium text-red-400 mb-3">Danger zone</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[14px] font-medium text-ink-primary">Delete project</p>
                  <p className="text-[13px] text-ink-tertiary mt-0.5">
                    Permanently deletes this project and all its logs. Cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="flex-shrink-0 text-[13px] font-semibold text-danger border border-red-200 hover:bg-red-50 px-4 py-[7px] rounded-[7px] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Modals ── */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        projectTitle={project.title}
        projectId={project.id}
      />

      {isOwner && (
        <>
          <CollaboratorInviteModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            projectId={project.id}
            ownerId={project.owner_id}
            onChanged={refresh}
          />
          <DeleteProjectModal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            projectId={project.id}
            projectTitle={project.title}
          />
        </>
      )}
    </div>
  )
}
