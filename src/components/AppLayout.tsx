import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Settings, LogOut, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import {
  canAccessAdmin,
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
  const location = useLocation()

  const navItems: { to: string; label: string; icon: typeof Home }[] = []

  if (isAdmin(profile)) {
    navItems.push(
      { to: '/', label: 'ワールド', icon: Home },
      { to: '/members/asai', label: '浅井さん', icon: Map },
      { to: '/members/nakakuki', label: '中岫さん', icon: Map },
      { to: '/admin', label: '管理', icon: Settings },
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
                  location.pathname === to ? 'pixel-btn-gold' : ''
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
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
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
