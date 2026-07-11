import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '../stores/authStore'
import { canAccessAdmin, getMemberHomePath } from '../lib/permissions'
import { buildProgressWithMission, computeDashboardKpi } from '../lib/stats'
import {
  TABS,
  TAB_SECTIONS,
  filterProgressesByTab,
  getDocumentLevelProgress,
  getMissionsForSection,
  type QuestTab,
} from '../lib/missions'
import { PixelWindow } from '../components/PixelWindow'
import { CategoryLevelCard } from '../components/CategoryLevelCard'
import {
  AdminProgressMatrix,
  buildProgressMap,
} from '../components/AdminProgressMatrix'
import { AdminMemberTabSummary } from '../components/AdminMemberTabSummary'
import { EditQuestModal } from '../components/EditQuestModal'
import { GameMessage } from '../components/GameMessage'
import type { Member, ProgressUpdateInput, ProgressWithMission } from '../types'
import { downloadRequirementsDoc } from '../lib/downloadRequirements'

export function AdminPage() {
  const profile = useAuthStore((s) => s.profile)
  const loading = useDataStore((s) => s.loading)
  const members = useDataStore((s) => s.members)
  const missions = useDataStore((s) => s.missions)
  const progresses = useDataStore((s) => s.progresses)
  const saveProgress = useDataStore((s) => s.saveProgress)

  const [activeTab, setActiveTab] = useState<QuestTab>('商談ロープレ')
  const [editing, setEditing] = useState<ProgressWithMission | null>(null)
  const [gameMsg, setGameMsg] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState(false)

  const activeMembers = useMemo(
    () => members.filter((m) => m.active).sort((a, b) => a.slug.localeCompare(b.slug)),
    [members],
  )

  const allProgresses = useMemo(
    () => buildProgressWithMission(progresses, missions),
    [progresses, missions],
  )

  const progressMap = useMemo(
    () => buildProgressMap(allProgresses),
    [allProgresses],
  )

  const tabProgresses = useMemo(
    () => filterProgressesByTab(allProgresses, activeTab),
    [allProgresses, activeTab],
  )

  const kpi = useMemo(
    () => computeDashboardKpi(activeMembers, missions, progresses),
    [activeMembers, missions, progresses],
  )

  if (!canAccessAdmin(profile)) {
    return <Navigate to={getMemberHomePath(profile)} replace />
  }

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
    const warningNote = result.warning ? `\n\n※ ${result.warning}` : ''
    if (result.leveledUp && result.newTitle && member) {
      setGameMsg(
        `記録を保存しました。\n${member.name}は「${result.newTitle}」になった。${warningNote}`,
      )
    } else {
      setGameMsg(
        `記録を保存しました。\n${member?.name ?? ''}の冒険記録を更新しました。${warningNote}`,
      )
    }
  }

  const handleDownloadRequirements = () => {
    setDownloadingDoc(true)
    try {
      downloadRequirementsDoc()
      setGameMsg('要件定義書をダウンロードしました')
    } catch (e) {
      setGameMsg(e instanceof Error ? e.message : 'ダウンロードに失敗しました')
    } finally {
      setDownloadingDoc(false)
    }
  }

  function renderDocumentLevelSection() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {activeMembers.map((member) => {
          const memberDocumentProgresses = getDocumentLevelProgress(
            allProgresses.filter((p) => p.member_id === member.id),
          )
          return (
            <CategoryLevelCard
              key={member.id}
              title={member.name}
              progresses={memberDocumentProgresses}
            />
          )
        })}
      </div>
    )
  }

  function renderSection(sectionName: string) {
    if (sectionName === 'レベル上げ') {
      return (
        <div key={sectionName} className="mb-8">
          <h3 className="pixel-font text-[#f5d742] text-base border-b border-white/20 pb-2 mb-4">
            {sectionName}
          </h3>
          {renderDocumentLevelSection()}
        </div>
      )
    }

    const sectionMissions = getMissionsForSection(missions, activeTab, sectionName)
    if (sectionMissions.length === 0) return null

    return (
      <div key={sectionName} className="mb-8">
        <h3 className="pixel-font text-[#f5d742] text-base border-b border-white/20 pb-2 mb-4">
          {sectionName}
        </h3>
        <AdminProgressMatrix
          missions={sectionMissions}
          members={activeMembers}
          progressMap={progressMap}
          onEdit={setEditing}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <p className="pixel-font text-center text-[#f5d742] animate-pulse">
        管理画面読み込み中...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pixel-title text-2xl">進捗管理</h1>
        <p className="text-gray-400 mt-1 text-sm">全メンバーのクエスト進捗を一覧で確認・更新</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="kpi-card">
          <div className="text-xs text-gray-400">全Step数</div>
          <div className="kpi-value">{kpi.totalSteps}</div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-gray-400">全体合格数</div>
          <div className="kpi-value">{kpi.totalPassed}</div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-gray-400">審査待ち</div>
          <div className="kpi-value text-yellow-400">{kpi.pendingReview}</div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-gray-400">再挑戦</div>
          <div className="kpi-value text-red-400">{kpi.retryCount}</div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-gray-400">今週完了</div>
          <div className="kpi-value text-green-400">{kpi.completedThisWeek}</div>
        </div>
        <div className="kpi-card">
          <div className="text-xs text-gray-400">期限超過</div>
          <div className={`kpi-value ${kpi.overdueCount > 0 ? 'kpi-value-danger' : ''}`}>
            {kpi.overdueCount}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pixel-btn text-sm px-4 py-2 ${activeTab === tab ? 'pixel-btn-gold' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <PixelWindow title={`${activeTab} — メンバー別サマリー`}>
        <AdminMemberTabSummary members={activeMembers} tabProgresses={tabProgresses} />
      </PixelWindow>

      <div>
        {TAB_SECTIONS[activeTab].map((section) => renderSection(section))}
      </div>

      <div className="text-center pt-6 pb-2">
        <button
          type="button"
          onClick={handleDownloadRequirements}
          disabled={downloadingDoc}
          className="text-[10px] text-gray-600 hover:text-gray-400 underline-offset-2 hover:underline transition-colors disabled:opacity-50"
        >
          {downloadingDoc ? 'ダウンロード中...' : '要件定義書の MD ファイルをダウンロード'}
        </button>
      </div>

      {editing && (
        <EditQuestModal
          progress={editing}
          memberName={
            activeMembers.find((m: Member) => m.id === editing.member_id)?.name ?? ''
          }
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
