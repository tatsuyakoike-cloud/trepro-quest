import type { Member, MemberProgress, Mission, Profile, ProgressUpdateInput } from '../types'
import type { AppConfig } from './config'

export interface SheetsData {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  titles: { level: string; title: string }[]
}

const API_ERROR_MESSAGE =
  'スプレッドシートAPIに接続できません。Apps Scriptのデプロイで「アクセス: 全員」に設定し、再デプロイしてください。'

function apiUrl(config: AppConfig, params?: Record<string, string>): string {
  const base = config.syncApiUrl
  const qs = new URLSearchParams({ ...params, t: String(Date.now()) })
  return `${base}${base.includes('?') ? '&' : '?'}${qs.toString()}`
}

async function requestApi<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; payload: T } | { ok: false; reachable: boolean; message: string }> {
  try {
    const res = await fetch(url, { ...init, redirect: 'follow' })
    const text = await res.text()
    try {
      const payload = JSON.parse(text) as T & { ok?: boolean; message?: string }
      if (payload && typeof payload === 'object' && 'ok' in payload && payload.ok === false) {
        return {
          ok: false,
          reachable: true,
          message: payload.message || 'リクエストに失敗しました',
        }
      }
      return { ok: true, payload }
    } catch {
      return { ok: false, reachable: false, message: API_ERROR_MESSAGE }
    }
  } catch {
    return { ok: false, reachable: false, message: API_ERROR_MESSAGE }
  }
}

export async function fetchAllFromApi(config: AppConfig): Promise<SheetsData> {
  const result = await requestApi<{
    ok: boolean
    message?: string
    data: SheetsData
  }>(apiUrl(config, { action: 'fetchAll' }), { cache: 'no-store' })

  if (!result.ok) throw new Error(result.message)

  const payload = result.payload
  if (!payload.data) throw new Error(payload.message || 'データ取得に失敗しました')

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
): Promise<{ profile: Profile | null; error: string | null; apiReachable: boolean }> {
  const result = await requestApi<{
    ok: boolean
    message?: string
    profile?: Profile
  }>(config.syncApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'login', email: email.trim(), password }),
  })

  if (!result.ok) {
    return { profile: null, error: result.message, apiReachable: result.reachable }
  }

  const payload = result.payload
  if (!payload.ok || !payload.profile) {
    return {
      profile: null,
      error: payload.message || 'ログインに失敗しました',
      apiReachable: true,
    }
  }

  return { profile: payload.profile, error: null, apiReachable: true }
}

export async function updateProgressViaApi(
  config: AppConfig,
  progressId: string,
  input: ProgressUpdateInput,
  updatedBy: string | null,
): Promise<MemberProgress> {
  const result = await requestApi<{
    ok: boolean
    message?: string
    progress?: MemberProgress
  }>(config.syncApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'updateProgress',
      progressId,
      data: { ...input, updated_by: updatedBy },
    }),
  })

  if (!result.ok) throw new Error(result.message)
  if (!result.payload.progress) {
    throw new Error(result.payload.message || '保存に失敗しました')
  }
  return result.payload.progress
}

export async function pingApi(config: AppConfig): Promise<boolean> {
  if (!config.syncApiUrl) return false
  const result = await requestApi<{ ok: boolean }>(apiUrl(config), { cache: 'no-store' })
  return result.ok && result.payload.ok === true
}
