export type UserRole = 'admin' | 'member'

export type ProgressStatus =
  | '未着手'
  | '準備中'
  | '実施中'
  | '審査待ち'
  | '再挑戦'
  | '完了'

export type ProgressResult = '未審査' | '合格' | '不合格'

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  member_slug: string | null
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  name: string
  slug: string
  title: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Mission {
  id: string
  tab: string
  mission_group: string
  step_number: number
  level_name: string
  title: string
  description: string
  reviewer_name: string
  pass_criteria: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface MemberProgress {
  id: string
  member_id: string
  mission_id: string
  status: ProgressStatus
  result: ProgressResult
  executed_at: string | null
  feedback: string
  next_action: string
  due_date: string | null
  tldb_url: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  member_id: string
  mission_id: string
  action: string
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  updated_by: string | null
  created_at: string
}

export interface ProgressWithMission extends MemberProgress {
  mission: Mission
}

export interface MemberStats {
  member: Member
  level: number
  levelLabel: string
  title: string
  progressRate: number
  passedCount: number
  pendingReviewCount: number
  retryCount: number
  nextMission: Mission | null
  lastUpdated: string | null
  progresses: ProgressWithMission[]
}

export interface DashboardKpi {
  totalSteps: number
  totalPassed: number
  pendingReview: number
  retryCount: number
  completedThisWeek: number
  overdueCount: number
}

export interface ProgressUpdateInput {
  status?: ProgressStatus
  result?: ProgressResult
  executed_at?: string | null
  feedback?: string
  next_action?: string
  due_date?: string | null
  tldb_url?: string
}

export const PROGRESS_STATUSES: ProgressStatus[] = [
  '未着手',
  '準備中',
  '実施中',
  '審査待ち',
  '再挑戦',
  '完了',
]

export const PROGRESS_RESULTS: ProgressResult[] = ['未審査', '合格', '不合格']

export const STATUS_COLORS: Record<ProgressStatus, string> = {
  未着手: 'bg-gray-500',
  準備中: 'bg-blue-600',
  実施中: 'bg-cyan-500',
  審査待ち: 'bg-yellow-500',
  再挑戦: 'bg-red-600',
  完了: 'bg-green-600',
}

export const RESULT_COLORS: Record<ProgressResult, string> = {
  未審査: 'bg-gray-600',
  合格: 'bg-amber-500',
  不合格: 'bg-red-700',
}
