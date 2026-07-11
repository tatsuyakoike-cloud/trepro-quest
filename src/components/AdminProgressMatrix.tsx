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

function MissionTitle({ mission }: { mission: Mission }) {
  return (
    <div className="break-words">
      <div className="font-medium">
        {mission.level_name} {mission.title}
      </div>
      {mission.reviewer_name !== '-' && (
        <div className="text-xs text-gray-400 mt-1">
          審査者: {mission.reviewer_name}
        </div>
      )}
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
        className="pixel-btn text-xs px-3 py-2 inline-flex items-center gap-1"
      >
        <Pencil size={12} />
        編集
      </button>
    </div>
  )
}

export function AdminProgressMatrix({
  missions,
  members,
  progressMap,
  onEdit,
}: AdminProgressMatrixProps) {
  if (missions.length === 0) return null

  return (
    <>
      <div className="md:hidden space-y-4">
        {missions.map((mission) => (
          <div key={mission.id} className="quest-card p-3 sm:p-4 space-y-3">
            <MissionTitle mission={mission} />
            <div className="space-y-3 border-t border-white/20 pt-3">
              {members.map((member) => {
                const progress = progressMap.get(progressKey(member.id, mission.id))
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="pixel-font text-sm text-[#f5d742]">{member.name}</div>
                    {progress ? (
                      <AdminProgressCell progress={progress} onEdit={() => onEdit(progress)} />
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block pixel-scroll-x -mx-1 px-1">
        <table className="pixel-table w-full text-sm min-w-[560px]">
          <thead>
            <tr>
              <th className="text-left min-w-[180px] sticky left-0 z-10 bg-[#1a1a3a]">
                クエスト
              </th>
              {members.map((member) => (
                <th key={member.id} className="min-w-[130px]">
                  {member.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr key={mission.id}>
                <td className="sticky left-0 z-10 bg-[#12122a]">
                  <MissionTitle mission={mission} />
                </td>
                {members.map((member) => {
                  const progress = progressMap.get(progressKey(member.id, mission.id))
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
    </>
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
