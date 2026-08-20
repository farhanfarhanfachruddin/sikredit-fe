import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { User } from '../types'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const fillDemo = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError('')
  }

  const doLogin = async () => {
    if (locked) return
    if (!username || !password) {
      setError('Username dan password wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await authAPI.login(username, password)
      const { token, role, nama } = res.data.data

      const user: User = { id: '', username, nama, role }
      login(token, user)
      navigate('/dashboard')
    } catch {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        setLocked(true)
      } else {
        setError(`Username atau password salah. Percobaan ${newAttempts}/5`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doLogin()
  }

  return (
    <div className="login-page">
      {/* Kiri: Branding */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">🛡️</div>
          <div>
            <h1>SiKredit-KSP</h1>
            <p>Sistem Pengelolaan Kredit & Pemantauan Penagihan</p>
          </div>
        </div>
        <div className="login-tagline">
          Kelola Koperasi<br />Lebih Cerdas &<br />Terstruktur
        </div>
        <p className="login-desc">
          Digitalisasi seluruh operasional koperasi simpan pinjam — dari pendataan nasabah,
          rekomendasi kredit SAW, hingga prioritas penagihan TOPSIS — dalam satu sistem berbasis web.
        </p>
        <div className="login-stats">
          <div className="login-stat">
            <div className="login-stat-val"></div>
            <div className="login-stat-label"></div>
          </div>
          <div className="login-stat">
            <div className="login-stat-val"></div>
            <div className="login-stat-label"></div>
          </div>
          <div className="login-stat">
            <div className="login-stat-val"></div>
            <div className="login-stat-label"></div>
          </div>
          <div className="login-stat">
            <div className="login-stat-val"></div>
            <div className="login-stat-label"></div>
          </div>
        </div>
      </div>

      {/* Kanan: Form */}
      <div className="login-right">
        <div className="login-form-wrap">
          {/* Mobile brand */}
          <div className="login-mobile-brand">
            <div className="brand-icon">🛡️</div>
            <div>
              <div className="brand-name">SiKredit-KSP</div>
              <div className="brand-sub">Sistem Pengelolaan Kredit</div>
            </div>
          </div>

          <h2>Masuk ke Sistem</h2>
          <p>Silakan masukkan kredensial Anda untuk mengakses SiKredit-KSP</p>

          {error && <div className="error-box">{error}</div>}
          {locked && (
            <div className="locked-box">
              🔒 Akun terkunci sementara akibat 5x percobaan gagal.<br />
              Hubungi pemilik koperasi untuk membuka kunci.
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={locked}
              autoComplete="username"
            />
          </div>

<div className="form-group">
  <label>Password</label>
  <div className="password-field">
    <input
      type={showPass ? 'text' : 'password'}
      className="form-control"
      placeholder="Masukkan password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={locked}
      autoComplete="current-password"
    />
    <button
      type="button"
      className="toggle-pass"
      onClick={() => setShowPass(!showPass)}
    >
      {showPass ? '🙈' : '👁'}
    </button>
  </div>
</div>
          {attempts > 0 && !locked && (
            <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8, textAlign: 'right' }}>
              Percobaan {attempts}/5
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={doLogin}
            disabled={loading || locked}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          >
            {loading ? '⏳ Memuat...' : '🔐 Masuk ke Sistem'}
          </button>

          {/* Demo accounts */}

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
  
    href="/cek-tagihan"
    target="_blank"
    style={{
      fontSize: 13,
      color: 'var(--primary)',
      textDecoration: 'none',
      fontWeight: 600,
    }}
  >
    🔍 Cek Tagihan Nasabah (Tanpa Login)
  </a>
</div>

          <div className="login-demo">
            <div className="login-demo-title">— Akun Demo —</div>
            <button className="demo-account" onClick={() => fillDemo('pemilik', 'pemilik123')}>
              <div className="demo-avatar" style={{ background: 'var(--primary)' }}>P</div>
              <div className="demo-info">
                <div className="demo-role">Pemilik (Admin)</div>
                <div className="demo-cred">pemilik / pemilik123</div>
              </div>
            </button>
            <button className="demo-account" onClick={() => fillDemo('operator', 'operator123')}>
              <div className="demo-avatar" style={{ background: 'var(--success)' }}>O</div>
              <div className="demo-info">
                <div className="demo-role">Operator</div>
                <div className="demo-cred">operator / operator123</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
