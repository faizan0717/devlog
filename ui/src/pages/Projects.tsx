import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button } from '@/components/ui'
import { ProjectGrid } from '@/features/projects/components/ProjectGrid'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils'

type Tab = 'all' | 'mine' | 'shared'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'shared', label: 'Shared with me' },
]

export default function Projects() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { owned, shared, loading } = useProjects(user?.id)
  const [tab, setTab] = useState<Tab>('all')

  const allProjects = [...owned, ...shared].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  )

  const displayed =
    tab === 'all' ? allProjects : tab === 'mine' ? owned : shared

  return (
    <AnimatedPage>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline text-ink-primary">Projects</h1>
          <p className="text-body text-ink-secondary mt-1">Everything you&apos;re building.</p>
        </div>
        <Button onClick={() => navigate(ROUTES.NEW_PROJECT)}>New project</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-surface-800 relative">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`relative px-4 py-2.5 text-body transition-colors duration-150 ${
              tab === t.value ? 'text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            {t.label}
            {tab === t.value && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-px bg-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <ProjectGrid
        projects={displayed}
        loading={loading}
        emptyMessage={
          tab === 'shared'
            ? 'No one has added you to a project yet.'
            : 'No projects yet.'
        }
        emptyAction={
          tab !== 'shared' ? (
            <Button variant="ghost" onClick={() => navigate(ROUTES.NEW_PROJECT)}>
              Create your first project
            </Button>
          ) : undefined
        }
      />
    </AnimatedPage>
  )
}
