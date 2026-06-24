import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Clock3, Map, CheckSquare } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { planService } from '@/services/plan.service'
import { useAuthStore } from '@/stores/authStore'
import type { PlanMilestoneWithTodos, PlanStatus, PlanTodo, Project } from '@/types'
import { cn, formatDate } from '@/utils'

type Mode = 'todos' | 'roadmap'

type ProjectPlan = {
  project: Project
  milestones: PlanMilestoneWithTodos[]
}

const STATUS_META: Record<PlanStatus, { label: string; className: string; Icon: typeof Circle }> = {
  pending: { label: 'pending', className: 'text-ink-disabled bg-gray-100', Icon: Circle },
  doing: { label: 'doing', className: 'text-mood-building bg-orange-50', Icon: Clock3 },
  done: { label: 'done', className: 'text-mood-shipped bg-green-50', Icon: CheckCircle2 },
}

function todoRef(milestoneIndex: number, todoIndex: number) {
  return `1.${milestoneIndex + 1}.${todoIndex + 1}`
}

function milestoneRef(milestoneIndex: number) {
  return `1.${milestoneIndex + 1}`
}

function StatusBadge({ status }: { status: PlanStatus }) {
  const meta = STATUS_META[status]
  const Icon = meta.Icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[10px]', meta.className)}>
      <Icon size={10} />
      {meta.label}
    </span>
  )
}

function ProjectSection({ projectPlan, mode }: { projectPlan: ProjectPlan; mode: Mode }) {
  const { project, milestones } = projectPlan
  const todoItems = useMemo(() => milestones.flatMap((milestone, milestoneIndex) =>
    milestone.todos
      .map((todo, todoIndex) => ({ milestone, milestoneIndex, todo, todoIndex }))
      .filter(({ todo }) => todo.status !== 'done'),
  ).sort((a, b) => {
    if (a.todo.status === b.todo.status) return a.milestoneIndex - b.milestoneIndex || a.todoIndex - b.todoIndex
    if (a.todo.status === 'doing') return -1
    if (b.todo.status === 'doing') return 1
    if (a.todo.status === 'done') return 1
    if (b.todo.status === 'done') return -1
    return 0
  }), [milestones])

  if (mode === 'todos' ? todoItems.length === 0 : milestones.length === 0) return null

  const openTodos = todoItems.length

  return (
    <section className="rounded-2xl border border-border bg-paper overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/projects/${project.id}?tab=plan`} className="font-mono text-[15px] font-semibold text-ink-primary hover:text-accent transition-colors">
            {project.title}
          </Link>
          <div className="mt-1 font-mono text-[10px] text-ink-disabled">
            {mode === 'todos' ? `${openTodos} open` : `${milestones.length} milestones`}
          </div>
        </div>
        <Link to={`/projects/${project.id}?tab=plan`} className="text-[12px] font-medium text-accent hover:text-accent-dark">
          Open plan
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {mode === 'todos'
          ? todoItems.map(({ milestone, milestoneIndex, todo, todoIndex }) => {
              const t = todo as PlanTodo
              const ref = todoRef(milestoneIndex, todoIndex)
              return (
                <Link
                  key={t.id}
                  to={`/projects/${project.id}?tab=plan&milestone=${milestone.id}`}
                  className="block px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-[10px] text-accent bg-blue-50 border border-blue-100 rounded px-1.5 py-[1px]">#{ref}</span>
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-[14px]', t.status === 'done' ? 'text-ink-disabled line-through decoration-green-500/50' : 'text-ink-primary')}>{t.title}</div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-ink-disabled">{milestone.title}</span>
                        <StatusBadge status={t.status} />
                        <span className="font-mono text-[10px] text-ink-disabled">updated {formatDate(t.updated_at, 'relative')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          : milestones.map((milestone, milestoneIndex) => (
              <Link
                key={milestone.id}
                to={`/projects/${project.id}?tab=plan&milestone=${milestone.id}`}
                className="block px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-accent bg-blue-50 border border-blue-100 rounded px-1.5 py-[1px]">#{milestoneRef(milestoneIndex)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-ink-primary">{milestone.title}</div>
                    {milestone.description && <div className="mt-1 text-[13px] text-ink-tertiary line-clamp-2">{milestone.description}</div>}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <StatusBadge status={milestone.status} />
                      <span className="font-mono text-[10px] text-ink-disabled">{milestone.todos.filter((todo) => todo.status === 'done').length}/{milestone.todos.length} todos done</span>
                      <span className="font-mono text-[10px] text-ink-disabled">{milestone.target_date ? formatDate(milestone.target_date) : 'no target'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  )
}

export default function PlanOverview({ mode }: { mode: Mode }) {
  const user = useAuthStore((s) => s.user)
  const { owned, shared, loading: projectsLoading, error: projectsError } = useProjects(user?.id)
  const [plans, setPlans] = useState<ProjectPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const visiblePlans = plans.filter((plan) => mode === 'roadmap'
    ? plan.milestones.length > 0
    : plan.milestones.some((milestone) => milestone.todos.some((todo) => todo.status !== 'done')),
  )

  const Icon = mode === 'todos' ? CheckSquare : Map
  const title = mode === 'todos' ? 'Todos' : 'Roadmap'
  const subtitle = mode === 'todos'
    ? 'Open work across every project, grouped by project.'
    : 'Milestones across every project, grouped by project.'

  if (projectsLoading || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>
  }

  if (projectsError || error) {
    return <div className="px-10 py-8 text-[14px] text-danger">{projectsError ?? error}</div>
  }

  return (
    <div className="px-10 py-8 max-w-5xl">
      <div className="mb-7 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Icon size={18} /></div>
        <div>
          <h1 className="font-mono text-[24px] font-semibold text-ink-primary tracking-[-0.02em]">{title}</h1>
          <p className="mt-1 text-[14px] text-ink-tertiary">{subtitle}</p>
        </div>
      </div>

      {visiblePlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-paper px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-secondary">Nothing here yet.</p>
          <p className="mt-1 text-[14px] text-ink-tertiary">Add milestones and todos inside a project plan.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {visiblePlans.map((projectPlan) => <ProjectSection key={projectPlan.project.id} projectPlan={projectPlan} mode={mode} />)}
        </div>
      )}
    </div>
  )
}
