import { create } from 'zustand'
import type { Profile } from '../types'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { DEMO_PASSWORD, DEMO_PROFILES, localGetProfileByEmail } from '../lib/localDb'

interface AuthState {
  profile: Profile | null
  loading: boolean
  isDemo: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signInDemo: (role: 'admin' | 'reviewer' | 'member') => void
  signOut: () => Promise<void>
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as Profile
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  isDemo: false,

  init: async () => {
    if (!isSupabaseConfigured()) {
      const saved = sessionStorage.getItem('trepro-demo-profile')
      if (saved) {
        set({ profile: JSON.parse(saved) as Profile, isDemo: true, loading: false })
        return
      }
      set({ loading: false })
      return
    }

    const supabase = getSupabase()!
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ profile, isDemo: false, loading: false })
    } else {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        set({ profile, isDemo: false })
      } else {
        set({ profile: null, isDemo: false })
      }
    })
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      const profile = localGetProfileByEmail(email)
      if (!profile) return '登録されていないメールアドレスです'
      if (password !== DEMO_PASSWORD) return 'パスワードが正しくありません（デモ: trepro2026）'
      sessionStorage.setItem('trepro-demo-profile', JSON.stringify(profile))
      set({ profile, isDemo: true })
      return null
    }

    const supabase = getSupabase()!
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'ユーザー情報の取得に失敗しました'

    const profile = await fetchProfile(user.id)
    if (!profile) return 'プロフィールが見つかりません。管理者に連絡してください。'
    set({ profile, isDemo: false })
    return null
  },

  signInDemo: (role) => {
    const profile = DEMO_PROFILES.find((p) => p.role === role) ?? DEMO_PROFILES[0]
    sessionStorage.setItem('trepro-demo-profile', JSON.stringify(profile))
    set({ profile, isDemo: true })
  },

  signOut: async () => {
    sessionStorage.removeItem('trepro-demo-profile')
    if (isSupabaseConfigured()) {
      await getSupabase()?.auth.signOut()
    }
    set({ profile: null, isDemo: false })
  },
}))
