import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle2, CheckSquare, Circle, Clock3, Columns3, Copy, Pencil, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { planService } from '@/services/plan.service'
import { useAuthStore } from '@/stores/authStore'
import type { PlanMilestoneWithTodos, PlanStatus, PlanTodoWithSources, Project } from '@/types'
import { cn, formatDate } from '@/utils'
import { getCoverGradient } from '@/utils/coverGradient'
import { normalizeMarkdownLineBreaks } from '@/utils/markdown'

type ProjectPlan = {
  project: Project
  milestones: PlanMilestoneWithTodos[]
}

type KanbanCard = {
  project: Project
  milestone: PlanMilestoneWithTodos
  todo: PlanTodoWithSources
  ref: string
}

const COLUMNS: Array<{ status: PlanStatus; label: string; Icon: typeof Circle }> = [
  { status: 'todo', label: 'Todo', Icon: Circle },
  { status: 'in_queue', label: 'In queue', Icon: Clock3 },
  { status: 'doing', label: 'Doing', Icon: Clock3 },
  { status: 'verify', label: 'Verify', Icon: CheckSquare },
  { status: 'done', label: 'Done', Icon: CheckCircle2 },
]

function KanbanTodoCard({
  card,
  onOpen,
  onDragStart,
}: {
  card: KanbanCard
  onOpen: (card: KanbanCard) => void
  onDragStart: (card: KanbanCard) => void
}) {
  const { project, milestone, todo } = card
  const projectColor = getCoverGradient(project)

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(card)
      }}
      onClick={() => onOpen(card)}
      className="group block shrink-0 cursor-grab overflow-hidden rounded-2xl border border-border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:opacity-60"
      style={{ background: projectColor }}
    >
      <div className="m-1.5 rounded-xl bg-paper/90 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/70" style={{ background: projectColor }} />
          <span className="truncate font-mono text-[11px] font-semibold text-ink-secondary">{project.title}</span>
        </div>
        <div className={cn('text-[14px] font-medium leading-snug text-ink-primary', todo.status === 'done' && 'text-ink-disabled line-through decoration-green-500/50')}>
          {todo.title}
        </div>
        <div className="mt-2 flex flex-col gap-1 font-mono text-[10px] text-ink-disabled">
          <span className="truncate">{milestone.title}</span>
          <span>updated {formatDate(todo.updated_at, 'relative')}</span>
        </div>
      </div>
    </button>
  )
}

export default function Kanban() {
  const user = useAuthStore((s) => s.user)
  const { owned, shared, loading: projectsLoading, error: projectsError } = useProjects(user?.id)
  const [plans, setPlans] = useState<ProjectPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dragOverColumn, setDragOverColumn] = useState<PlanStatus | null>(null)
  const draggedCard = useRef<KanbanCard | null>(null)

  const projects = useMemo(() => [...owned, ...shared], [owned, shared])

  useEffect(() => {
    if (projectsLoading || projects.length === 0) {
      setPlans([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all(projects.map(async (project) => ({ project, milestones: await planService.getForProject(project.id) })))
      .then((data) => {
        if (!cancelled) setPlans(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [projects, projectsLoading])

  const [selectedProjectId, setSelectedProjectId] = useState('all')

  const cards = useMemo(() => plans.flatMap(({ project, milestones }) =>
    milestones.flatMap((milestone, milestoneIndex) =>
      milestone.todos.map((todo, todoIndex) => ({
        project,
        milestone,
        todo,
        ref: `1.${milestoneIndex + 1}.${todoIndex + 1}`,
      })),
    ),
  ), [plans])

  const filteredCards = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return cards.filter((card) => {
      const matchesProject = selectedProjectId === 'all' || card.project.id === selectedProjectId
      const matchesSearch = !normalizedSearch || [
        card.ref,
        card.todo.title,
        card.todo.description ?? '',
        card.milestone.title,
        card.project.title,
        card.todo.status,
      ].join(' ').toLowerCase().includes(normalizedSearch)
      return matchesProject && matchesSearch
    })
  }, [cards, selectedProjectId, searchQuery])

  const cardsByStatus = useMemo(() => Object.fromEntries(
    COLUMNS.map(({ status }) => [
      status,
      filteredCards
        .filter((card) => card.todo.status === status)
        .sort((a, b) => new Date(b.todo.updated_at).getTime() - new Date(a.todo.updated_at).getTime()),
    ]),
  ) as Record<PlanStatus, KanbanCard[]>, [filteredCards])

  if (projectsLoading || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>
  }

  if (projectsError || error) {
    return <div className="px-10 py-8 text-[14px] text-danger">{projectsError ?? error}</div>
  }

  async function handleCopy(card: KanbanCard) {
    const text = `${card.ref} - ${card.todo.title} - ${card.todo.description ?? ''}`
    await navigator.clipboard.writeText(text)
    toast.success('Copied card details')
  }

  async function handleDrop(targetStatus: PlanStatus) {
    const card = draggedCard.current
    draggedCard.current = null
    setDragOverColumn(null)
    if (!card || card.todo.status === targetStatus) return

    const previousTodo = card.todo
    const now = new Date().toISOString()
    const patch = {
      status: targetStatus,
      completed_at: targetStatus === 'done' ? now : null,
      completed_by: targetStatus === 'done' ? user?.id ?? null : null,
      completed_by_agent_token_id: null,
      updated_at: now,
    }

    setPlans((prev) =>
      prev.map((plan) =>
        plan.project.id !== card.project.id
          ? plan
          : {
              ...plan,
              milestones: plan.milestones.map((m) =>
                m.id !== card.milestone.id
                  ? m
                  : {
                      ...m,
                      todos: m.todos.map((t) =>
                        t.id !== card.todo.id
                          ? t
                          : {
                              ...t,
                              ...patch,
                              completed_by_profile: targetStatus === 'done' ? user?.profile ?? null : null,
                              completed_by_agent: null,
                            },
                      ),
                    },
              ),
            },
      ),
    )

    try {
      await planService.updateTodo(card.todo.id, patch)
    } catch (err) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.project.id !== card.project.id
            ? plan
            : {
                ...plan,
                milestones: plan.milestones.map((m) =>
                  m.id !== card.milestone.id
                    ? m
                    : {
                        ...m,
                        todos: m.todos.map((t) =>
                          t.id !== card.todo.id ? t : previousTodo,
                        ),
                      },
                ),
              },
        ),
      )
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden px-6 py-8 lg:px-10">
      <div className="mb-7 flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Columns3 size={18} /></div>
          <div>
            <h1 className="font-mono text-[24px] font-semibold tracking-[-0.02em] text-ink-primary">Kanban</h1>
            <p className="mt-1 text-[14px] text-ink-tertiary">A board of todos across all projects. Cards use their project color.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search cards…"
              className="h-10 min-w-64 rounded-xl border border-border bg-paper pl-8 pr-3 text-[13px] text-ink-primary outline-none transition placeholder:text-ink-disabled focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-tertiary">
            Project
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="h-10 min-w-56 rounded-xl border border-border bg-paper px-3 font-mono text-[13px] text-ink-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-paper px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-secondary">Nothing here yet.</p>
          <p className="mt-1 text-[14px] text-ink-tertiary">Add todos inside a project plan to populate the board.</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-paper px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-secondary">No matching cards.</p>
          <p className="mt-1 text-[14px] text-ink-tertiary">Clear search, choose All projects, or add todos to this project plan.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
          {COLUMNS.map(({ status, label, Icon }) => {
            const columnCards = cardsByStatus[status]
            const isOver = dragOverColumn === status
            return (
              <section
                key={status}
                className={cn(
                  'flex min-h-0 min-w-[18rem] flex-1 flex-col rounded-2xl border bg-gray-50/60 transition-colors',
                  isOver ? 'border-accent bg-accent/5 ring-2 ring-accent/20' : 'border-border',
                )}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColumn(status) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null) }}
                onDrop={(e) => { e.preventDefault(); void handleDrop(status) }}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2 font-mono text-[13px] font-semibold text-ink-secondary">
                    <Icon size={14} />
                    {label}
                  </div>
                  <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[11px] text-ink-disabled">{columnCards.length}</span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                  {columnCards.length === 0 ? (
                    <div className={cn('rounded-xl border border-dashed px-3 py-6 text-center text-[12px]', isOver ? 'border-accent/40 bg-accent/5 text-accent' : 'border-border bg-paper/70 text-ink-disabled')}>
                      {isOver ? 'Drop here' : 'No cards'}
                    </div>
                  ) : columnCards.map((card) => (
                    <KanbanTodoCard
                      key={card.todo.id}
                      card={card}
                      onOpen={setSelectedCard}
                      onDragStart={(c) => { draggedCard.current = c }}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {selectedCard && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-paper shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="h-2" style={{ background: getCoverGradient(selectedCard.project) }} />
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold text-ink-disabled">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: getCoverGradient(selectedCard.project) }} />
                    <span className="truncate">{selectedCard.project.title}</span>
                  </div>
                  <h2 className="text-[20px] font-semibold leading-tight text-ink-primary">{selectedCard.todo.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="rounded-full p-2 text-ink-disabled transition hover:bg-gray-100 hover:text-ink-secondary"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">ID</div>
                  <div className="break-all rounded-xl bg-gray-50 px-3 py-2 font-mono text-[12px] text-ink-secondary">{selectedCard.ref}</div>
                </div>

                <div>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">Description</div>
                  <div className="prose prose-log max-h-[46vh] max-w-none overflow-y-auto rounded-xl bg-gray-50 px-4 py-3 text-[14px] text-ink-secondary">
                    {selectedCard.todo.description ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdownLineBreaks(selectedCard.todo.description)}</ReactMarkdown>
                    ) : (
                      <p className="m-0 text-ink-disabled">No description.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-ink-disabled">
                  <div className="rounded-xl bg-gray-50 px-3 py-2">Milestone: <span className="text-ink-secondary">{selectedCard.milestone.title}</span></div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">Status: <span className="text-ink-secondary">{selectedCard.todo.status}</span></div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy(selectedCard)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-ink-secondary transition hover:bg-gray-50"
                >
                  <Copy size={14} />
                  Copy
                </button>
                <Link
                  to={`/projects/${selectedCard.project.id}?tab=plan&milestone=${selectedCard.milestone.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-accent-dark"
                >
                  <Pencil size={14} />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
