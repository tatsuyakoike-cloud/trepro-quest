import { Cloud, CloudOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { useDataStore } from '../stores/dataStore'

export function SyncStatusBadge() {
  const syncMode = useDataStore((s) => s.syncMode)
  const lastSyncedAt = useDataStore((s) => s.lastSyncedAt)
  const loading = useDataStore((s) => s.loading)
  const load = useDataStore((s) => s.load)

  const badge =
    syncMode === 'sheets'
      ? { icon: Cloud, label: 'シート連携', className: 'border-green-500/50 text-green-400', title: 'スプレッドシートと双方向同期中' }
      : syncMode === 'offline'
        ? { icon: AlertTriangle, label: '接続エラー', className: 'border-red-500/50 text-red-400', title: 'シートAPIに接続できません' }
        : { icon: CloudOff, label: 'ローカル', className: 'border-yellow-500/50 text-yellow-400', title: 'ローカルデータモード' }

  const Icon = badge.icon
  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 border ${badge.className}`}
        title={badge.title}
      >
        <Icon size={12} />
        {badge.label}
      </span>
      {lastSyncLabel && (
        <span className="text-xs text-gray-500 hidden md:inline">
          同期 {lastSyncLabel}
        </span>
      )}
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="pixel-btn text-xs px-2 py-1 inline-flex items-center gap-1"
        title="今すぐ同期"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  )
}
