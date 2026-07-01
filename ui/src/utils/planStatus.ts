import type { PlanMilestoneWithTodos, PlanStatus, PlanTodo } from '@/types'

export function deriveMilestoneStatus(todos: Array<Pick<PlanTodo, 'status'>>): PlanStatus {
  if (todos.length === 0) return 'todo'
  if (todos.every((todo) => todo.status === 'done')) return 'done'
  if (todos.every((todo) => todo.status === 'todo')) return 'todo'
  return 'doing'
}

export function deriveMilestoneCompletedAt(
  nextStatus: PlanStatus,
  previousCompletedAt?: string | null,
): string | null {
  if (nextStatus === 'done') return previousCompletedAt ?? new Date().toISOString()
  return null
}

export function withDerivedMilestoneStatus<T extends PlanMilestoneWithTodos>(milestone: T): T {
  const nextStatus = deriveMilestoneStatus(milestone.todos)
  return {
    ...milestone,
    status: nextStatus,
    completed_at: deriveMilestoneCompletedAt(nextStatus, milestone.completed_at),
  }
}
