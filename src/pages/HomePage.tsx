import { useEffect } from 'react'
import { useDataStore } from '../stores/dataStore'
import { MemberCard } from '../components/MemberCard'
import { PixelWindow } from '../components/PixelWindow'

export function HomePage() {
  const load = useDataStore((s) => s.load)
  const loading = useDataStore((s) => s.loading)
  const error = useDataStore((s) => s.error)
  const stats = useDataStore((s) => s.getAllMemberStats())
  const kpi = useDataStore((s) => s.getDashboardKpi())

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="pixel-font text-center text-[#f5d742] animate-pulse">ワールド読み込み中...</p>
  }

  if (error) {
    return (
      <PixelWindow title="エラー">
        <p className="text-red-400">{error}</p>
      </PixelWindow>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="pixel-title text-3xl">トレプロワールド</h1>
        <p className="text-gray-400 mt-2">新卒メンバーの冒険記録</p>
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

      <div className="flex flex-wrap gap-6 justify-center">
        {stats.map((s) => (
          <MemberCard key={s.member.id} stats={s} />
        ))}
      </div>
    </div>
  )
}
