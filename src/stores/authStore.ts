import { create } from 'zustand'
import type { Profile } from '../types'
import { authenticateUser } from '../lib/api'
import { getMemberHomePath } from '../lib/permissions'

interface AuthState {
  profile: Profile | null
  loading: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,

  init: async () => {
    const saved = sessionStorage.getItem('trepro-profile')
    if (saved) {
      set({ profile: JSON.parse(saved) as Profile, loading: false })
      return
    }
    set({ loading: false })
  },

  signIn: async (email, password) => {
    const { profile, error } = await authenticateUser(email, password)
    if (error || !profile) return error ?? 'ログインに失敗しました'
    sessionStorage.setItem('trepro-profile', JSON.stringify(profile))
    set({ profile })
    return null
  },

  signOut: async () => {
    sessionStorage.removeItem('trepro-profile')
    set({ profile: null })
  },
}))

export function getPostLoginPath(profile: Profile): string {
  return getMemberHomePath(profile)
}
