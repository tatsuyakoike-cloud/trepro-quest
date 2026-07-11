import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { canAccessAdmin, getRoleLabel } from '../lib/permissions'
import { isSupabaseConfigured } from '../lib/supabase'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile)
  const isDemo = useAuthStore((s) => s.isDemo)
  const signOut = useAuthStore((s) => s.signOut)
  const location = useLocation()

  const navItems = [
    { to: '/', label: 'ワールド', icon: Home },
    { to: '/members/asai', label: '浅井さん', icon: Map },
    { to: '/members/nakakuki', label: '中岫さん', icon: Map },
  ]

  if (canAccessAdmin(profile)) {
    navItems.push({ to: '/admin', label: '管理', icon: Settings })
  }

  return (
    <div className="pixel-bg-world min-h-screen">
      <header className="border-b-3 border-white bg-[#0a0a1a]/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="pixel-title text-lg no-underline">
            トレプロクエスト
          </Link>
          <nav className="flex items-center gap-1">
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
          <div className="flex items-center gap-3">
            {isDemo && !isSupabaseConfigured() && (
              <span className="text-xs bg-purple-700 px-2 py-1 pixel-font">デモモード</span>
            )}
            {profile && (
              <span className="text-sm text-gray-400">
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
