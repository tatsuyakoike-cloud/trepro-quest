import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Map, Settings, LogOut, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import { loadConfig } from '../lib/config'
import { SyncStatusBadge } from './SyncStatusBadge'
import {
  canAccessAdmin,
  getAdminHomePath,
  getMemberHomePath,
  getRoleLabel,
  isAdmin,
  isMember,
} from '../lib/permissions'

const SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM/edit'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const load = useDataStore((s) => s.load)
  const startPolling = useDataStore((s) => s.startPolling)
  const stopPolling = useDataStore((s) => s.stopPolling)
  const syncMode = useDataStore((s) => s.syncMode)
  const syncMessage = useDataStore((s) => s.syncMessage)
  const location = useLocation()

  useEffect(() => {
    void load()
    void loadConfig().then((config) => {
      if (config.syncApiUrl) startPolling(config.pollIntervalMs)
    })
    return () => stopPolling()
  }, [load, startPolling, stopPolling])

  const navItems: { to: string; label: string; icon: typeof Map }[] = []

  if (isAdmin(profile)) {
    navItems.push(
      { to: getAdminHomePath(), label: '進捗管理', icon: Settings },
      { to: '/members/asai', label: '浅井さん', icon: Map },
      { to: '/members/nakakuki', label: '中岫さん', icon: Map },
    )
  } else if (isMember(profile) && profile?.member_slug) {
    navItems.push({
      to: getMemberHomePath(profile),
      label: '冒険の記録',
      icon: Map,
    })
  }

  return (
    <div className="pixel-bg-world min-h-screen">
      <header className="border-b-3 border-white bg-[#0a0a1a]/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            to={profile ? getMemberHomePath(profile) : '/'}
            className="pixel-title text-lg no-underline shrink-0"
          >
            トレプロクエスト
          </Link>
          <nav className="flex items-center gap-1 flex-wrap justify-center">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`pixel-btn text-xs px-3 py-2 no-underline inline-flex items-center gap-1 ${
                  location.pathname === to ||
                  (to === getAdminHomePath() && location.pathname === '/')
                    ? 'pixel-btn-gold'
                    : ''
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <SyncStatusBadge />
            {canAccessAdmin(profile) && (
              <a
                href={SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn text-xs px-2 py-1 no-underline text-white inline-flex items-center gap-1"
                title="マスターデータ（スプレッドシート）"
              >
                <ExternalLink size={12} />
                マスター
              </a>
            )}
            {profile && (
              <span className="text-sm text-gray-400 hidden sm:inline">
                {profile.name}（{getRoleLabel(profile.role)}）
              </span>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="pixel-btn pixel-btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1"
            >
              <LogOut size={14} />
              終了
            </button>
          </div>
        </div>
      </header>
      {syncMode === 'local' && (
        <div className="bg-yellow-900/40 border-b border-yellow-500/40 text-yellow-200 text-sm text-center py-2 px-4">
          スプレッドシート未連携です。UIの変更はブラウザ内にのみ保存されます。
        </div>
      )}
      {syncMode === 'offline' && (
        <div className="bg-red-900/40 border-b border-red-500/40 text-red-200 text-sm text-center py-2 px-4">
          {syncMessage ?? 'シートAPIに接続できません。'}
          {' '}Apps Script のデプロイで「アクセス: 全員」に設定して再デプロイしてください。
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
