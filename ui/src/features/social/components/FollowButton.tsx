import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils'
import { useFollow } from '../hooks/useFollow'

interface FollowButtonProps {
  targetUserId: string
  currentUserId?: string
  size?: 'sm' | 'md'
}

export function FollowButton({ targetUserId, currentUserId, size = 'md' }: FollowButtonProps) {
  const { isFollowing, loading, follow, unfollow } = useFollow(targetUserId, currentUserId)
  const [hoveringUnfollow, setHoveringUnfollow] = useState(false)

  if (currentUserId === targetUserId) return null

  if (!currentUserId) {
    return (
      <Link
        to="/login"
        className={cn(
          'rounded-glass font-medium border transition-all duration-150',
          'bg-accent/15 text-accent-light border-accent/30 hover:bg-accent/25',
          size === 'sm' ? 'px-3 py-1 text-caption' : 'px-5 py-2 text-body',
        )}
      >
        Follow
      </Link>
    )
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={isFollowing ? unfollow : follow}
      disabled={loading}
      onMouseEnter={() => isFollowing && setHoveringUnfollow(true)}
      onMouseLeave={() => setHoveringUnfollow(false)}
      className={cn(
        'rounded-glass font-medium border transition-all duration-150 disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1 text-caption' : 'px-5 py-2 text-body',
        isFollowing
          ? hoveringUnfollow
            ? 'bg-danger/10 border-danger/40 text-danger'
            : 'bg-surface-800 border-surface-600 text-ink-secondary'
          : 'bg-accent/15 border-accent/30 text-accent-light hover:bg-accent/25',
      )}
    >
      {isFollowing ? (hoveringUnfollow ? 'Unfollow' : 'Following') : 'Follow'}
    </motion.button>
  )
}
