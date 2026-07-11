import { DEMO_PROFILES, normalizeEmail } from './localDb'
import type { Profile } from '../types'

const LOCAL_PASSWORDS: Record<string, string> = {
  'support-team@tre-pro.co.jp': 'trepro2026',
  'admin@trepro.jp': 'trepro2026',
  'asai@tre-pro.co.jp': 'asai2026',
  'nakaguki@tre-pro.co.jp': 'nakakuki2026',
}

export function getLocalPassword(email: string): string {
  return LOCAL_PASSWORDS[normalizeEmail(email)] ?? 'trepro2026'
}

export function findLocalProfile(email: string): Profile | null {
  const normalized = normalizeEmail(email)
  if (normalized === 'admin@trepro.jp') {
    return DEMO_PROFILES.find((p) => normalizeEmail(p.email) === 'support-team@tre-pro.co.jp') ?? null
  }
  return DEMO_PROFILES.find((p) => normalizeEmail(p.email) === normalized) ?? null
}

/** 組み込みアカウントで認証（API不要） */
export function validateLocalCredentials(
  email: string,
  password: string,
): { profile: Profile | null; error: string | null } {
  const profile = findLocalProfile(email)
  if (!profile) {
    return { profile: null, error: '登録されていないメールアドレスです' }
  }
  if (password !== getLocalPassword(email)) {
    return { profile: null, error: 'パスワードが正しくありません' }
  }
  return { profile, error: null }
}
