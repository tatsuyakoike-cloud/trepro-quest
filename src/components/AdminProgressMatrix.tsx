import { Pencil } from 'lucide-react'
import type { Member, Mission, ProgressWithMission } from '../types'
import { StatusBadge } from './StatusBadge'
import { ResultBadge } from './ResultBadge'

interface AdminProgressMatrixProps {
  missions: Mission[]
  members: Member[]
  progressMap: Map<string, ProgressWithMission>
  onEdit: (progress: ProgressWithMission) => void
}

function progressKey(memberId: string, missionId: string): string {
  return `${memberId}:${missionId}`
}

export function AdminProgressMatrix({
  missions,
  members,
  progressMap,
  onEdit,
}: AdminProgressMatrixProps) {
  if (missions.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="pixel-table w-full text-sm min-w-[640px]">
        <thead>
          <tr>
            <th className="text-left min-w-[200px]">クエスト</th>
            {members.map((member) => (
              <th key={member.id} className="min-w-[140px]">
                {member.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => (
            <tr key={mission.id}>
              <td>
                <div className="font-medium">
                  {mission.level_name} {mission.title}
                </div>
                {mission.reviewer_name !== '-' && (
                  <div className="text-xs text-gray-400 mt-1">
                    審査者: {mission.reviewer_name}
                  </div>
                )}
              </td>
              {members.map((member) => {
                const progress = progressMap.get(
                  progressKey(member.id, mission.id),
                )
                return (
                  <td key={member.id}>
                    {progress ? (
                      <AdminProgressCell
                        progress={progress}
                        onEdit={() => onEdit(progress)}
                      />
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminProgressCell({
  progress,
  onEdit,
}: {
  progress: ProgressWithMission
  onEdit: () => void
}) {
  const isOverdue =
    progress.due_date &&
    progress.status !== '完了' &&
    progress.result !== '合格' &&
    progress.due_date < new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <StatusBadge status={progress.status} />
        <ResultBadge result={progress.result} />
      </div>
      {progress.executed_at && (
        <p className="text-xs text-gray-500">
          実施: {new Date(progress.executed_at).toLocaleDateString('ja-JP')}
        </p>
      )}
      {progress.due_date && (
        <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
          期限: {new Date(progress.due_date).toLocaleDateString('ja-JP')}
        </p>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="pixel-btn text-xs px-2 py-1 inline-flex items-center gap-1"
      >
        <Pencil size={12} />
        編集
      </button>
    </div>
  )
}

export function buildProgressMap(
  progresses: ProgressWithMission[],
): Map<string, ProgressWithMission> {
  const map = new Map<string, ProgressWithMission>()
  for (const p of progresses) {
    map.set(progressKey(p.member_id, p.mission_id), p)
  }
  return map
}
