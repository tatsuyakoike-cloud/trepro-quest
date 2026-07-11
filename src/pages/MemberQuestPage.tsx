import { useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '../stores/authStore'
import { canEditProgress, canViewMember, getMemberHomePath } from '../lib/permissions'
import {
  TABS,
  TAB_SECTIONS,
  groupProgressesByTab,
  getDocumentLevelProgress,
  type QuestTab,
} from '../lib/missions'
import { computeMemberStatsBySlug } from '../lib/stats'
import { PixelWindow } from '../components/PixelWindow'
import { ProgressBar } from '../components/ProgressBar'
import { QuestCard } from '../components/QuestCard'
import { CategoryLevelCard } from '../components/CategoryLevelCard'
import { EditQuestModal } from '../components/EditQuestModal'
import { GameMessage } from '../components/GameMessage'
import type { ProgressUpdateInput, ProgressWithMission } from '../types'

const VALID_SLUGS = ['asai', 'nakakuki']

export function MemberQuestPage() {
  const { slug } = useParams<{ slug: string }>()
  const profile = useAuthStore((s) => s.profile)
  const loading = useDataStore((s) => s.loading)
  const members = useDataStore((s) => s.members)
  const missions = useDataStore((s) => s.missions)
  const progresses = useDataStore((s) => s.progresses)
  const saveProgress = useDataStore((s) => s.saveProgress)

  const [activeTab, setActiveTab] = useState<QuestTab>('商談ロープレ')
  const [editing, setEditing] = useState<ProgressWithMission | null>(null)
  const [gameMsg, setGameMsg] = useState<{
    title: string
    body: React.ReactNode
    variant: 'info' | 'levelup' | 'success'
  } | null>(null)

  const stats = useMemo(
    () => (slug ? computeMemberStatsBySlug(slug, members, missions, progresses) : null),
    [slug, members, missions, progresses],
  )

  const tabProgresses = useMemo(
    () => (stats ? groupProgressesByTab(stats.progresses) : null),
    [stats],
  )

  if (!slug || !VALID_SLUGS.includes(slug)) {
    return <Navigate to="/" replace />
  }

  if (!canViewMember(profile, slug)) {
    return <Navigate to={getMemberHomePath(profile)} replace />
  }

  if (loading || !stats || !tabProgresses) {
    return <p className="pixel-font text-center text-[#f5d742] animate-pulse">クエスト読み込み中...</p>
  }

  const canEdit = canEditProgress(profile, slug)

  const handleSave = async (input: ProgressUpdateInput) => {
    if (!editing) return
    const result = await saveProgress(
      editing.id,
      input,
      profile?.id ?? null,
      stats.member.name,
    )
    if (result.error) {
      setGameMsg({
        title: 'エラー',
        body: <p className="text-red-400">{result.error}</p>,
        variant: 'info',
      })
      return
    }

    const warningText = result.warning ? (
      <p className="text-yellow-400 text-sm mt-2">{result.warning}</p>
    ) : null

    if (result.leveledUp && result.newTitle) {
      setGameMsg({
        title: 'レベルが あがった！',
        body: (
          <>
            <div className="level-up-stars">★ ★ ★</div>
            <p className="text-lg">
              {stats.member.name}は<br />
              「{result.newTitle}」になった。
            </p>
            {warningText}
          </>
        ),
        variant: 'levelup',
      })
    } else {
      setGameMsg({
        title: '記録を保存しました',
        body: (
          <>
            <p>{stats.member.name}の冒険記録を更新しました。</p>
            {warningText}
          </>
        ),
        variant: 'success',
      })
    }
  }

  const documentLevelProgresses = getDocumentLevelProgress(tabProgresses['資料作成'])

  function renderSection(sectionName: string, items: ProgressWithMission[]) {
    const sectionItems = items.filter((p) => p.mission.mission_group === sectionName)
    if (sectionItems.length === 0 && sectionName !== 'レベル上げ') return null

    if (sectionName === 'レベル上げ') {
      return (
        <div key={sectionName} className="mb-6">
          <CategoryLevelCard
            title="資料作成"
            progresses={documentLevelProgresses}
          />
        </div>
      )
    }

    return (
      <div key={sectionName} className="space-y-4 mb-8">
        <h3 className="pixel-font text-[#f5d742] text-base border-b border-white/20 pb-2">
          {sectionName}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionItems.map((p) => (
            <QuestCard
              key={p.id}
              progress={p}
              canEdit={canEdit}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PixelWindow title={`${stats.member.name}の冒険記録`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-gray-500 text-sm">レベル</span>
            <p className="pixel-font text-2xl text-[#f5d742]">{stats.levelLabel}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">称号</span>
            <p className="text-white">{stats.title}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">合格数</span>
            <p className="pixel-font text-xl text-green-400">{stats.passedCount}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">最終更新</span>
            <p className="text-sm">
              {stats.lastUpdated
                ? new Date(stats.lastUpdated).toLocaleDateString('ja-JP')
                : '—'}
            </p>
          </div>
        </div>
        <ProgressBar value={stats.progressRate} label="総合進捗" gold={stats.passedCount >= 6} />
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-yellow-400">審査待ち: {stats.pendingReviewCount}</span>
          <span className="text-red-400">再挑戦: {stats.retryCount}</span>
        </div>
      </PixelWindow>

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

      {activeTab === '商談ロープレ' && (
        <div>
          {TAB_SECTIONS['商談ロープレ'].map((section) =>
            renderSection(section, tabProgresses['商談ロープレ']),
          )}
        </div>
      )}

      {activeTab === '資料作成' && (
        <div>
          {TAB_SECTIONS['資料作成'].map((section) =>
            renderSection(section, tabProgresses['資料作成']),
          )}
        </div>
      )}

      {editing && (
        <EditQuestModal
          progress={editing}
          memberName={stats.member.name}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {gameMsg && (
        <GameMessage
          title={gameMsg.title}
          variant={gameMsg.variant}
          onClose={() => setGameMsg(null)}
        >
          {gameMsg.body}
        </GameMessage>
      )}
    </div>
  )
}
