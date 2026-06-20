import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, Compass, User, LogOut, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/utils'
import { cn } from '@/utils'

const navItems = [
  { label: 'Projects', to: ROUTES.PROJECTS, Icon: FolderOpen },
  { label: 'Explore',  to: ROUTES.EXPLORE,  Icon: Compass },
  { label: 'Agents',   to: ROUTES.AGENT_ACCESS, Icon: KeyRound },
]

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
    <motion.aside
      initial={false}
      whileHover="expanded"
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col"
    >
      <motion.div
        variants={{
          expanded: { width: 160 },
        }}
        initial={{ width: 52 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="glass border border-white/10 rounded-[26px] py-3 px-2 flex flex-col gap-1 shadow-xl overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,111,224,0.08)' }}
      >
        {navItems.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-[18px] transition-colors duration-150 group',
                isActive
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-white/6',
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <motion.span
              variants={{ expanded: { opacity: 1, x: 0 } }}
              initial={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="text-body whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          </NavLink>
        ))}

        <div className="h-px bg-white/10 mx-2 my-2" />

        {profileTo ? (
          <NavLink
            to={profileTo}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-[18px] transition-colors duration-150',
                isActive
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-white/6',
              )
            }
          >
            <User size={18} className="flex-shrink-0" />
            <motion.span
              variants={{ expanded: { opacity: 1, x: 0 } }}
              initial={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="text-body whitespace-nowrap overflow-hidden"
            >
              Profile
            </motion.span>
          </NavLink>
        ) : (
          <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-[18px] text-ink-tertiary cursor-default">
            <User size={18} className="flex-shrink-0" />
            <motion.span
              variants={{ expanded: { opacity: 1, x: 0 } }}
              initial={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="text-body whitespace-nowrap overflow-hidden"
            >
              Profile
            </motion.span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-[18px] text-ink-secondary hover:text-danger hover:bg-danger/10 transition-colors duration-150"
          aria-label="Log out"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <motion.span
            variants={{ expanded: { opacity: 1, x: 0 } }}
            initial={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-body whitespace-nowrap overflow-hidden"
          >
            Logout
          </motion.span>
        </button>
      </motion.div>
    </motion.aside>
  )
}
