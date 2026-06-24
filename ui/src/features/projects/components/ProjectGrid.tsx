import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { ProjectCard } from './ProjectCard'
import type { Project, ProjectWithDetails } from '@/types'
import { cn } from '@/utils'

interface ProjectGridProps {
  projects: (Project | ProjectWithDetails)[]
  loading: boolean
  emptyMessage?: string
  emptyAction?: React.ReactNode
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden animate-pulse">
      <div className="aspect-[16/7] bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="flex justify-between gap-2">
          <div className="h-4 w-2/3 rounded bg-gray-100" />
          <div className="h-3 w-1/5 rounded bg-gray-100" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-4/5 rounded bg-gray-100" />
        </div>
        <div className="flex gap-1">
          <div className="h-4 w-12 rounded-full bg-gray-100" />
          <div className="h-4 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="h-3 w-1/4 rounded bg-gray-100" />
      </div>
    </div>
  )
}

export function ProjectGrid({ projects, loading, emptyMessage, emptyAction }: ProjectGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-body text-ink-tertiary">{emptyMessage ?? 'Nothing here yet.'}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4')}
    >
      {projects.map((project, i) => (
        <motion.div key={project.id} variants={fadeUp} custom={i}>
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </motion.div>
  )
}
