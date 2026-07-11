import { Link } from 'react-router-dom'
import { Sword, Clock, RotateCcw } from 'lucide-react'
import type { MemberStats } from '../types'
import { PixelWindow } from './PixelWindow'
import { ProgressBar } from './ProgressBar'

interface MemberCardProps {
  stats: MemberStats
}

export function MemberCard({ stats }: MemberCardProps) {
  const { member, levelLabel, title, progressRate, passedCount, pendingReviewCount, retryCount, nextMission, lastUpdated } = stats

  return (
    <PixelWindow className="flex-1 min-w-[320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="pixel-font text-xl text-white">{member.name}</h3>
            <p className="text-sm text-gray-400">{title}</p>
          </div>
          <div className="text-right">
            <span className="pixel-font text-2xl text-[#f5d742]">{levelLabel}</span>
          </div>
        </div>

        <ProgressBar value={progressRate} label="総合進捗" gold={passedCount >= 6} />

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-[#1a1a2e] p-2 border border-white/30">
            <div className="pixel-font text-green-400">{passedCount}</div>
            <div className="text-xs text-gray-400">合格</div>
          </div>
          <div className="bg-[#1a1a2e] p-2 border border-yellow-500/50">
            <div className="pixel-font text-yellow-400 flex items-center justify-center gap-1">
              <Clock size={12} /> {pendingReviewCount}
            </div>
            <div className="text-xs text-gray-400">審査待ち</div>
          </div>
          <div className="bg-[#1a1a2e] p-2 border border-red-500/50">
            <div className="pixel-font text-red-400 flex items-center justify-center gap-1">
              <RotateCcw size={12} /> {retryCount}
            </div>
            <div className="text-xs text-gray-400">再挑戦</div>
          </div>
        </div>

        {nextMission && (
          <div className="flex items-start gap-2 text-sm bg-[#1a1a2e] p-3 border border-white/20">
            <Sword size={16} className="text-[#60a5fa] mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400">次のクエスト：</span>
              <span className="text-white">{nextMission.title}</span>
            </div>
          </div>
        )}

        {lastUpdated && (
          <p className="text-xs text-gray-500">
            最終更新: {new Date(lastUpdated).toLocaleDateString('ja-JP')}
          </p>
        )}

        <Link
          to={`/members/${member.slug}`}
          className="pixel-btn pixel-btn-gold block text-center no-underline"
        >
          冒険の記録を見る
        </Link>
      </div>
    </PixelWindow>
  )
}
