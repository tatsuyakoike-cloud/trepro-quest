import type { Mission, ProgressWithMission } from '../types'

export const TABS = ['商談ロープレ', '資料作成'] as const
export type QuestTab = (typeof TABS)[number]

export const TAB_SECTIONS: Record<QuestTab, string[]> = {
  商談ロープレ: ['商談ロープレのレベル上げ'],
  資料作成: ['レベル上げ', '事例一覧', '競合調査', '提案資料のレベル上げ'],
}

/** 資料作成タブの「レベル上げ」に含めるミッショングループ */
export const DOCUMENT_LEVEL_GROUPS = ['事例一覧', '競合調査', '提案資料のレベル上げ']

export function groupProgressesByTab(
  progresses: ProgressWithMission[],
): Record<QuestTab, ProgressWithMission[]> {
  const result: Record<QuestTab, ProgressWithMission[]> = {
    商談ロープレ: [],
    資料作成: [],
  }
  for (const p of progresses) {
    const tab = (p.mission.tab || '商談ロープレ') as QuestTab
    if (result[tab]) result[tab].push(p)
  }
  return result
}

export function groupByMissionGroup(
  progresses: ProgressWithMission[],
): Record<string, ProgressWithMission[]> {
  const groups: Record<string, ProgressWithMission[]> = {}
  for (const p of progresses) {
    const key = p.mission.mission_group
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }
  return groups
}

export function calcSectionProgress(progresses: ProgressWithMission[]): {
  passed: number
  total: number
  rate: number
} {
  const total = progresses.length
  const passed = progresses.filter((p) => p.result === '合格').length
  return { passed, total, rate: total ? Math.round((passed / total) * 100) : 0 }
}

export function getDocumentLevelProgress(
  progresses: ProgressWithMission[],
): ProgressWithMission[] {
  return progresses.filter((p) =>
    DOCUMENT_LEVEL_GROUPS.includes(p.mission.mission_group),
  )
}

export function filterProgressesByTab(
  progresses: ProgressWithMission[],
  tab: QuestTab,
): ProgressWithMission[] {
  return progresses.filter((p) => (p.mission.tab || '商談ロープレ') === tab)
}

export function getMissionsForSection(
  missions: Mission[],
  tab: QuestTab,
  sectionName: string,
): Mission[] {
  if (sectionName === 'レベル上げ') return []
  return missions
    .filter(
      (m) =>
        (m.tab || '商談ロープレ') === tab && m.mission_group === sectionName,
    )
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function normalizeMission(m: Mission): Mission {
  return {
    ...m,
    tab: m.tab || (m.mission_group.includes('ロープレ') ? '商談ロープレ' : '資料作成'),
  }
}
