import { getSupabase, isSupabaseConfigured } from './supabase'
import {
  localGetActivityLogs,
  localGetMembers,
  localGetMissions,
  localGetProgresses,
  localUpdateMemberTitle,
  localUpdateProgress,
} from './localDb'
import type {
  ActivityLog,
  Member,
  MemberProgress,
  Mission,
  ProgressUpdateInput,
} from '../types'
import { getTitleFromPassedCount } from './level'

export async function fetchMembers(): Promise<Member[]> {
  const supabase = getSupabase()
  if (!supabase) return localGetMembers()

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('active', true)
    .order('slug')

  if (error) throw error
  return data as Member[]
}

export async function fetchMissions(): Promise<Mission[]> {
  const supabase = getSupabase()
  if (!supabase) return localGetMissions()

  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (error) throw error
  return data as Mission[]
}

export async function fetchProgresses(): Promise<MemberProgress[]> {
  const supabase = getSupabase()
  if (!supabase) return localGetProgresses()

  const { data, error } = await supabase.from('member_progress').select('*')
  if (error) throw error
  return data as MemberProgress[]
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const supabase = getSupabase()
  if (!supabase) return localGetActivityLogs()

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data as ActivityLog[]
}

export async function updateProgress(
  progressId: string,
  input: ProgressUpdateInput,
  updatedBy: string | null,
): Promise<MemberProgress> {
  const supabase = getSupabase()
  if (!supabase) {
    return localUpdateProgress(progressId, input, updatedBy)
  }

  const { data: before } = await supabase
    .from('member_progress')
    .select('*')
    .eq('id', progressId)
    .single()

  const updatePayload = {
    ...input,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('member_progress')
    .update(updatePayload)
    .eq('id', progressId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('activity_logs').insert({
    member_id: data.member_id,
    mission_id: data.mission_id,
    action: '進捗更新',
    before_data: before,
    after_data: data,
    updated_by: updatedBy,
  })

  const passedCount = await getPassedCountForMember(data.member_id)
  const title = getTitleFromPassedCount(passedCount)
  await supabase
    .from('members')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', data.member_id)

  return data as MemberProgress
}

async function getPassedCountForMember(memberId: string): Promise<number> {
  const supabase = getSupabase()
  if (!supabase) return 0

  const { count, error } = await supabase
    .from('member_progress')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('result', '合格')

  if (error) return 0
  return count ?? 0
}

export async function syncMemberTitles(
  members: Member[],
  progresses: MemberProgress[],
): Promise<void> {
  for (const member of members) {
    const passed = progresses.filter(
      (p) => p.member_id === member.id && p.result === '合格',
    ).length
    const title = getTitleFromPassedCount(passed)
    if (member.title !== title) {
      if (isSupabaseConfigured()) {
        const supabase = getSupabase()
        await supabase
          ?.from('members')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', member.id)
      } else {
        localUpdateMemberTitle(member.id, title)
      }
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
