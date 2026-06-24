import type { Database } from './database'

export type Profile      = Database['public']['Tables']['profiles']['Row']
export type Project      = Database['public']['Tables']['projects']['Row']
export type Log          = Database['public']['Tables']['logs']['Row']
export type PlanMilestone = Database['public']['Tables']['plan_milestones']['Row']
export type PlanTodo      = Database['public']['Tables']['plan_todos']['Row']
export type AgentToken    = Database['public']['Tables']['agent_tokens']['Row']
export type Collaborator = Database['public']['Tables']['collaborators']['Row']
export type Comment      = Database['public']['Tables']['comments']['Row']
export type Follow       = Database['public']['Tables']['follows']['Row']
export type Reaction     = Database['public']['Tables']['reactions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type Visibility       = 'private' | 'public' | 'shared' | 'unlisted'
export type LogMood          = 'building' | 'shipped' | 'stuck' | 'reflecting' | 'inspired' | 'learning'
export type LogMedia         = { url: string; type: 'image' | 'video'; name: string }
export type PlanStatus       = 'pending' | 'doing' | 'done'
export type ReactionType     = 'heart' | 'fire' | 'rocket'
export type NotificationType = 'follow' | 'comment' | 'reaction'

export interface AuthUser {
  id: string
  email: string
  profile: Profile | null
}

export interface ApiError {
  message: string
  code?: string
}

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export type CollaboratorWithProfile = Collaborator & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

export type ProjectOwner = Pick<Profile, 'id' | 'username' | 'avatar_url'>

export type ProjectWithDetails = Project & {
  collaborators: CollaboratorWithProfile[]
  owner: ProjectOwner
}

export type PlanActor = Pick<Profile, 'id' | 'username' | 'avatar_url'>
export type PlanAgent = Pick<AgentToken, 'id' | 'name'>

export type PlanTodoWithSources = PlanTodo & {
  created_by_profile?: PlanActor | null
  completed_by_profile?: PlanActor | null
  created_by_agent?: PlanAgent | null
  completed_by_agent?: PlanAgent | null
}

export type PlanMilestoneWithTodos = PlanMilestone & {
  created_by_profile?: PlanActor | null
  created_by_agent?: PlanAgent | null
  todos: PlanTodoWithSources[]
}

export type CommentWithProfile = Comment & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

export type ReactionSummary = {
  type: ReactionType
  count: number
  reacted: boolean
}

export type NotificationWithActor = Notification & {
  actor: Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

export type PublicProject = Project & {
  owner: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  log_count: number
  trend_score?: number
}

export type PublicLog = Log & {
  project: Pick<Project, 'id' | 'title' | 'owner_id'> & {
    owner?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  }
  reactions: ReactionSummary[]
  comment_count: number
}

export type HeatmapData = Record<string, number>

export type SearchResults = {
  projects: PublicProject[]
  users:    Pick<Profile, 'id' | 'username' | 'avatar_url' | 'bio'>[]
  logs:     PublicLog[]
}
