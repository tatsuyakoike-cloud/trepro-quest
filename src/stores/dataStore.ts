import { create } from 'zustand'
import type {
  DashboardKpi,
  Member,
  MemberProgress,
  MemberStats,
  Mission,
  ProgressUpdateInput,
  ProgressWithMission,
} from '../types'
import {
  fetchMembers,
  fetchMissions,
  fetchProgresses,
  syncMemberTitles,
  updateProgress,
} from '../lib/api'
import {
  getLevelFromPassedCount,
  getLevelLabel,
  getProgressRate,
  getTitleFromPassedCount,
  TOTAL_STEPS,
} from '../lib/level'

interface DataState {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  getMemberStats: (slug: string) => MemberStats | null
  getAllMemberStats: () => MemberStats[]
  getDashboardKpi: () => DashboardKpi
  saveProgress: (
    progressId: string,
    input: ProgressUpdateInput,
    updatedBy: string | null,
    memberName: string,
  ) => Promise<{ error: string | null; leveledUp: boolean; newTitle: string | null }>
}

function buildProgressWithMission(
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

function computeMemberStats(
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

export const useDataStore = create<DataState>((set, get) => ({
  members: [],
  missions: [],
  progresses: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [members, missions, progresses] = await Promise.all([
        fetchMembers(),
        fetchMissions(),
        fetchProgresses(),
      ])
      await syncMemberTitles(members, progresses)
      set({ members, missions, progresses, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'データの読み込みに失敗しました',
      })
    }
  },

  getMemberStats: (slug) => {
    const { members, missions, progresses } = get()
    const member = members.find((m) => m.slug === slug)
    if (!member) return null
    const withMission = buildProgressWithMission(progresses, missions)
    return computeMemberStats(member, withMission)
  },

  getAllMemberStats: () => {
    const { members, missions, progresses } = get()
    const withMission = buildProgressWithMission(progresses, missions)
    return members.map((m) => computeMemberStats(m, withMission))
  },

  getDashboardKpi: () => {
    const stats = get().getAllMemberStats()
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
  },

  saveProgress: async (progressId, input, updatedBy, memberName) => {
    const { progresses } = get()
    const current = progresses.find((p) => p.id === progressId)
    if (!current) return { error: '進捗が見つかりません', leveledUp: false, newTitle: null }

    const memberId = current.member_id
    const beforePassed = progresses.filter(
      (p) => p.member_id === memberId && p.result === '合格',
    ).length

    try {
      const updated = await updateProgress(progressId, input, updatedBy)
      const newProgresses = progresses.map((p) =>
        p.id === progressId ? updated : p,
      )
      set({ progresses: newProgresses })

      const afterPassed = newProgresses.filter(
        (p) => p.member_id === memberId && p.result === '合格',
      ).length

      const leveledUp = input.result === '合格' && afterPassed > beforePassed
      const newTitle = leveledUp ? getTitleFromPassedCount(afterPassed) : null

      if (leveledUp && newTitle) {
        const members = get().members.map((m) =>
          m.id === memberId ? { ...m, title: newTitle } : m,
        )
        set({ members })
        const key = `trepro-level-${memberId}`
        localStorage.setItem(key, String(afterPassed))
      }

      void memberName
      return { error: null, leveledUp, newTitle }
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : '保存に失敗しました',
        leveledUp: false,
        newTitle: null,
      }
    }
  },
}))
