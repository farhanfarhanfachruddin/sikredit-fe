import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Nasabah from './pages/Nasabah'
import Pengajuan from './pages/Pengajuan'
import Penagihan from './pages/Penagihan'
import Laporan from './pages/Laporan'
import CekTagihan from './pages/CekTagihan'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/cek-tagihan" element={<CekTagihan />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/nasabah" element={<ProtectedRoute pemilikOnly><Nasabah /></ProtectedRoute>} />
          <Route path="/pengajuan" element={<ProtectedRoute pemilikOnly><Pengajuan /></ProtectedRoute>} />
          <Route path="/penagihan" element={<ProtectedRoute><Penagihan /></ProtectedRoute>} />
          <Route path="/laporan" element={<ProtectedRoute pemilikOnly><Laporan /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
