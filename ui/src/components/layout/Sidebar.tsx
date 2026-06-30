import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Compass, Columns3, Settings, LogOut, KeyRound, MessageCircle, FolderOpen, LayoutGrid, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { ABUSE_REPORT_URL, cn, FEEDBACK_URL, ROUTES } from '@/utils'
import { getCoverGradient } from '@/utils/coverGradient'
import { useAuthStore } from '@/stores/authStore'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { authService } from '@/services/auth.service'
import type { Project } from '@/types'

function ProjectItem({ project }: { project: Project }) {
  return (
    <NavLink
      to={ROUTES.PROJECT_DETAIL.replace(':id', project.id)}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] transition-colors',
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50',
        )
      }
    >
      <div
        className="h-8 w-8 shrink-0 rounded-[5px] overflow-hidden border border-border"
        style={!project.cover_image_url ? { background: getCoverGradient(project) } : undefined}
      >
        {project.cover_image_url && (
          <img src={project.cover_image_url} className="h-full w-full object-cover" alt="" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[12px] font-semibold text-ink-secondary">
          {project.title}
        </div>
      </div>
    </NavLink>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { owned, shared } = useProjects(user?.id)

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
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-56px)] w-60 flex-col border-r border-border bg-paper px-2.5 py-4 md:flex">

        {/* Main nav */}
        <div className="flex flex-col gap-0.5 mb-1">
          <NavLink
            to={ROUTES.EXPLORE}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-accent/10 font-semibold text-accent'
                  : 'text-ink-tertiary hover:bg-gray-50 hover:text-ink-secondary',
              )
            }
          >
            <Compass size={14} className="shrink-0" />
            Explore
          </NavLink>

          <NavLink
            to={ROUTES.KANBAN}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-accent/10 font-semibold text-accent'
                  : 'text-ink-tertiary hover:bg-gray-50 hover:text-ink-secondary',
              )
            }
          >
            <Columns3 size={14} className="shrink-0" />
            Kanban
          </NavLink>

          <NavLink
            to={ROUTES.PROJECTS}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-accent/10 font-semibold text-accent'
                  : 'text-ink-tertiary hover:bg-gray-50 hover:text-ink-secondary',
              )
            }
          >
            <LayoutGrid size={14} className="shrink-0" />
            Projects
          </NavLink>

          <NavLink
            to={ROUTES.AGENT_ACCESS}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-accent/10 font-semibold text-accent'
                  : 'text-ink-tertiary hover:bg-gray-50 hover:text-ink-secondary',
              )
            }
          >
            <KeyRound size={14} className="shrink-0" />
            Agents
          </NavLink>
        </div>

        {/* Divider */}
        <div className="my-2 h-px bg-gray-100" />

        {/* Projects */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">
              Projects
            </span>
            <Link
              to={ROUTES.NEW_PROJECT}
              className="flex items-center gap-0.5 text-[11px] font-medium text-accent hover:text-accent-dark transition-colors"
            >
              <span className="text-base leading-none">+</span> New
            </Link>
          </div>

          <div className="flex flex-col gap-0.5">
            {owned.map((p) => <ProjectItem key={p.id} project={p} />)}
            {owned.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-ink-disabled">No projects yet.</p>
            )}
          </div>

          {shared.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-disabled">
                Shared with me
              </div>
              <div className="flex flex-col gap-0.5">
                {shared.map((p) => <ProjectItem key={p.id} project={p} />)}
              </div>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="mt-auto border-t border-gray-100 pt-3 flex flex-col gap-0.5">
          {profileTo && (
            <NavLink
              to={profileTo}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                  isActive
                    ? 'bg-accent/10 font-semibold text-accent'
                    : 'text-ink-tertiary hover:bg-gray-50 hover:text-ink-secondary',
                )
              }
            >
              <Settings size={14} className="shrink-0" />
              Settings
            </NavLink>
          )}

          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-tertiary transition-colors hover:bg-gray-50 hover:text-ink-secondary"
          >
            <MessageCircle size={14} className="shrink-0" />
            Feedback
          </a>

          <a
            href={ABUSE_REPORT_URL}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-tertiary transition-colors hover:bg-red-50 hover:text-danger"
          >
            <ShieldAlert size={14} className="shrink-0" />
            Report abuse
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-tertiary transition-colors hover:bg-red-50 hover:text-danger"
          >
            <LogOut size={14} className="shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-paper/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {[
            { label: 'Explore',  to: ROUTES.EXPLORE,      Icon: Compass },
            { label: 'Projects', to: ROUTES.PROJECTS,     Icon: FolderOpen },
            { label: 'Agents',   to: ROUTES.AGENT_ACCESS, Icon: KeyRound },
          ].map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-ink-disabled hover:text-ink-tertiary',
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {profileTo ? (
            <NavLink
              to={profileTo}
              end
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-ink-disabled hover:text-ink-tertiary',
                )
              }
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium text-ink-disabled hover:text-danger transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
