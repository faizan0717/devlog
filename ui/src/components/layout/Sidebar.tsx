import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, Compass, User, LogOut, KeyRound, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/utils'
import { cn } from '@/utils'

const navItems = [
  { label: 'Projects', to: ROUTES.PROJECTS, Icon: FolderOpen },
  { label: 'Explore', to: ROUTES.EXPLORE, Icon: Compass },
  { label: 'Agents', to: ROUTES.AGENT_ACCESS, Icon: KeyRound },
]

const feedbackHref = 'https://github.com/faizan0717/devlog/issues/new?title=Beta%20feedback'

export function Sidebar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  const username = user?.profile?.username
  const profileTo = username ? ROUTES.PUBLIC_PROFILE.replace(':username', username) : null

  async function handleLogout() {
    try {
      await authService.signOut()
      signOut()
      navigate(ROUTES.LOGIN, { replace: true })
      toast.success('Logged out')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log out')
    }
  }

  return (
    <>
      {/* Desktop rail */}
      <motion.aside
        initial={false}
        whileHover="expanded"
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col md:flex"
      >
        <motion.div
          variants={{ expanded: { width: 160 } }}
          initial={{ width: 52 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="glass flex flex-col gap-1 overflow-hidden rounded-[26px] border border-white/10 px-2 py-3 shadow-xl"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,111,224,0.08)' }}
        >
          {navItems.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 transition-colors duration-150',
                  isActive
                    ? 'bg-accent/20 text-accent-light'
                    : 'text-ink-secondary hover:bg-white/6 hover:text-ink-primary',
                )
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <motion.span
                variants={{ expanded: { opacity: 1, x: 0 } }}
                initial={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="overflow-hidden whitespace-nowrap text-body"
              >
                {label}
              </motion.span>
            </NavLink>
          ))}

          <div className="mx-2 my-2 h-px bg-white/10" />

          {profileTo ? (
            <NavLink
              to={profileTo}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 transition-colors duration-150',
                  isActive
                    ? 'bg-accent/20 text-accent-light'
                    : 'text-ink-secondary hover:bg-white/6 hover:text-ink-primary',
                )
              }
            >
              <User size={18} className="flex-shrink-0" />
              <motion.span
                variants={{ expanded: { opacity: 1, x: 0 } }}
                initial={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="overflow-hidden whitespace-nowrap text-body"
              >
                Profile
              </motion.span>
            </NavLink>
          ) : (
            <div className="flex cursor-default items-center gap-3 rounded-[18px] px-2.5 py-2.5 text-ink-tertiary">
              <User size={18} className="flex-shrink-0" />
              <motion.span
                variants={{ expanded: { opacity: 1, x: 0 } }}
                initial={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="overflow-hidden whitespace-nowrap text-body"
              >
                Profile
              </motion.span>
            </div>
          )}

          <a
            href={feedbackHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 text-ink-secondary transition-colors duration-150 hover:bg-white/6 hover:text-ink-primary"
          >
            <MessageCircle size={18} className="flex-shrink-0" />
            <motion.span
              variants={{ expanded: { opacity: 1, x: 0 } }}
              initial={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="overflow-hidden whitespace-nowrap text-body"
            >
              Feedback
            </motion.span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-[18px] px-2.5 py-2.5 text-ink-secondary transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
            aria-label="Log out"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <motion.span
              variants={{ expanded: { opacity: 1, x: 0 } }}
              initial={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="overflow-hidden whitespace-nowrap text-body"
            >
              Logout
            </motion.span>
          </button>
        </motion.div>
      </motion.aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface-950/85 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 overflow-x-auto rounded-[24px] border border-white/10 bg-surface-900/80 p-1.5 shadow-glass">
          {navItems.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'bg-accent/20 text-accent-light' : 'text-ink-tertiary hover:text-ink-primary',
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {profileTo && (
            <NavLink
              to={profileTo}
              end
              className={({ isActive }) =>
                cn(
                  'flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'bg-accent/20 text-accent-light' : 'text-ink-tertiary hover:text-ink-primary',
                )
              }
            >
              <User size={18} />
              <span>Profile</span>
            </NavLink>
          )}

          <a
            href={feedbackHref}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-medium text-ink-tertiary transition-colors hover:text-ink-primary"
          >
            <MessageCircle size={18} />
            <span>Feedback</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-medium text-ink-tertiary transition-colors hover:text-danger"
            aria-label="Log out"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}
