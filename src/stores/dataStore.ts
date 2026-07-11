import { create } from 'zustand'
import type {
  Member,
  MemberProgress,
  Mission,
  ProgressUpdateInput,
} from '../types'
import {
  fetchAllData,
  isSheetsApiReachable,
  updateProgress,
} from '../lib/api'
import { loadConfig, isSheetsApiConfigured } from '../lib/config'
import { getTitleFromPassedCount } from '../lib/level'

export type SyncMode = 'local' | 'sheets' | 'offline'

interface DataState {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  loading: boolean
  error: string | null
  syncMode: SyncMode
  syncMessage: string | null
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
  ) => Promise<{
    error: string | null
    warning: string | null
    leveledUp: boolean
    newTitle: string | null
  }>
}

const OFFLINE_MESSAGE =
  'シートAPIに接続できません。Apps Scriptのデプロイで「アクセス: 全員」に設定し、再デプロイしてください。'

async function resolveSyncState(): Promise<{
  syncMode: SyncMode
  syncMessage: string | null
}> {
  const config = await loadConfig()
  if (!isSheetsApiConfigured(config)) {
    return { syncMode: 'local', syncMessage: null }
  }
  const reachable = await isSheetsApiReachable()
  if (reachable) {
    return { syncMode: 'sheets', syncMessage: null }
  }
  return { syncMode: 'offline', syncMessage: OFFLINE_MESSAGE }
}

export const useDataStore = create<DataState>((set, get) => ({
  members: [],
  missions: [],
  progresses: [],
  loading: false,
  error: null,
  syncMode: 'local',
  syncMessage: null,
  lastSyncedAt: null,
  pollTimer: null,
  visibilityHandler: null,

  load: async (options) => {
    const silent = options?.silent ?? false
    if (!silent) set({ loading: true, error: null })

    try {
      const { members, missions, progresses, source } = await fetchAllData()
      const sync = await resolveSyncState()

      set({
        members,
        missions,
        progresses,
        loading: false,
        syncMode: source === 'sheets' ? 'sheets' : sync.syncMode,
        syncMessage: source === 'sheets' ? null : sync.syncMessage,
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
      void (async () => {
        if (await isSheetsApiReachable()) {
          void get().load({ silent: true })
        }
      })()
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
    if (!current) {
      return { error: '進捗が見つかりません', warning: null, leveledUp: false, newTitle: null }
    }

    const memberId = current.member_id
    const beforePassed = progresses.filter(
      (p) => p.member_id === memberId && p.result === '合格',
    ).length

    try {
      const { progress: updated, savedTo } = await updateProgress(
        progressId,
        input,
        updatedBy,
      )

      let warning: string | null = null
      let members = get().members
      let missions = get().missions
      let newProgresses = progresses.map((p) => (p.id === progressId ? updated : p))

      if (savedTo === 'sheets') {
        const fresh = await fetchAllData()
        if (fresh.source === 'sheets') {
          members = fresh.members
          missions = fresh.missions
          newProgresses = fresh.progresses
        }
      } else {
        warning = OFFLINE_MESSAGE
        const sync = await resolveSyncState()
        if (sync.syncMode === 'offline') {
          const leveledUpLocal =
            input.result === '合格' &&
            newProgresses.filter((p) => p.member_id === memberId && p.result === '合格').length >
              beforePassed
          if (leveledUpLocal) {
            const newTitle = getTitleFromPassedCount(
              newProgresses.filter((p) => p.member_id === memberId && p.result === '合格').length,
            )
            members = members.map((m) =>
              m.id === memberId ? { ...m, title: newTitle } : m,
            )
          }
        }
      }

      const afterPassed = newProgresses.filter(
        (p) => p.member_id === memberId && p.result === '合格',
      ).length
      const leveledUp = input.result === '合格' && afterPassed > beforePassed
      const newTitle = leveledUp ? getTitleFromPassedCount(afterPassed) : null

      const sync = await resolveSyncState()
      set({
        members,
        missions,
        progresses: newProgresses,
        lastSyncedAt: new Date().toISOString(),
        syncMode: savedTo === 'sheets' ? 'sheets' : sync.syncMode,
        syncMessage: savedTo === 'sheets' ? null : sync.syncMessage,
      })

      void memberName
      return { error: null, warning, leveledUp, newTitle }
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : '保存に失敗しました',
        warning: null,
        leveledUp: false,
        newTitle: null,
      }
    }
  },
}))
