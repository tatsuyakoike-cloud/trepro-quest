import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useDataStore } from '../stores/dataStore'

export function SyncStatusBadge() {
  const syncMode = useDataStore((s) => s.syncMode)
  const lastSyncedAt = useDataStore((s) => s.lastSyncedAt)
  const loading = useDataStore((s) => s.loading)
  const load = useDataStore((s) => s.load)

  const isSheets = syncMode === 'sheets'
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
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 border ${
          isSheets
            ? 'border-green-500/50 text-green-400'
            : 'border-yellow-500/50 text-yellow-400'
        }`}
        title={
          isSheets
            ? 'スプレッドシートと双方向同期中'
            : 'ローカルデータモード（syncApiUrl 未設定）'
        }
      >
        {isSheets ? <Cloud size={12} /> : <CloudOff size={12} />}
        {isSheets ? 'シート連携' : 'ローカル'}
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
