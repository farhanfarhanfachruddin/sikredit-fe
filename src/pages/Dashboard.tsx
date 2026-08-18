import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { laporanAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { DashboardData } from '../types'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtNow = () =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    laporanAPI.dashboard()
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <h1>Selamat Datang, {user?.nama}! 👋</h1>
        <p>Ringkasan operasional koperasi hari ini · {fmtNow()}</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary)' }}>👥</div>
          <div className="stat-value">{loading ? '...' : data?.total_nasabah ?? 0}</div>
          <div className="stat-label">Total Nasabah</div>
          <div className="stat-sub">↑ Terdaftar di sistem</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success)' }}>💰</div>
          <div className="stat-value" style={{ fontSize: 15 }}>
            {loading ? '...' : data?.pinjaman_aktif ?? 0}
          </div>
          <div className="stat-label">Pinjaman Aktif</div>
          <div className="stat-sub">Pinjaman berjalan</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning)' }}>⏳</div>
          <div className="stat-value">{loading ? '...' : data?.tagihan_hari_ini ?? 0}</div>
          <div className="stat-label">Tagihan Hari Ini</div>
          <div className="stat-sub">
            {(data?.tagihan_hari_ini ?? 0) > 0 ? '⚠️ Perlu ditagih' : '✅ Tidak ada tagihan'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger)' }}>🎯</div>
          <div className="stat-value">{loading ? '...' : data?.tagihan_menunggak ?? 0}</div>
          <div className="stat-label">Tagihan Menunggak</div>
          <div className="stat-sub">
            {(data?.tagihan_menunggak ?? 0) > 0 ? '🔴 Segera ditagih' : '✅ Semua lancar'}
          </div>
        </div>
      </div>

      {/* Penerimaan hari ini */}
      {data && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div className="card-title">💵 Penerimaan Hari Ini</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>
            {fmtRp(data.penerimaan_hari_ini)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
            Total pembayaran cicilan yang diterima hari ini
          </div>
        </div>
      )}

      {/* Aksi Cepat (pemilik only) */}
      {user?.role === 'pemilik' && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div className="card-title">⚡ Aksi Cepat</div>
          </div>
          <div className="aksi-cepat-wrap" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/nasabah')}>
              👥 Tambah Nasabah
            </button>
            <button className="btn btn-success" onClick={() => navigate('/pengajuan')}>
              📄 Pengajuan Pinjaman
            </button>
            <button
              className="btn btn-danger"
              onClick={() => navigate('/penagihan')}
              style={{ background: 'var(--danger)', color: '#fff' }}
            >
              🎯 Kelola Penagihan
              {(data?.tagihan_menunggak ?? 0) > 0 && (
                <span className="nav-badge" style={{ marginLeft: 4 }}>
                  {data?.tagihan_menunggak}
                </span>
              )}
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/laporan')}>
              📈 Laporan Rekap
            </button>
            <button className="btn btn-outline" onClick={() => window.open('/cek-tagihan', '_blank')}>
  🔍 Cek Tagihan Nasabah
</button>
          </div>
        </div>
      )}

      {/* Info Metode */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Metode SAW</div>
            <span className="badge badge-blue">Aktif</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
            Simple Additive Weighting untuk rekomendasi kelayakan pinjaman
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Penghasilan Bulanan', bobot: 30, color: 'var(--primary)' },
              { label: 'Kelengkapan Data', bobot: 25, color: 'var(--success)' },
              { label: 'Kepemilikan Jaminan', bobot: 25, color: 'var(--purple)' },
              { label: 'Riwayat Pembayaran', bobot: 20, color: 'var(--warning)' },
            ].map((k) => (
              <div key={k.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{k.label}</span>
                  <span style={{ fontWeight: 700 }}>{k.bobot}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${k.bobot}%`, background: k.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 Metode TOPSIS</div>
            <span className="badge badge-green">Aktif</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
            Technique for Order Preference untuk prioritas penagihan harian
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Hari Keterlambatan', bobot: 40, color: 'var(--danger)' },
              { label: 'Sisa Pokok Pinjaman', bobot: 35, color: 'var(--warning)' },
              { label: 'Riwayat Keterlambatan', bobot: 25, color: 'var(--purple)' },
            ].map((k) => (
              <div key={k.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{k.label}</span>
                  <span style={{ fontWeight: 700 }}>{k.bobot}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${k.bobot}%`, background: k.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
