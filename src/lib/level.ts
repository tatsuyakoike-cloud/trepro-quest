export const TOTAL_STEPS = 6

export const LEVEL_TITLES: Record<number, string> = {
  0: '旅立ち前の新人',
  1: '見習い冒険者',
  2: '商談のたまご',
  3: '提案の戦士',
  4: '現場の実践者',
  5: '即戦力候補',
}

export const MAX_LEVEL_TITLE = 'トレプロ勇者'

export function getLevelFromPassedCount(passedCount: number): number {
  return Math.min(passedCount, TOTAL_STEPS)
}

export function getLevelLabel(passedCount: number): string {
  if (passedCount >= TOTAL_STEPS) return 'Lv.MAX'
  return `Lv.${passedCount}`
}

export function getTitleFromPassedCount(passedCount: number): string {
  if (passedCount >= TOTAL_STEPS) return MAX_LEVEL_TITLE
  return LEVEL_TITLES[passedCount] ?? LEVEL_TITLES[0]
}

export function getProgressRate(passedCount: number): number {
  return Math.round((passedCount / TOTAL_STEPS) * 100)
}
