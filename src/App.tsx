import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { MemberQuestPage } from './pages/MemberQuestPage'
import { AdminPage } from './pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div className="pixel-bg-world min-h-screen flex items-center justify-center">
        <p className="pixel-font text-[#f5d742] animate-pulse">読み込み中...</p>
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

function AppRoutes() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/:slug"
        element={
          <ProtectedRoute>
            <MemberQuestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/trepro-quest">
      <AppRoutes />
    </BrowserRouter>
  )
}
