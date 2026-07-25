import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  pemilikOnly?: boolean
}

export default function ProtectedRoute({ children, pemilikOnly }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Memuat...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (pemilikOnly && user.role !== 'pemilik') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
