import type { Profile, UserRole } from '../types'

export function canEditResult(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'reviewer'
}

export function canEditAllFields(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

export function canEditProgress(
  profile: Profile | null,
  memberSlug: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'reviewer') return true
  if (profile.role === 'member' && profile.member_slug === memberSlug) return true
  return false
}

export function canViewMember(
  profile: Profile | null,
  memberSlug: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'reviewer') return true
  if (profile.role === 'member' && profile.member_slug === memberSlug) return true
  return false
}

export function canAccessAdmin(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'reviewer'
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '管理者'
    case 'reviewer':
      return '審査者'
    case 'member':
      return 'メンバー'
  }
}
