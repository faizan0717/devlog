import { motion } from 'framer-motion'
import { cn } from '@/utils'
import { useReactions } from '../hooks/useReactions'
import type { ReactionType } from '@/types'

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'heart',  emoji: '♥',  label: 'Heart' },
  { type: 'fire',   emoji: '🔥', label: 'Fire' },
  { type: 'rocket', emoji: '🚀', label: 'Rocket' },
]

interface ReactionBarProps {
  logId: string
  userId?: string
  logOwnerId: string
  projectId: string
}

export function ReactionBar({ logId, userId, logOwnerId, projectId }: ReactionBarProps) {
  const { data: reactions, toggle } = useReactions(logId, userId)

  if (!reactions) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {reactions.map(({ type, count, reacted }) => {
        const meta = REACTIONS.find((r) => r.type === type)!
        return (
          <motion.button
            key={type}
            type="button"
            onClick={() => userId && toggle(type, logOwnerId, projectId)}
            disabled={!userId}
            whileTap={userId ? { scale: 0.88 } : {}}
            aria-label={meta.label}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-caption font-medium border transition-all duration-150',
              reacted
                ? 'bg-accent/15 border-accent/40 text-accent-light'
                : 'bg-surface-800 border-surface-700 text-ink-secondary hover:border-surface-500 hover:text-ink-primary',
              !userId && 'cursor-default opacity-70',
            )}
          >
            <span>{meta.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}
