import { useState, useEffect, useCallback } from 'react'
import { followsService } from '@/services/follows.service'

export function useFollow(targetUserId: string | undefined, currentUserId?: string) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })
  const [countsLoading, setCountsLoading] = useState(false)

  useEffect(() => {
    if (!targetUserId) return
    setCountsLoading(true)
    followsService
      .getCounts(targetUserId)
      .then(setCounts)
      .catch(() => {})
      .finally(() => setCountsLoading(false))
  }, [targetUserId])

  useEffect(() => {
    if (!targetUserId || !currentUserId || targetUserId === currentUserId) return
    followsService
      .isFollowing(currentUserId, targetUserId)
      .then(setIsFollowing)
      .catch(() => {})
  }, [targetUserId, currentUserId])

  const follow = useCallback(async () => {
    if (!targetUserId || !currentUserId) return
    setLoading(true)
    try {
      await followsService.follow(currentUserId, targetUserId)
      setIsFollowing(true)
      setCounts((c) => ({ ...c, followers: c.followers + 1 }))
    } finally {
      setLoading(false)
    }
  }, [targetUserId, currentUserId])

  const unfollow = useCallback(async () => {
    if (!targetUserId || !currentUserId) return
    setLoading(true)
    try {
      await followsService.unfollow(currentUserId, targetUserId)
      setIsFollowing(false)
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }))
    } finally {
      setLoading(false)
    }
  }, [targetUserId, currentUserId])

  return { isFollowing, loading, follow, unfollow, counts, countsLoading }
}
