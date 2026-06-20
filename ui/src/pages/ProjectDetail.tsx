import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Lock, Globe, Link2, Users, UserPlus } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button, Badge, Avatar, Spinner } from '@/components/ui'
import { useProject } from '@/features/projects/hooks/useProject'
import { useLogs } from '@/features/logs/hooks/useLogs'
import { TimelineView } from '@/features/logs/components/TimelineView'
import { useAuthStore } from '@/stores/authStore'
import { CollaboratorRow } from '@/features/projects/components/CollaboratorRow'
import { CollaboratorInviteModal } from '@/features/projects/components/CollaboratorInviteModal'
import { DeleteProjectModal } from '@/features/projects/components/DeleteProjectModal'
import { CoverUpload } from '@/features/projects/components/CoverUpload'
import { TagInput } from '@/features/projects/components/TagInput'
import { VisibilitySelector } from '@/features/projects/components/VisibilitySelector'
import { projectsService } from '@/services/projects.service'
import type { Visibility } from '@/types'
import { cn } from '@/utils'

type Tab = 'logs' | 'collaborators' | 'settings'

const VISIBILITY_META: Record<Visibility, { icon: React.ElementType; label: string; variant: 'default' | 'success' | 'warning' | 'accent' }> = {
  private:  { icon: Lock,  label: 'Private',  variant: 'default' },
  public:   { icon: Globe, label: 'Public',   variant: 'success' },
  unlisted: { icon: Link2, label: 'Unlisted', variant: 'warning' },
  shared:   { icon: Users, label: 'Shared',   variant: 'accent' },
}

const COVER_GRADIENTS = [
  'from-violet-900 to-surface-950',
  'from-indigo-900 to-surface-950',
  'from-slate-800 to-surface-950',
  'from-zinc-800 to-surface-950',
  'from-purple-900 to-surface-950',
  'from-blue-900 to-surface-950',
]

function gradientForId(id: string) {
  const idx = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx]
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { data: project, loading, error, refresh } = useProject(id)
  const { data: logs, loading: logsLoading } = useLogs(id)

  const [tab, setTab] = useState<Tab>('logs')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Settings form state
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editVisibility, setEditVisibility] = useState<Visibility>('private')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [settingsInitialized, setSettingsInitialized] = useState(false)

  const isOwner = project?.owner_id === user?.id
  const isEditor = isOwner || project?.collaborators?.some(
    (c) => c.user_id === user?.id && (c.role === 'editor' || c.role === 'admin'),
  )

  function initSettings() {
    if (!project || settingsInitialized) return
    setEditTitle(project.title)
    setEditDesc(project.description ?? '')
    setEditTags(project.tags ?? [])
    setEditVisibility(project.visibility)
    setSettingsInitialized(true)
  }

  function handleTabChange(t: Tab) {
    setTab(t)
    if (t === 'settings') initSettings()
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !user) return
    setSaving(true)
    try {
      let coverUrl = project.cover_image_url

      if (coverFile) {
        setUploadingCover(true)
        try {
          coverUrl = await projectsService.uploadCover(project.id, coverFile, user.id)
        } finally {
          setUploadingCover(false)
        }
      }

      await projectsService.update(project.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        tags: editTags,
        visibility: editVisibility,
        cover_image_url: coverUrl,
      })
      toast.success('Project updated')
      setCoverFile(null)
      setSettingsInitialized(false)
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveCover() {
    if (!project || !user) return
    try {
      await projectsService.deleteCover(project.id, user.id)
      await projectsService.update(project.id, { cover_image_url: null })
      refresh()
      toast.success('Cover removed')
    } catch {
      toast.error('Failed to remove cover')
    }
  }

  const TABS: { value: Tab; label: string; ownerOnly?: boolean }[] = [
    { value: 'logs', label: 'Logs' },
    { value: 'collaborators', label: 'Collaborators' },
    { value: 'settings', label: 'Settings', ownerOnly: true },
  ]

  if (loading) {
    return (
      <AnimatedPage className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </AnimatedPage>
    )
  }

  if (error || !project) {
    return (
      <AnimatedPage>
        <p className="text-body text-danger">{error ?? 'Project not found.'}</p>
      </AnimatedPage>
    )
  }

  const vis = VISIBILITY_META[project.visibility]
  const VisIcon = vis.icon

  return (
    <AnimatedPage className="max-w-4xl pb-16">
      {/* Hero */}
      <div className="relative rounded-glass overflow-hidden mb-8 h-[220px] sm:h-[280px]">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', gradientForId(project.id))} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-surface-950/30 to-transparent" />

        {/* Visibility badge */}
        <div className="absolute top-4 right-4">
          <span className={cn(
            'flex items-center gap-1.5 rounded-pill px-3 py-1 text-caption backdrop-blur-sm',
            'bg-surface-950/60 border border-surface-700',
          )}>
            <VisIcon size={12} className="text-ink-secondary" />
            <span className="text-ink-secondary">{vis.label}</span>
          </span>
        </div>

        {/* Title + tags overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {project.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-surface-950/60 backdrop-blur-sm border border-surface-700 px-2 py-0.5 text-caption text-ink-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-headline text-ink-primary">{project.title}</h1>
          {project.description && (
            <p className="text-body text-ink-secondary mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-surface-800">
        {TABS.filter((t) => !t.ownerOnly || isOwner).map((t) => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={`relative px-4 py-2.5 text-body transition-colors duration-150 ${
              tab === t.value ? 'text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            {t.label}
            {tab === t.value && (
              <motion.div
                layoutId="detail-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-px bg-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* ── Logs ── */}
        {tab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TimelineView
              logs={logs ?? []}
              projectId={id!}
              canEdit={!!isEditor}
              loading={logsLoading}
            />
          </motion.div>
        )}

        {/* ── Collaborators ── */}
        {tab === 'collaborators' && (
          <motion.div
            key="collaborators"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-ink-primary">Collaborators</h2>
              {isOwner && (
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={15} className="mr-1" />
                  Invite
                </Button>
              )}
            </div>

            {/* Owner row */}
            <div className="glass rounded-glass divide-y divide-surface-800">
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar
                  src={project.owner?.avatar_url ?? undefined}
                  name={project.owner?.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body text-ink-primary truncate">
                    @{project.owner?.username}
                  </p>
                </div>
                <Badge variant="accent">owner</Badge>
              </div>
              {project.collaborators?.map((c) => (
                <div key={c.user_id} className="px-4">
                  <CollaboratorRow
                    collaborator={c}
                    isOwner={isOwner}
                  />
                </div>
              ))}
            </div>

            {project.collaborators?.length === 0 && (
              <p className="text-body text-ink-tertiary mt-4">No collaborators yet.</p>
            )}
          </motion.div>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && isOwner && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <CoverUpload
                value={project.cover_image_url}
                onChange={setCoverFile}
                uploading={uploadingCover}
                onRemove={handleRemoveCover}
                disabled={saving}
              />

              <div className="glass rounded-glass p-6 space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label uppercase text-ink-secondary tracking-wider">
                    Title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={saving}
                    className="w-full h-11 rounded-glass glass text-ink-primary text-body px-4 outline-none border border-transparent placeholder:text-ink-disabled focus:border-accent/50 focus:shadow-glow transition-all duration-200"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-label uppercase text-ink-secondary tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    disabled={saving}
                    rows={3}
                    className="w-full rounded-glass glass text-ink-primary text-body px-4 py-3 outline-none border border-transparent placeholder:text-ink-disabled focus:border-accent/50 focus:shadow-glow transition-all duration-200 resize-none"
                  />
                </div>

                <TagInput tags={editTags} onChange={setEditTags} disabled={saving} />

                <div className="space-y-1.5">
                  <label className="text-label uppercase text-ink-secondary tracking-wider">
                    Visibility
                  </label>
                  <VisibilitySelector
                    value={editVisibility}
                    onChange={setEditVisibility}
                    disabled={saving}
                  />
                </div>

                <Button type="submit" size="lg" disabled={saving || !editTitle.trim()} className="w-full">
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>

            {/* Danger zone */}
            <div className="mt-8 rounded-glass border border-danger/20 bg-danger/5 p-6">
              <h3 className="text-title text-ink-primary mb-1">Danger zone</h3>
              <p className="text-body text-ink-secondary mb-4">
                Permanently delete this project and all its logs. This cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete project
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
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
    </AnimatedPage>
  )
}
