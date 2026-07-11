import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore, getPostLoginPath } from '../stores/authStore'
import { PixelWindow } from '../components/PixelWindow'

export function LoginPage() {
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signIn)
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

  if (profile) {
    return <Navigate to={getPostLoginPath(profile)} replace />
  }

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
    const saved = sessionStorage.getItem('trepro-profile')
    const loggedIn = saved ? (JSON.parse(saved) as import('../types').Profile) : null
    navigate(loggedIn ? getPostLoginPath(loggedIn) : '/', { replace: true })
  }

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
                autoComplete="username"
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
                autoComplete="current-password"
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
        </PixelWindow>
      </div>
    </div>
  )
}
