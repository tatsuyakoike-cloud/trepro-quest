import { create } from 'zustand'
import type {
  Member,
  MemberProgress,
  Mission,
  ProgressUpdateInput,
} from '../types'
import { fetchAllData, syncMemberTitles, updateProgress } from '../lib/api'
import { loadConfig, isSheetsApiConfigured } from '../lib/config'
import { getTitleFromPassedCount } from '../lib/level'

export type SyncMode = 'sheets' | 'local'

interface DataState {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  loading: boolean
  error: string | null
  syncMode: SyncMode
  lastSyncedAt: string | null
  pollTimer: ReturnType<typeof setInterval> | null
  visibilityHandler: (() => void) | null
  load: (options?: { silent?: boolean }) => Promise<void>
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
  syncMode: 'local',
  lastSyncedAt: null,
  pollTimer: null,
  visibilityHandler: null,

  load: async (options) => {
    const silent = options?.silent ?? false
    if (!silent) set({ loading: true, error: null })

    try {
      const config = await loadConfig()
      const sheetsMode = isSheetsApiConfigured(config)
      const { members, missions, progresses } = await fetchAllData()

      if (!sheetsMode) {
        await syncMemberTitles(members, progresses)
      }

      set({
        members,
        missions,
        progresses,
        loading: false,
        syncMode: sheetsMode ? 'sheets' : 'local',
        lastSyncedAt: new Date().toISOString(),
        error: null,
      })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'データの読み込みに失敗しました',
      })
    }
  },

  startPolling: (intervalMs) => {
    const { pollTimer, visibilityHandler } = get()
    if (pollTimer) clearInterval(pollTimer)
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }

    const timer = setInterval(() => {
      void get().load({ silent: true })
    }, intervalMs)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void get().load({ silent: true })
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    set({ pollTimer: timer, visibilityHandler: onVisible })
  },

  stopPolling: () => {
    const { pollTimer, visibilityHandler } = get()
    if (pollTimer) clearInterval(pollTimer)
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
    set({ pollTimer: null, visibilityHandler: null })
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
      const config = await loadConfig()
      const sheetsMode = isSheetsApiConfigured(config)
      const updated = await updateProgress(progressId, input, updatedBy)

      if (sheetsMode) {
        const fresh = await fetchAllData()
        const afterPassed = fresh.progresses.filter(
          (p) => p.member_id === memberId && p.result === '合格',
        ).length
        const leveledUp = input.result === '合格' && afterPassed > beforePassed
        const newTitle = leveledUp ? getTitleFromPassedCount(afterPassed) : null

        set({
          members: fresh.members,
          missions: fresh.missions,
          progresses: fresh.progresses,
          lastSyncedAt: new Date().toISOString(),
          syncMode: 'sheets',
        })

        void memberName
        return { error: null, leveledUp, newTitle }
      }

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
