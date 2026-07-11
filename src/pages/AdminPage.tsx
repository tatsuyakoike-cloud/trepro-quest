import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Pencil, LayoutGrid, Table } from 'lucide-react'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '../stores/authStore'
import { canAccessAdmin } from '../lib/permissions'
import { PixelWindow } from '../components/PixelWindow'
import { StatusBadge } from '../components/StatusBadge'
import { ResultBadge } from '../components/ResultBadge'
import { QuestCard } from '../components/QuestCard'
import { EditQuestModal } from '../components/EditQuestModal'
import { GameMessage } from '../components/GameMessage'
import { loadConfig } from '../lib/config'
import { getMemberHomePath } from '../lib/permissions'
import type { ProgressResult, ProgressStatus, ProgressUpdateInput, ProgressWithMission } from '../types'
import { PROGRESS_RESULTS, PROGRESS_STATUSES } from '../types'

type ViewMode = 'card' | 'table'

export function AdminPage() {
  const profile = useAuthStore((s) => s.profile)
  const load = useDataStore((s) => s.load)
  const startPolling = useDataStore((s) => s.startPolling)
  const stopPolling = useDataStore((s) => s.stopPolling)
  const loading = useDataStore((s) => s.loading)
  const members = useDataStore((s) => s.members)
  const missions = useDataStore((s) => s.missions)
  const progresses = useDataStore((s) => s.progresses)
  const saveProgress = useDataStore((s) => s.saveProgress)

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [filterMember, setFilterMember] = useState('')
  const [filterMission, setFilterMission] = useState('')
  const [filterStatus, setFilterStatus] = useState<ProgressStatus | ''>('')
  const [filterResult, setFilterResult] = useState<ProgressResult | ''>('')
  const [filterReviewer, setFilterReviewer] = useState('')
  const [filterOverdue, setFilterOverdue] = useState(false)
  const [filterNoTldb, setFilterNoTldb] = useState(false)
  const [editing, setEditing] = useState<ProgressWithMission | null>(null)
  const [gameMsg, setGameMsg] = useState<string | null>(null)

  useEffect(() => {
    void load()
    void loadConfig().then((config) => {
      if (config.syncApiUrl) startPolling(config.pollIntervalMs)
    })
    return () => stopPolling()
  }, [load, startPolling, stopPolling])

  if (!canAccessAdmin(profile)) {
    return <Navigate to={getMemberHomePath(profile)} replace />
  }

  const allProgresses = useMemo(() => {
    const missionMap = new Map(missions.map((m) => [m.id, m]))
    const memberMap = new Map(members.map((m) => [m.id, m]))
    return progresses
      .map((p) => ({
        ...p,
        mission: missionMap.get(p.mission_id)!,
        member: memberMap.get(p.member_id)!,
      }))
      .filter((p) => p.mission && p.member)
      .sort((a, b) => {
        const memberCmp = a.member.slug.localeCompare(b.member.slug)
        if (memberCmp !== 0) return memberCmp
        return a.mission.sort_order - b.mission.sort_order
      })
  }, [progresses, missions, members])

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return allProgresses.filter((p) => {
      if (filterMember && p.member.slug !== filterMember) return false
      if (filterMission && p.mission.id !== filterMission) return false
      if (filterStatus && p.status !== filterStatus) return false
      if (filterResult && p.result !== filterResult) return false
      if (filterReviewer && p.mission.reviewer_name !== filterReviewer) return false
      if (filterOverdue) {
        if (!p.due_date || p.due_date >= today) return false
        if (p.status === '完了' || p.result === '合格') return false
      }
      if (filterNoTldb && p.tldb_url) return false
      return true
    })
  }, [allProgresses, filterMember, filterMission, filterStatus, filterResult, filterReviewer, filterOverdue, filterNoTldb])

  const reviewers = useMemo(
    () => [...new Set(missions.map((m) => m.reviewer_name).filter((r) => r !== '-'))],
    [missions],
  )

  const handleSave = async (input: ProgressUpdateInput) => {
    if (!editing) return
    const member = members.find((m) => m.id === editing.member_id)
    const result = await saveProgress(
      editing.id,
      input,
      profile?.id ?? null,
      member?.name ?? '',
    )
    if (result.error) {
      setGameMsg(result.error)
      return
    }
    if (result.leveledUp && result.newTitle && member) {
      setGameMsg(
        `記録を保存しました。\n${member.name}は「${result.newTitle}」になった。`,
      )
    } else {
      setGameMsg(
        `記録を保存しました。\n${member?.name ?? ''}の冒険記録を更新しました。`,
      )
    }
  }

  if (loading) {
    return <p className="pixel-font text-center text-[#f5d742] animate-pulse">管理画面読み込み中...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="pixel-title text-2xl">管理・入力画面</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`pixel-btn text-xs inline-flex items-center gap-1 ${viewMode === 'card' ? 'pixel-btn-gold' : ''}`}
          >
            <LayoutGrid size={14} /> カード
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`pixel-btn text-xs inline-flex items-center gap-1 ${viewMode === 'table' ? 'pixel-btn-gold' : ''}`}
          >
            <Table size={14} /> テーブル
          </button>
        </div>
      </div>

      <PixelWindow title="絞り込み">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            className="pixel-select text-sm"
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
          >
            <option value="">全メンバー</option>
            {members.map((m) => (
              <option key={m.id} value={m.slug}>{m.name}</option>
            ))}
          </select>
          <select
            className="pixel-select text-sm"
            value={filterMission}
            onChange={(e) => setFilterMission(e.target.value)}
          >
            <option value="">全ミッション</option>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.mission_group} Step{m.step_number}
              </option>
            ))}
          </select>
          <select
            className="pixel-select text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProgressStatus | '')}
          >
            <option value="">全ステータス</option>
            {PROGRESS_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="pixel-select text-sm"
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value as ProgressResult | '')}
          >
            <option value="">全合否</option>
            {PROGRESS_RESULTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="pixel-select text-sm"
            value={filterReviewer}
            onChange={(e) => setFilterReviewer(e.target.value)}
          >
            <option value="">全審査者</option>
            {reviewers.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)}
            />
            期限超過のみ
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterNoTldb}
              onChange={(e) => setFilterNoTldb(e.target.checked)}
            />
            TLDB未登録のみ
          </label>
        </div>
      </PixelWindow>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div key={p.id}>
              <p className="text-sm text-gray-400 mb-1">{p.member.name}</p>
              <QuestCard
                progress={p}
                canEdit
                onEdit={() => setEditing(p)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="pixel-table w-full text-sm min-w-[900px]">
            <thead>
              <tr>
                <th>メンバー</th>
                <th>ミッション</th>
                <th>審査者</th>
                <th>ステータス</th>
                <th>合否</th>
                <th>実施日</th>
                <th>期限</th>
                <th>TLDB</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isOverdue =
                  p.due_date &&
                  p.status !== '完了' &&
                  p.result !== '合格' &&
                  p.due_date < new Date().toISOString().slice(0, 10)
                return (
                  <tr key={p.id}>
                    <td>{p.member.name}</td>
                    <td>
                      {p.mission.mission_group} Step{p.mission.step_number}
                      <br />
                      <span className="text-gray-400 text-xs">{p.mission.title}</span>
                    </td>
                    <td>{p.mission.reviewer_name}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><ResultBadge result={p.result} /></td>
                    <td>
                      {p.executed_at
                        ? new Date(p.executed_at).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                    <td className={isOverdue ? 'text-red-400' : ''}>
                      {p.due_date
                        ? new Date(p.due_date).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                    <td>{p.tldb_url ? '登録済' : '未登録'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="pixel-btn text-xs px-2 py-1 inline-flex items-center gap-1"
                      >
                        <Pencil size={12} /> 編集
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditQuestModal
          progress={editing}
          memberName={members.find((m) => m.id === editing.member_id)?.name ?? ''}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {gameMsg && (
        <GameMessage
          title="記録を保存しました"
          variant="success"
          onClose={() => setGameMsg(null)}
        >
          <p className="whitespace-pre-line">{gameMsg}</p>
        </GameMessage>
      )}
    </div>
  )
}
