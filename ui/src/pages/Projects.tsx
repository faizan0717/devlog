import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { ProjectGrid } from '@/features/projects/components/ProjectGrid'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'
import { cn } from '@/utils'

type Tab = 'all' | 'mine' | 'shared'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',    label: 'All' },
  { value: 'mine',   label: 'Mine' },
  { value: 'shared', label: 'Shared' },
]

export default function Projects() {
  const user = useAuthStore((s) => s.user)
  const { owned, shared, loading } = useProjects(user?.id)
  const [tab, setTab] = useState<Tab>('all')

  const allProjects = [...owned, ...shared].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  )

  const displayed = tab === 'all' ? allProjects : tab === 'mine' ? owned : shared
  const total = allProjects.length

  return (
    <AnimatedPage className="max-w-5xl pb-24">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-disabled mb-1">Your work</p>
          <h1 className="font-serif italic text-[2rem] leading-[1.15] tracking-[-0.02em] text-ink-primary">
            Projects
            {!loading && total > 0 && (
              <span className="ml-3 font-mono text-[1rem] not-italic text-ink-disabled">{total}</span>
            )}
          </h1>
        </div>
        <Link
          to={ROUTES.NEW_PROJECT}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-dark"
        >
          <Plus size={14} /> New project
        </Link>
      </div>

      {/* Filter tabs */}
      {(owned.length > 0 || shared.length > 0) && (
        <div className="mb-6 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 font-mono text-[12px] transition-colors',
                tab === t.value
                  ? 'bg-ink-primary text-white'
                  : 'text-ink-tertiary hover:bg-gray-100 hover:text-ink-secondary',
              )}
            >
              {t.label}
              {t.value === 'mine' && owned.length > 0 && (
                <span className={cn('ml-1.5', tab === t.value ? 'text-white/60' : 'text-ink-disabled')}>
                  {owned.length}
                </span>
              )}
              {t.value === 'shared' && shared.length > 0 && (
                <span className={cn('ml-1.5', tab === t.value ? 'text-white/60' : 'text-ink-disabled')}>
                  {shared.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <ProjectGrid
        projects={displayed}
        loading={loading}
        emptyMessage={tab === 'shared' ? 'No one has added you to a project yet.' : 'No projects yet.'}
        emptyAction={
          tab !== 'shared' ? (
            <Link
              to={ROUTES.NEW_PROJECT}
              className="text-[13px] text-accent hover:text-accent-dark transition-colors"
            >
              Create your first project →
            </Link>
          ) : undefined
        }
      />
    </AnimatedPage>
  )
}
