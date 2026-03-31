import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute() {
  const { token, ready } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-stone-500">
        Loading…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
