import type { Profile, UserRole } from '../types'

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}

export function isMember(profile: Profile | null): boolean {
  return profile?.role === 'member'
}

export function canEditResult(profile: Profile | null): boolean {
  return isAdmin(profile)
}

export function canEditAllFields(profile: Profile | null): boolean {
  return isAdmin(profile)
}

export function canEditProgress(
  profile: Profile | null,
  memberSlug: string,
): boolean {
  if (!profile) return false
  if (isAdmin(profile)) return true
  if (profile.role === 'member' && profile.member_slug === memberSlug) return true
  return false
}

export function canViewMember(
  profile: Profile | null,
  memberSlug: string,
): boolean {
  if (!profile) return false
  if (isAdmin(profile)) return true
  if (profile.role === 'member' && profile.member_slug === memberSlug) return true
  return false
}

export function canAccessAdmin(profile: Profile | null): boolean {
  return isAdmin(profile)
}

export function getMemberHomePath(profile: Profile | null): string {
  if (profile?.role === 'member' && profile.member_slug) {
    return `/members/${profile.member_slug}`
  }
  return '/'
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '管理者'
    case 'member':
      return 'メンバー'
  }
}

export function filterMembersForProfile<T extends { slug: string }>(
  profile: Profile | null,
  members: T[],
): T[] {
  if (!profile) return []
  if (isAdmin(profile)) return members
  if (profile.role === 'member' && profile.member_slug) {
    return members.filter((m) => m.slug === profile.member_slug)
  }
  return []
}
