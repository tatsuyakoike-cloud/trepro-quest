import { ProgressBar } from './ProgressBar'
import { PixelWindow } from './PixelWindow'
import { calcSectionProgress } from '../lib/missions'
import type { ProgressWithMission } from '../types'

interface CategoryLevelCardProps {
  title: string
  progresses: ProgressWithMission[]
}

export function CategoryLevelCard({ title, progresses }: CategoryLevelCardProps) {
  const { passed, total, rate } = calcSectionProgress(progresses)

  return (
    <PixelWindow title={title}>
      <div className="flex items-center justify-between mb-3">
        <span className="pixel-font text-[#f5d742] text-lg">レベル上げ</span>
        <span className="text-sm text-gray-400">
          合格 {passed} / {total}
        </span>
      </div>
      <ProgressBar value={rate} label="進捗" gold={passed >= total && total > 0} />
      <p className="text-xs text-gray-500 mt-2">
        このカテゴリのクエストをクリアしてレベルを上げよう
      </p>
    </PixelWindow>
  )
}
