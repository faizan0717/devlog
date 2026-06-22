import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { Avatar, Spinner } from '@/components/ui'
import { formatDate } from '@/utils'
import { scaleIn } from '@/lib/motion'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationWithActor, NotificationType } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'

function notificationText(n: NotificationWithActor): string {
  switch (n.type as NotificationType) {
    case 'follow':   return 'started following you'
    case 'comment':  return 'commented on your log'
    case 'reaction': return 'reacted to your log'
  }
}

function notificationHref(n: NotificationWithActor): string {
  if (n.type === 'follow') return `/u/${n.actor.username}`
  if (n.log_id && n.project_id) return `/p/${n.project_id}/logs/${n.log_id}`
  return '/explore'
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user)
  const { data: notifications, loading, unreadCount, markRead, markAllRead } = useNotifications(user?.id)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-glass text-ink-secondary hover:text-ink-primary hover:bg-surface-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 top-full mt-2 w-80 glass-elevated rounded-glass border border-white/8 shadow-glass-lg z-50 overflow-hidden sm:block hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-body font-medium text-ink-primary">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-caption text-ink-tertiary hover:text-accent-light transition-colors"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="flex justify-center py-6"><Spinner size="sm" /></div>
              )}
              {!loading && (!notifications || notifications.length === 0) && (
                <div className="py-8 text-center text-body text-ink-tertiary">
                  You're all caught up.
                </div>
              )}
              {!loading && notifications && notifications.map((n) => (
                <Link
                  key={n.id}
                  to={notificationHref(n)}
                  onClick={() => { markRead(n.id); setOpen(false) }}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-surface-700/50 transition-colors border-b border-white/3',
                    !n.read_at && 'border-l-2 border-l-accent bg-accent/5',
                  )}
                >
                  <Avatar src={n.actor.avatar_url} name={n.actor.username} size="sm" className="flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-ink-secondary">
                      <span className="text-ink-primary font-medium">@{n.actor.username}</span>{' '}
                      {notificationText(n)}
                    </p>
                    <p className="text-label text-ink-disabled mt-0.5">{formatDate(n.created_at, 'relative')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 glass-elevated rounded-t-glass border-t border-white/8 z-50 max-h-[70vh] flex flex-col sm:hidden"
          >
            <div className="w-10 h-1 rounded-full bg-surface-600 mx-auto mt-3 mb-1 flex-shrink-0" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
              <span className="text-body font-medium text-ink-primary">Notifications</span>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-caption text-ink-tertiary hover:text-accent-light transition-colors">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="flex justify-center py-6"><Spinner size="sm" /></div>
              )}
              {!loading && (!notifications || notifications.length === 0) && (
                <div className="py-8 text-center text-body text-ink-tertiary">
                  You're all caught up.
                </div>
              )}
              {!loading && notifications?.map((n) => (
                <Link
                  key={n.id}
                  to={notificationHref(n)}
                  onClick={() => { markRead(n.id); setOpen(false) }}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-surface-700/50 transition-colors border-b border-white/3',
                    !n.read_at && 'border-l-2 border-l-accent bg-accent/5',
                  )}
                >
                  <Avatar src={n.actor.avatar_url} name={n.actor.username} size="sm" className="flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-caption text-ink-secondary">
                      <span className="text-ink-primary font-medium">@{n.actor.username}</span>{' '}
                      {notificationText(n)}
                    </p>
                    <p className="text-label text-ink-disabled mt-0.5">{formatDate(n.created_at, 'relative')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
