import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
  title: string
}

const navItemsPemilik = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/nasabah', icon: '👥', label: 'Data Nasabah' },
  { to: '/pengajuan', icon: '📋', label: 'Pengajuan Pinjaman' },
  { to: '/cicilan', icon: '💳', label: 'Catat Cicilan' },
  { to: '/penagihan', icon: '🎯', label: 'Penagihan Harian' },
  { to: '/laporan', icon: '📈', label: 'Laporan Rekap' },
]

const navItemsOperator = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/cicilan', icon: '💳', label: 'Catat Cicilan' },
  { to: '/penagihan', icon: '🎯', label: 'Penagihan Harian' },
]

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = user?.role === 'pemilik' ? navItemsPemilik : navItemsOperator

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💳</div>
          <div className="sidebar-logo-text">
            <div className="app-name">SiKredit-KSP</div>
            <div className="app-sub">v1.0 · KSP</div>
          </div>
        </div>

        <div className="sidebar-role">
          <div className={`role-dot ${user?.role}`}></div>
          <div>
            <div className="role-name">{user?.role === 'pemilik' ? 'Pemilik' : 'Operator'}</div>
            <div className="role-label">{user?.nama}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu Utama</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav (mobile) */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main Area */}
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <span className={`topbar-badge ${user?.role}`}>
            {user?.role === 'pemilik' ? '👑 Pemilik' : '🔧 Operator'}
          </span>
          <div className={`topbar-avatar ${user?.role}`}>
            {user?.nama?.charAt(0).toUpperCase()}
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
