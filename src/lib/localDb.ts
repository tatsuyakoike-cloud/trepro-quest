import type {
  ActivityLog,
  Member,
  MemberProgress,
  Mission,
  Profile,
  ProgressUpdateInput,
} from '../types'

const STORAGE_KEY = 'trepro-quest-data'

const MEMBER_ASAI_ID = '11111111-1111-1111-1111-111111111101'
const MEMBER_NAKAKUKI_ID = '11111111-1111-1111-1111-111111111102'

const MISSION_IDS = [
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222206',
]

const now = new Date().toISOString()

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'admin-001',
    name: '管理者',
    email: 'admin@trepro.jp',
    role: 'admin',
    member_slug: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'member-asai',
    name: '浅井さん',
    email: 'asai@tre-pro.co.jp',
    role: 'member',
    member_slug: 'asai',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'member-nakakuki',
    name: '中岫さん',
    email: 'nakaguki@tre-pro.co.jp',
    role: 'member',
    member_slug: 'nakakuki',
    created_at: now,
    updated_at: now,
  },
]

const defaultMembers: Member[] = [
  {
    id: MEMBER_ASAI_ID,
    name: '浅井さん',
    slug: 'asai',
    title: '旅立ち前の新人',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: MEMBER_NAKAKUKI_ID,
    name: '中岫さん',
    slug: 'nakakuki',
    title: '旅立ち前の新人',
    active: true,
    created_at: now,
    updated_at: now,
  },
]

const defaultMissions: Mission[] = [
  {
    id: MISSION_IDS[0],
    tab: '商談ロープレ',
    mission_group: '商談ロープレのレベル上げ',
    step_number: 1,
    level_name: 'Lv.1',
    title: '基本営業ロープレ',
    description: 'サービス理解・言葉遣い・商談の基本構成を身につける。審査者：小池',
    reviewer_name: '小池',
    pass_criteria:
      'サービス内容を正確に説明できる|敬語や言葉遣いに大きな問題がない|商談の基本的な流れを再現できる|次回アクションを提示できる',
    sort_order: 1,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: MISSION_IDS[1],
    tab: '商談ロープレ',
    mission_group: '商談ロープレのレベル上げ',
    step_number: 2,
    level_name: 'Lv.2',
    title: '実践営業ロープレ',
    description: '電話アポ・メール送付・日程調整・商談実施を一連で実施する。審査者：橋口さん',
    reviewer_name: '橋口さん',
    pass_criteria:
      'アポ取得から商談までを一連で実施できる|クライアント役からの質問に対応できる|商談後のメールを作成できる|次回アクションと日程を握れる',
    sort_order: 2,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: MISSION_IDS[2],
    tab: '商談ロープレ',
    mission_group: '商談ロープレのレベル上げ',
    step_number: 3,
    level_name: 'Lv.3',
    title: '最終営業ロープレ',
    description: '顧客課題の整理・経営者目線への対応・提案と質疑応答。審査者：金山さん',
    reviewer_name: '金山さん',
    pass_criteria:
      '顧客課題に応じて提案を変更できる|経営者目線の質問に回答できる|商談を自力で完遂できる|金山さんから最終合格をもらう',
    sort_order: 3,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: MISSION_IDS[3],
    tab: '資料作成',
    mission_group: '事例一覧',
    step_number: 1,
    level_name: 'Lv.1',
    title: '最新事例収集',
    description:
      'MMチームへヒアリングし、建設・介護・営業など主要業界の最新事例を収集・整理する',
    reviewer_name: '-',
    pass_criteria:
      'MMチームへの確認が完了している|最新事例が反映されている|第三者が営業で再利用できる|情報の出典が確認できる',
    sort_order: 4,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: MISSION_IDS[4],
    tab: '資料作成',
    mission_group: '競合調査',
    step_number: 2,
    level_name: 'Lv.2',
    title: '競合・業界調査資料更新',
    description:
      '主要競合の価格・サービス・強み・弱みを比較し、業界の市場構造を整理する',
    reviewer_name: '-',
    pass_criteria:
      '主要競合を整理している|価格・サービス・強み・弱みを比較している|業界の市場構造を整理している|情報源が記載されている|AIの出力内容を人間が確認している|営業で使用できる示唆がある',
    sort_order: 5,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: MISSION_IDS[5],
    tab: '資料作成',
    mission_group: '提案資料のレベル上げ',
    step_number: 3,
    level_name: 'Lv.3',
    title: '最新サービス資料の提案反映',
    description: '最新サービス内容を理解し、顧客課題に応じた提案資料を作成する',
    reviewer_name: '-',
    pass_criteria:
      '最新サービス内容を理解している|顧客課題に応じて提案内容を変更している|事例・競合調査の内容を活用している|レビュー指摘を反映している|商談で使用できる状態になっている',
    sort_order: 6,
    active: true,
    created_at: now,
    updated_at: now,
  },
]

function createDefaultProgress(): MemberProgress[] {
  const progresses: MemberProgress[] = []
  for (const memberId of [MEMBER_ASAI_ID, MEMBER_NAKAKUKI_ID]) {
    for (const missionId of MISSION_IDS) {
      progresses.push({
        id: crypto.randomUUID(),
        member_id: memberId,
        mission_id: missionId,
        status: '未着手',
        result: '未審査',
        executed_at: null,
        feedback: '',
        next_action: '',
        due_date: null,
        tldb_url: '',
        updated_by: null,
        created_at: now,
        updated_at: now,
      })
    }
  }
  return progresses
}

interface LocalDb {
  members: Member[]
  missions: Mission[]
  progresses: MemberProgress[]
  activityLogs: ActivityLog[]
}

function loadDb(): LocalDb {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const db = JSON.parse(raw) as LocalDb
    // マイグレーション: 旧データに tab がない場合は再初期化
    if (db.missions?.length && !db.missions[0]?.tab) {
      localStorage.removeItem(STORAGE_KEY)
      return loadDb()
    }
    return db
  }
  const db: LocalDb = {
    members: defaultMembers,
    missions: defaultMissions,
    progresses: createDefaultProgress(),
    activityLogs: [],
  }
  saveDb(db)
  return db
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function localGetMembers(): Member[] {
  return loadDb().members.filter((m) => m.active)
}

export function localGetMissions(): Mission[] {
  return loadDb().missions.filter((m) => m.active).sort((a, b) => a.sort_order - b.sort_order)
}

export function localGetProgresses(): MemberProgress[] {
  return loadDb().progresses
}

export function localGetActivityLogs(): ActivityLog[] {
  return loadDb().activityLogs
}

export function localUpdateProgress(
  progressId: string,
  input: ProgressUpdateInput,
  updatedBy: string | null,
): MemberProgress {
  const db = loadDb()
  const index = db.progresses.findIndex((p) => p.id === progressId)
  if (index === -1) throw new Error('進捗が見つかりません')

  const before = { ...db.progresses[index] }
  const updated: MemberProgress = {
    ...db.progresses[index],
    ...input,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }
  db.progresses[index] = updated

  db.activityLogs.unshift({
    id: crypto.randomUUID(),
    member_id: updated.member_id,
    mission_id: updated.mission_id,
    action: '進捗更新',
    before_data: before as unknown as Record<string, unknown>,
    after_data: updated as unknown as Record<string, unknown>,
    updated_by: updatedBy,
    created_at: new Date().toISOString(),
  })

  saveDb(db)
  return updated
}

export function localUpdateMemberTitle(memberId: string, title: string): void {
  const db = loadDb()
  const member = db.members.find((m) => m.id === memberId)
  if (member) {
    member.title = title
    member.updated_at = new Date().toISOString()
    saveDb(db)
  }
}

export function localGetProfileByEmail(email: string): Profile | null {
  return DEMO_PROFILES.find((p) => p.email === email) ?? null
}

export const DEMO_PASSWORD = 'trepro2026'
