import type { Member, MemberProgress, Mission, Profile, ProgressUpdateInput } from '../types'
import type { AppConfig } from './config'

export interface SheetsData {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  titles: { level: string; title: string }[]
}

function apiUrl(config: AppConfig, params?: Record<string, string>): string {
  const base = config.syncApiUrl
  const qs = new URLSearchParams({ ...params, t: String(Date.now()) })
  return `${base}${base.includes('?') ? '&' : '?'}${qs.toString()}`
}

export async function fetchAllFromApi(config: AppConfig): Promise<SheetsData> {
  const res = await fetch(apiUrl(config, { action: 'fetchAll' }), { cache: 'no-store' })
  const payload = await res.json()
  if (!payload.ok) throw new Error(payload.message || 'データ取得に失敗しました')

  const members: Member[] = payload.data.members
  const missions: Mission[] = payload.data.missions
  const progresses: MemberProgress[] = payload.data.progresses.map(
    (p: MemberProgress & { member_slug?: string }) => ({
      ...p,
      member_id:
        members.find((m) => m.slug === p.member_slug)?.id ?? p.member_id,
    }),
  )

  return {
    members,
    missions,
    progresses,
    titles: payload.data.titles ?? [],
  }
}

export async function loginViaApi(
  config: AppConfig,
  email: string,
  password: string,
): Promise<{ profile: Profile | null; error: string | null }> {
  const res = await fetch(config.syncApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'login', email, password }),
  })
  const payload = await res.json()
  if (!payload.ok) return { profile: null, error: payload.message || 'ログインに失敗しました' }
  return { profile: payload.profile as Profile, error: null }
}

export async function updateProgressViaApi(
  config: AppConfig,
  progressId: string,
  input: ProgressUpdateInput,
  updatedBy: string | null,
): Promise<MemberProgress> {
  const res = await fetch(config.syncApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'updateProgress',
      progressId,
      data: { ...input, updated_by: updatedBy },
    }),
  })
  const payload = await res.json()
  if (!payload.ok) throw new Error(payload.message || '保存に失敗しました')
  return payload.progress as MemberProgress
}

export async function pingApi(config: AppConfig): Promise<boolean> {
  if (!config.syncApiUrl) return false
  try {
    const res = await fetch(apiUrl(config), { cache: 'no-store' })
    const payload = await res.json()
    return payload.ok === true
  } catch {
    return false
  }
}
