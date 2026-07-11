import { loadConfig, isSheetsApiConfigured } from './config'
import {
  fetchAllFromApi,
  loginViaApi,
  updateProgressViaApi,
} from './sheetsApi'
import {
  localGetMembers,
  localGetMissions,
  localGetProgresses,
  localGetProfileByEmail,
  localUpdateMemberTitle,
  localUpdateProgress,
  DEMO_PASSWORD,
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

export async function fetchMembers(): Promise<Member[]> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) {
    const data = await fetchAllFromApi(config)
    return data.members
  }
  return localGetMembers()
}

export async function fetchMissions(): Promise<Mission[]> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) {
    const data = await fetchAllFromApi(config)
    return data.missions
  }
  return localGetMissions()
}

export async function fetchProgresses(): Promise<MemberProgress[]> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) {
    const data = await fetchAllFromApi(config)
    return data.progresses
  }
  return localGetProgresses()
}

export async function fetchAllData(): Promise<{
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
}> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) {
    const data = await fetchAllFromApi(config)
    return data
  }
  return {
    members: localGetMembers(),
    missions: localGetMissions(),
    progresses: localGetProgresses(),
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ profile: import('../types').Profile | null; error: string | null }> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) {
    return loginViaApi(config, email, password)
  }

  const profile = localGetProfileByEmail(email)
  if (!profile) return { profile: null, error: '登録されていないメールアドレスです' }
  if (password !== getLocalPassword(email)) {
    return { profile: null, error: 'パスワードが正しくありません' }
  }
  return { profile, error: null }
}

function getLocalPassword(email: string): string {
  switch (email) {
    case 'admin@trepro.jp':
      return 'trepro2026'
    case 'asai@trepro.jp':
      return 'asai2026'
    case 'nakakuki@trepro.jp':
      return 'nakakuki2026'
    default:
      return DEMO_PASSWORD
  }
}

export async function updateProgress(
  progressId: string,
  input: ProgressUpdateInput,
  updatedBy: string | null,
): Promise<MemberProgress> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) {
    return updateProgressViaApi(config, progressId, input, updatedBy)
  }
  return localUpdateProgress(progressId, input, updatedBy)
}

export async function syncMemberTitles(
  members: Member[],
  progresses: MemberProgress[],
): Promise<void> {
  const config = await getConfig()
  if (isSheetsApiConfigured(config)) return

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
