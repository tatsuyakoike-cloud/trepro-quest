import type {
  DashboardKpi,
  Member,
  MemberProgress,
  MemberStats,
  Mission,
  ProgressWithMission,
} from '../types'
import {
  getLevelFromPassedCount,
  getLevelLabel,
  getProgressRate,
  getTitleFromPassedCount,
  TOTAL_STEPS,
} from './level'

export function buildProgressWithMission(
  progresses: MemberProgress[],
  missions: Mission[],
): ProgressWithMission[] {
  const missionMap = new Map(missions.map((m) => [m.id, m]))
  return progresses
    .map((p) => ({
      ...p,
      mission: missionMap.get(p.mission_id)!,
    }))
    .filter((p) => p.mission)
    .sort((a, b) => a.mission.sort_order - b.mission.sort_order)
}

export function computeMemberStats(
  member: Member,
  allProgresses: ProgressWithMission[],
): MemberStats {
  const progresses = allProgresses.filter((p) => p.member_id === member.id)
  const passedCount = progresses.filter((p) => p.result === '合格').length
  const pendingReviewCount = progresses.filter((p) => p.status === '審査待ち').length
  const retryCount = progresses.filter((p) => p.status === '再挑戦').length
  const nextMission =
    progresses.find(
      (p) => p.result !== '合格' && p.status !== '完了',
    )?.mission ?? null

  const lastUpdated = progresses.reduce<string | null>((latest, p) => {
    if (!latest || p.updated_at > latest) return p.updated_at
    return latest
  }, null)

  return {
    member: {
      ...member,
      title: getTitleFromPassedCount(passedCount),
    },
    level: getLevelFromPassedCount(passedCount),
    levelLabel: getLevelLabel(passedCount),
    title: getTitleFromPassedCount(passedCount),
    progressRate: getProgressRate(passedCount),
    passedCount,
    pendingReviewCount,
    retryCount,
    nextMission,
    lastUpdated,
    progresses,
  }
}

function isOverdue(p: ProgressWithMission): boolean {
  if (!p.due_date) return false
  if (p.status === '完了' || p.result === '合格') return false
  const today = new Date().toISOString().slice(0, 10)
  return p.due_date < today
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return date >= weekAgo && date <= now
}

export function computeAllMemberStats(
  members: Member[],
  missions: Mission[],
  progresses: MemberProgress[],
): MemberStats[] {
  const withMission = buildProgressWithMission(progresses, missions)
  return members.map((m) => computeMemberStats(m, withMission))
}

export function computeMemberStatsBySlug(
  slug: string,
  members: Member[],
  missions: Mission[],
  progresses: MemberProgress[],
): MemberStats | null {
  const member = members.find((m) => m.slug === slug)
  if (!member) return null
  const withMission = buildProgressWithMission(progresses, missions)
  return computeMemberStats(member, withMission)
}

export function computeDashboardKpi(
  members: Member[],
  missions: Mission[],
  progresses: MemberProgress[],
): DashboardKpi {
  const stats = computeAllMemberStats(members, missions, progresses)
  const allProgresses = stats.flatMap((s) => s.progresses)
  return {
    totalSteps: TOTAL_STEPS * stats.length,
    totalPassed: stats.reduce((sum, s) => sum + s.passedCount, 0),
    pendingReview: stats.reduce((sum, s) => sum + s.pendingReviewCount, 0),
    retryCount: stats.reduce((sum, s) => sum + s.retryCount, 0),
    completedThisWeek: allProgresses.filter(
      (p) => p.status === '完了' && isThisWeek(p.updated_at),
    ).length,
    overdueCount: allProgresses.filter(isOverdue).length,
  }
}
