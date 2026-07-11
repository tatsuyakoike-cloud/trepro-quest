import { ExternalLink, Pencil } from 'lucide-react'
import type { ProgressWithMission } from '../types'
import { StatusBadge } from './StatusBadge'
import { ResultBadge } from './ResultBadge'

interface QuestCardProps {
  progress: ProgressWithMission
  canEdit: boolean
  onEdit: () => void
}

export function QuestCard({ progress, canEdit, onEdit }: QuestCardProps) {
  const { mission } = progress
  const isPassed = progress.result === '合格'
  const isOverdue =
    progress.due_date &&
    progress.status !== '完了' &&
    progress.result !== '合格' &&
    progress.due_date < new Date().toISOString().slice(0, 10)

  return (
    <div
      className={`quest-card p-4 space-y-3 ${isPassed ? 'quest-card-passed' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-gray-400">{mission.mission_group}</span>
          <h4 className="pixel-font text-base mt-1">
            Step {mission.step_number}: {mission.title}
          </h4>
          <p className="text-xs text-gray-400 mt-1">{mission.level_name}</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="pixel-btn text-xs px-2 py-1 shrink-0"
            aria-label="編集"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-300">{mission.description}</p>

      {mission.pass_criteria && (
        <div className="text-sm bg-[#1a1a2e] p-2 border border-[#f5d742]/30">
          <span className="text-[#f5d742] text-xs pixel-font">合格条件</span>
          <ul className="mt-1 space-y-0.5 list-disc list-inside text-gray-300">
            {mission.pass_criteria.split('|').map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={progress.status} />
        <ResultBadge result={progress.result} />
        {isOverdue && (
          <span className="inline-block px-2 py-0.5 text-xs font-bold bg-red-700 text-white">
            期限超過
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-gray-500">審査者: </span>
          {mission.reviewer_name}
        </div>
        <div>
          <span className="text-gray-500">実施日: </span>
          {progress.executed_at
            ? new Date(progress.executed_at).toLocaleDateString('ja-JP')
            : '—'}
        </div>
        {progress.due_date && (
          <div className={isOverdue ? 'text-red-400' : ''}>
            <span className="text-gray-500">期限: </span>
            {new Date(progress.due_date).toLocaleDateString('ja-JP')}
          </div>
        )}
      </div>

      {progress.feedback && (
        <div className="text-sm bg-[#1a1a2e] p-2 border border-white/20">
          <span className="text-gray-500">フィードバック: </span>
          {progress.feedback}
        </div>
      )}

      {progress.next_action && (
        <div className="text-sm bg-[#1a1a2e] p-2 border border-white/20">
          <span className="text-gray-500">次回アクション: </span>
          {progress.next_action}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">TLDB:</span>
        {progress.tldb_url ? (
          <a
            href={progress.tldb_url}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-btn text-xs px-3 py-1 inline-flex items-center gap-1 no-underline text-white"
          >
            記録を見る <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-sm text-gray-500">未登録</span>
        )}
      </div>
    </div>
  )
}
