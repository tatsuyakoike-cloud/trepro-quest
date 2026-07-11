import { loadConfig, isSheetsApiConfigured } from './config'
import {
  fetchAllFromApi,
  loginViaApi,
  pingApi,
  updateProgressViaApi,
} from './sheetsApi'
import { getLocalPassword, validateLocalCredentials } from './auth'
import {
  localGetMembers,
  localGetMissions,
  localGetProgresses,
  localUpdateMemberTitle,
  localUpdateProgress,
} from './localDb'
import type {
  Member,
  MemberProgress,
  Mission,
  ProgressUpdateInput,
} from '../types'
import { getTitleFromPassedCount } from './level'

let cachedConfig: Awaited<ReturnType<typeof loadConfig>> | null = null

async function getConfig() {
  if (!cachedConfig) cachedConfig = await loadConfig()
  return cachedConfig
}

export async function isSheetsApiReachable(): Promise<boolean> {
  const config = await getConfig()
  if (!isSheetsApiConfigured(config)) return false
  return pingApi(config)
}

export async function fetchAllData(): Promise<{
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  source: 'sheets' | 'local'
}> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config) && (await pingApi(config))) {
    try {
      const data = await fetchAllFromApi(config)
      return { ...data, source: 'sheets' }
    } catch {
      // fall through to local
    }
  }
  const members = localGetMembers()
  const missions = localGetMissions()
  const progresses = localGetProgresses()
  await syncMemberTitles(members, progresses)
  return { members, missions, progresses, source: 'local' }
}

/**
 * ログインは組み込みアカウントを優先（API不要）。
 * API接続時はシート上のプロフィールがあればそちらを使用。
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ profile: import('../types').Profile | null; error: string | null }> {
  const localResult = validateLocalCredentials(email, password)
  if (localResult.error) return localResult

  const config = await getConfig()
  if (isSheetsApiConfigured(config) && (await pingApi(config))) {
    const apiResult = await loginViaApi(config, email, password)
    if (apiResult.profile) return { profile: apiResult.profile, error: null }
  }

  return { profile: localResult.profile, error: null }
}

export async function updateProgress(
  progressId: string,
  input: ProgressUpdateInput,
  updatedBy: string | null,
): Promise<{ progress: MemberProgress; savedTo: 'sheets' | 'local' }> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config) && (await pingApi(config))) {
    try {
      const progress = await updateProgressViaApi(config, progressId, input, updatedBy)
      return { progress, savedTo: 'sheets' }
    } catch {
      // fall through to local
    }
  }
  const progress = localUpdateProgress(progressId, input, updatedBy)
  return { progress, savedTo: 'local' }
}

export async function syncMemberTitles(
  members: Member[],
  progresses: MemberProgress[],
): Promise<void> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config) && (await pingApi(config))) return

  for (const member of members) {
    const passed = progresses.filter(
      (p) => p.member_id === member.id && p.result === '合格',
    ).length
    const title = getTitleFromPassedCount(passed)
    if (member.title !== title) {
      localUpdateMemberTitle(member.id, title)
    }
  }
}

export function isValidUrl(url: string): boolean {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateProgressUpdate(
  input: ProgressUpdateInput,
): string | null {
  if (input.tldb_url && !isValidUrl(input.tldb_url)) {
    return 'URLの形式が正しくありません'
  }
  if (input.result === '合格' && !input.feedback?.trim()) {
    return '合格の場合はフィードバックが必須です'
  }
  if (input.result === '不合格') {
    if (!input.next_action?.trim()) return '不合格の場合は次回アクションが必須です'
    if (!input.due_date) return '不合格の場合は期限が必須です'
  }
  return null
}

// テスト・互換用
export { getLocalPassword }
