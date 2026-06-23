import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Globe, Link2, Lock, Users, UserPlus, BookOpen, Plus, Check, Upload,
} from 'lucide-react'
import { Button, Avatar, Spinner } from '@/components/ui'
import { useProject } from '@/features/projects/hooks/useProject'
import { useLogs } from '@/features/logs/hooks/useLogs'
import { useAuthStore } from '@/stores/authStore'
import { CollaboratorRow } from '@/features/projects/components/CollaboratorRow'
import { CollaboratorInviteModal } from '@/features/projects/components/CollaboratorInviteModal'
import { DeleteProjectModal } from '@/features/projects/components/DeleteProjectModal'
import { GradientPicker } from '@/features/projects/components/GradientPicker'
import { TagInput } from '@/features/projects/components/TagInput'
import { VisibilitySelector } from '@/features/projects/components/VisibilitySelector'
import { projectsService } from '@/services/projects.service'
import type { Log, LogMood, Visibility } from '@/types'
import { cn, formatDate } from '@/utils'
import { COVER_GRADIENTS, getCoverGradient } from '@/utils/coverGradient'

// ── Mood helpers ──────────────────────────────────────────────────────────────

type MoodKey = LogMood

const MOOD_DOT: Record<string, string> = {
  building:   'bg-mood-building',
  shipped:    'bg-mood-shipped',
  stuck:      'bg-mood-stuck',
  learning:   'bg-mood-learning',
  inspired:   'bg-mood-inspired',
  reflecting: 'bg-mood-reflecting',
}

const MOOD_BADGE: Record<string, string> = {
  building:   'text-mood-building bg-orange-50 border-orange-200',
  shipped:    'text-mood-shipped bg-green-50 border-green-200',
  stuck:      'text-mood-stuck bg-red-50 border-red-200',
  learning:   'text-mood-learning bg-blue-50 border-blue-200',
  inspired:   'text-mood-inspired bg-purple-50 border-purple-200',
  reflecting: 'text-mood-reflecting bg-slate-100 border-slate-200',
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
type PlanMilestone = 'v01' | 'v02' | 'v03' | 'v10'

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
  return (
    <span
      className={cn(
        'font-mono text-[10px] font-medium border rounded-[4px] px-2 py-[1px]',
        MOOD_BADGE[mood] ?? 'text-ink-tertiary bg-gray-50 border-gray-200',
      )}
    >
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

const MILESTONES = [
  {
    id: 'v01' as PlanMilestone,
    label: 'v0.1 — Foundation',
    date: 'May 2026',
    status: 'done' as const,
    dotClass: 'bg-mood-shipped',
    badgeClass: 'text-mood-shipped bg-green-50',
    badgeLabel: 'done',
    opacity: 'opacity-50',
  },
  {
    id: 'v02' as PlanMilestone,
    label: 'v0.2 — Core features',
    date: 'Jun 2026',
    status: 'now' as const,
    dotClass: 'bg-mood-building animate-pulse-slow',
    badgeClass: 'text-mood-building bg-orange-50',
    badgeLabel: 'now',
    opacity: '',
  },
  {
    id: 'v03' as PlanMilestone,
    label: 'v0.3 — Social layer',
    date: 'Jul 2026',
    status: 'soon' as const,
    dotClass: 'bg-transparent border-[1.5px] border-gray-300',
    badgeClass: 'text-ink-disabled bg-gray-50',
    badgeLabel: 'soon',
    opacity: 'opacity-45',
  },
  {
    id: 'v10' as PlanMilestone,
    label: 'v1.0 — Agent API',
    date: 'Aug 2026',
    status: 'later' as const,
    dotClass: 'bg-transparent border-[1.5px] border-gray-300',
    badgeClass: 'text-ink-disabled bg-gray-50',
    badgeLabel: 'later',
    opacity: 'opacity-30',
  },
]

function TodoCheck({ done }: { done: boolean }) {
  return (
    <div
      className={cn(
        'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center',
        done
          ? 'bg-mood-shipped'
          : 'border-[1.5px] border-gray-300',
      )}
    >
      {done && <Check size={9} strokeWidth={2.5} className="text-white" />}
    </div>
  )
}

function PlanTab({ milestone, onSelect }: { milestone: PlanMilestone; onSelect: (m: PlanMilestone) => void }) {
  return (
    <div className="-mx-10 grid grid-cols-[236px_1fr] min-h-[520px]">
      {/* Left: milestone list */}
      <div className="border-r border-border bg-chalk px-3 py-5 flex flex-col">
        <div className="flex items-center justify-between px-1.5 mb-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">
            Milestones
          </span>
          <button
            type="button"
            className="text-[12px] font-medium text-accent hover:text-accent-dark transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-1.5 mb-4">
          <div className="h-[3px] bg-gray-200 rounded-full overflow-hidden mb-1.5">
            <div className="w-[25%] h-full bg-mood-shipped rounded-full" />
          </div>
          <span className="font-mono text-[10px] text-ink-disabled">
            1 of 4 shipped · v1.0 Aug 2026
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {MILESTONES.map((m) => {
            const active = milestone === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-left',
                  m.opacity,
                  active
                    ? 'bg-blue-50 shadow-[inset_2px_0_0_theme(colors.accent.DEFAULT)]'
                    : 'hover:bg-gray-100',
                )}
              >
                <div className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0', m.dotClass)} />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-[12px] truncate',
                      active ? 'font-semibold text-ink-primary' : 'text-ink-secondary',
                    )}
                  >
                    {m.label}
                  </div>
                  <div className="font-mono text-[10px] text-ink-disabled mt-0.5">{m.date}</div>
                </div>
                <span
                  className={cn(
                    'font-mono text-[9px] px-1.5 py-[1px] rounded-[3px] flex-shrink-0',
                    m.badgeClass,
                  )}
                >
                  {m.badgeLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: todos panel */}
      <div className="bg-paper px-8 py-7 overflow-y-auto">
        {milestone === 'v01' && (
          <div>
            <div className="mb-3.5">
              <h3 className="text-[15px] font-semibold text-ink-primary mb-1">Foundation</h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-mood-shipped">shipped</span>
                <span className="text-gray-200">·</span>
                <span className="font-mono text-[10px] text-ink-disabled">1 done</span>
              </div>
            </div>
            <div className="h-[2px] bg-mood-shipped rounded-full mb-5" />
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 flex items-center gap-3 opacity-45">
                <TodoCheck done />
                <div>
                  <div className="text-[14px] text-ink-disabled line-through">Wire authentication flow</div>
                  <div className="font-mono text-[10px] text-ink-disabled mt-0.5">completed by you</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {milestone === 'v02' && (
          <div>
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div>
                <h3 className="text-[15px] font-semibold text-ink-primary mb-1">Core features</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-mood-building">building</span>
                  <span className="text-gray-200">·</span>
                  <span className="font-mono text-[10px] text-ink-primary">3 open</span>
                  <span className="font-mono text-[10px] text-ink-disabled">1 done</span>
                </div>
              </div>
              <button
                type="button"
                className="text-[12px] font-medium text-accent hover:text-accent-dark transition-colors flex-shrink-0"
              >
                + Add todo
              </button>
            </div>
            <div className="h-[2px] bg-gray-100 rounded-full overflow-hidden mb-5">
              <div className="w-[25%] h-full bg-mood-building rounded-full" />
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              <div className="px-4 py-3.5 flex items-center gap-3 opacity-45">
                <TodoCheck done />
                <div>
                  <div className="text-[14px] text-ink-disabled line-through">Wire authentication flow</div>
                  <div className="font-mono text-[10px] text-ink-disabled mt-0.5">completed by you</div>
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3">
                <TodoCheck done={false} />
                <div>
                  <div className="text-[14px] text-ink-primary">Write integration tests for auth</div>
                  <div className="font-mono text-[10px] text-ink-disabled mt-0.5">added by Claude Code · 10m ago</div>
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3">
                <TodoCheck done={false} />
                <div>
                  <div className="text-[14px] text-ink-primary">Add rate limiting to API endpoints</div>
                  <div className="font-mono text-[10px] text-ink-disabled mt-0.5">added by Claude Code · 2h ago</div>
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3">
                <TodoCheck done={false} />
                <div>
                  <div className="text-[14px] text-ink-primary">Design the public profile page</div>
                  <div className="font-mono text-[10px] text-ink-disabled mt-0.5">added by you · yesterday</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(milestone === 'v03' || milestone === 'v10') && (
          <div>
            <div className="mb-5">
              <h3 className="text-[15px] font-semibold text-ink-primary mb-1">
                {milestone === 'v03' ? 'Social layer' : 'Agent API'}
              </h3>
              <span className="font-mono text-[10px] text-ink-disabled">
                planned · {milestone === 'v03' ? 'Jul 2026' : 'Aug 2026'}
              </span>
            </div>
            <div className="py-14 text-center">
              <p className="text-[14px] text-ink-disabled mb-2.5">No todos yet for this milestone.</p>
              <button
                type="button"
                className="text-[13px] font-medium text-accent hover:text-accent-dark transition-colors"
              >
                + Add the first one
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: project, loading, error, refresh } = useProject(id)
  const { data: logs, loading: logsLoading } = useLogs(id)

  // Tab & plan
  const [tab, setTab] = useState<Tab>('logs')
  const [planMilestone, setPlanMilestone] = useState<PlanMilestone>('v02')

  // Cover upload
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  // Modals
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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
    const url = `${window.location.origin}/p/${project?.id}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied'))
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
            <PlanTab milestone={planMilestone} onSelect={setPlanMilestone} />
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

            {/* Preview link */}
            <div className="mt-4">
              <Link
                to={`/projects/${project.id}/preview`}
                className="text-[13px] text-ink-tertiary hover:text-accent transition-colors"
              >
                View public preview →
              </Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Modals ── */}
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
