import { create } from 'zustand'
import type {
  Member,
  MemberProgress,
  Mission,
  ProgressUpdateInput,
} from '../types'
import { fetchAllData, syncMemberTitles, updateProgress } from '../lib/api'
import { getTitleFromPassedCount } from '../lib/level'

interface DataState {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  loading: boolean
  error: string | null
  pollTimer: ReturnType<typeof setInterval> | null
  load: () => Promise<void>
  startPolling: (intervalMs: number) => void
  stopPolling: () => void
  saveProgress: (
    progressId: string,
    input: ProgressUpdateInput,
    updatedBy: string | null,
    memberName: string,
  ) => Promise<{ error: string | null; leveledUp: boolean; newTitle: string | null }>
}

export const useDataStore = create<DataState>((set, get) => ({
  members: [],
  missions: [],
  progresses: [],
  loading: false,
  error: null,
  pollTimer: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const { members, missions, progresses } = await fetchAllData()
      await syncMemberTitles(members, progresses)
      set({ members, missions, progresses, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'データの読み込みに失敗しました',
      })
    }
  },

  startPolling: (intervalMs) => {
    const existing = get().pollTimer
    if (existing) clearInterval(existing)
    const timer = setInterval(() => {
      void get().load()
    }, intervalMs)
    set({ pollTimer: timer })
  },

  stopPolling: () => {
    const timer = get().pollTimer
    if (timer) clearInterval(timer)
    set({ pollTimer: null })
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
