import type { Member, ProgressWithMission } from '../types'
import { calcSectionProgress } from '../lib/missions'
import { PixelWindow } from './PixelWindow'
import { ProgressBar } from './ProgressBar'

interface AdminMemberTabSummaryProps {
  members: Member[]
  tabProgresses: ProgressWithMission[]
}

export function AdminMemberTabSummary({
  members,
  tabProgresses,
}: AdminMemberTabSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {members.map((member) => {
        const memberProgresses = tabProgresses.filter(
          (p) => p.member_id === member.id,
        )
        const { passed, total, rate } = calcSectionProgress(memberProgresses)

        return (
          <PixelWindow key={member.id} title={member.name}>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-400">{member.title}</span>
              <span>
                合格 {passed} / {total}
              </span>
            </div>
            <ProgressBar value={rate} label="タブ進捗" gold={passed >= total && total > 0} />
          </PixelWindow>
        )
      })}
    </div>
  )
}
