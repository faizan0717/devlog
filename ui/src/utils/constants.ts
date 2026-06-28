export const APP_NAME = 'devLog'
export const APP_DESCRIPTION = 'A cinematic timeline platform for makers'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  TODOS: '/todos',
  ROADMAP: '/roadmap',
  PROJECT_DETAIL: '/projects/:id',
  NEW_PROJECT: '/projects/new',
  PROFILE: '/profile/:username',
  AGENT_ACCESS: '/agent-access',
  EXPLORE: '/explore',
  PUBLIC_PROFILE: '/u/:username',
  PUBLIC_PROJECT: '/p/:id',
  PUBLIC_LOG: '/p/:projectId/logs/:logId',
  SUPPORT: '/support',
  NOT_FOUND: '*',
} as const

export const SUPPORT_EMAIL = 'support@devlog.one'
export const FEEDBACK_URL = 'https://github.com/faizan0717/devlog/issues/new?title=Beta%20feedback'
export const ABUSE_REPORT_URL = `mailto:${SUPPORT_EMAIL}?subject=devLog%20abuse%20report`

export const TRANSITION_DURATION = 0.35
