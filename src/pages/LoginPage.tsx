import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { PixelWindow } from '../components/PixelWindow'

export function LoginPage() {
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signIn)
  const signInDemo = useAuthStore((s) => s.signInDemo)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="pixel-bg-world min-h-screen flex items-center justify-center">
        <p className="pixel-font text-[#f5d742] animate-pulse">読み込み中...</p>
      </div>
    )
  }

  if (profile) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) {
      setError(err)
      setSubmitting(false)
      return
    }
    navigate('/', { replace: true })
  }

  const handleDemoLogin = (role: 'admin' | 'reviewer' | 'member') => {
    signInDemo(role)
    navigate('/', { replace: true })
  }

  const isDemo = !isSupabaseConfigured()

  return (
    <div className="pixel-bg-world min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="pixel-title text-3xl">トレプロクエスト</h1>
          <p className="text-gray-400">現場で戦える仲間になるための育成記録</p>
        </div>

        <PixelWindow title="冒険の書">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                className="pixel-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={isDemo ? 'admin@trepro.jp' : 'your@email.com'}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                className="pixel-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={isDemo ? 'trepro2026' : ''}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="pixel-btn pixel-btn-gold w-full text-lg"
            >
              {submitting ? '認証中...' : '冒険をはじめる'}
            </button>
          </form>

          {isDemo && (
            <div className="mt-6 pt-4 border-t border-white/20 space-y-3">
              <p className="text-xs text-gray-500 text-center">
                Supabase未設定 — デモモードで動作中
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="pixel-btn text-xs"
                >
                  管理者
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('reviewer')}
                  className="pixel-btn text-xs"
                >
                  審査者
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('member')}
                  className="pixel-btn text-xs"
                >
                  メンバー
                </button>
              </div>
              <p className="text-xs text-gray-600 text-center">
                デモ用: admin@trepro.jp / trepro2026
              </p>
            </div>
          )}
        </PixelWindow>
      </div>
    </div>
  )
}
