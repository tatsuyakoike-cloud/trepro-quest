import { useEffect, useState } from 'react'
import type { ProgressResult, ProgressStatus, ProgressWithMission } from '../types'
import { PROGRESS_RESULTS, PROGRESS_STATUSES } from '../types'
import { validateProgressUpdate } from '../lib/api'
import { canEditResult } from '../lib/permissions'
import { useAuthStore } from '../stores/authStore'
import type { ProgressUpdateInput } from '../types'

interface EditQuestModalProps {
  progress: ProgressWithMission
  memberName: string
  onClose: () => void
  onSave: (input: ProgressUpdateInput) => Promise<void>
}

export function EditQuestModal({
  progress,
  memberName,
  onClose,
  onSave,
}: EditQuestModalProps) {
  const profile = useAuthStore((s) => s.profile)
  const canChangeResult = canEditResult(profile)

  const [status, setStatus] = useState<ProgressStatus>(progress.status)
  const [result, setResult] = useState<ProgressResult>(progress.result)
  const [executedAt, setExecutedAt] = useState(progress.executed_at ?? '')
  const [feedback, setFeedback] = useState(progress.feedback)
  const [nextAction, setNextAction] = useState(progress.next_action)
  const [dueDate, setDueDate] = useState(progress.due_date ?? '')
  const [tldbUrl, setTldbUrl] = useState(progress.tldb_url)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async () => {
    const input: ProgressUpdateInput = {
      status,
      executed_at: executedAt || null,
      feedback,
      next_action: nextAction,
      due_date: dueDate || null,
      tldb_url: tldbUrl,
    }
    if (canChangeResult) {
      input.result = result
    }

    const validationError = validateProgressUpdate(input)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave(input)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="game-message-overlay" role="presentation">
      <div
        className="pixel-window max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-quest-title"
      >
        <h3 id="edit-quest-title" className="pixel-title text-lg mb-4">
          {memberName} — {progress.mission.title}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">ステータス</label>
            <select
              className="pixel-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProgressStatus)}
            >
              {PROGRESS_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {canChangeResult && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">合否</label>
              <select
                className="pixel-select"
                value={result}
                onChange={(e) => setResult(e.target.value as ProgressResult)}
              >
                {PROGRESS_RESULTS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">実施日</label>
            <input
              type="date"
              className="pixel-input"
              value={executedAt}
              onChange={(e) => setExecutedAt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">フィードバック</label>
            <textarea
              className="pixel-input min-h-[80px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">次回アクション</label>
            <textarea
              className="pixel-input min-h-[60px]"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">期限</label>
            <input
              type="date"
              className="pixel-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">TLDB URL</label>
            <input
              type="url"
              className="pixel-input"
              value={tldbUrl}
              onChange={(e) => setTldbUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="pixel-btn pixel-btn-gold flex-1"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn pixel-btn-secondary flex-1"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
