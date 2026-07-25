import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { laporanAPI } from '../api'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

type Tab = 'pinjaman' | 'cicilan' | 'penagihan'
type Periode = 'harian' | 'mingguan' | 'bulanan'

export default function LaporanPage() {
  const [tab, setTab] = useState<Tab>('pinjaman')
  const [periode, setPeriode] = useState<Periode>('bulanan')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    const call = tab === 'pinjaman'
      ? laporanAPI.pinjaman(periode)
      : tab === 'cicilan'
      ? laporanAPI.cicilan(periode)
      : laporanAPI.penagihan(periode)

    call.then(res => setData(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [tab, periode])

  return (
    <Layout title="Laporan Rekap">
      <div className="page-header">
        <h1>Laporan Rekap</h1>
        <p>Rekap data koperasi berdasarkan periode yang dipilih</p>
      </div>

      {/* Tab */}
      <div className="tab-laporan" style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {(['pinjaman', 'cicilan', 'penagihan'] as Tab[]).map(t => (
          <button key={t} className={`tab-btn btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'pinjaman' ? '💰 Pinjaman' : t === 'cicilan' ? '📅 Cicilan' : '🎯 Penagihan'}
          </button>
        ))}
      </div>

      {/* Filter Periode */}
      <div className="filter-periode" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['harian', 'mingguan', 'bulanan'] as Periode[]).map(p => (
          <button key={p} className={`periode-btn btn btn-sm ${periode === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPeriode(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Memuat laporan...</div></div></div>
      ) : !data ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">Tidak ada data</div></div></div>
      ) : (
        <>
          {/* Ringkasan */}
          <div className="rekap-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            {tab === 'pinjaman' && [
              { label: 'Total Nasabah', val: data.ringkasan.total_nasabah, icon: '👥', color: 'var(--primary)' },
              { label: 'Pinjaman Aktif', val: data.ringkasan.pinjaman_aktif, icon: '💰', color: 'var(--success)' },
              { label: 'Pinjaman Lunas', val: data.ringkasan.pinjaman_lunas, icon: '✅', color: 'var(--success)' },
              { label: 'Pinjaman Macet', val: data.ringkasan.pinjaman_macet, icon: '⚠️', color: 'var(--danger)' },
              { label: 'Total Pinjaman Aktif', val: fmtRp(data.ringkasan.total_pinjaman_aktif), icon: '📊', color: 'var(--primary)' },
              { label: 'Total Sisa Pokok', val: fmtRp(data.ringkasan.total_sisa_pokok), icon: '💵', color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} className="rekap-card stat-card">
                <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                <div className="rk-val stat-value" style={{ fontSize: 16 }}>{s.val}</div>
                <div className="rk-label stat-label">{s.label}</div>
              </div>
            ))}

            {tab === 'cicilan' && [
              { label: 'Terbayar', val: data.ringkasan.total_terbayar, icon: '✅', color: 'var(--success)' },
              { label: 'Menunggak', val: data.ringkasan.total_menunggak, icon: '⚠️', color: 'var(--danger)' },
              { label: 'Dibayar Sebagian', val: data.ringkasan.total_dibayar_sebagian, icon: '🔶', color: 'var(--warning)' },
              { label: 'Nominal Terbayar', val: fmtRp(data.ringkasan.nominal_terbayar), icon: '💰', color: 'var(--primary)' },
              { label: 'Nominal Sebagian', val: fmtRp(data.ringkasan.nominal_sebagian), icon: '💵', color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} className="rekap-card stat-card">
                <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                <div className="rk-val stat-value" style={{ fontSize: 16 }}>{s.val}</div>
                <div className="rk-label stat-label">{s.label}</div>
              </div>
            ))}

            {tab === 'penagihan' && [
              { label: 'Sudah Ditagih', val: data.ringkasan.sudah_ditagih, icon: '✅', color: 'var(--success)' },
              { label: 'Belum Ditagih', val: data.ringkasan.belum_ditagih, icon: '⏳', color: 'var(--warning)' },
              { label: 'Tidak Ada di Tempat', val: data.ringkasan.tidak_ada_di_tempat, icon: '🔴', color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} className="rekap-card stat-card">
                <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                <div className="rk-val stat-value" style={{ fontSize: 20 }}>{s.val}</div>
                <div className="rk-label stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabel detail pinjaman */}
          {tab === 'pinjaman' && (
            <div className="card">
              <div className="card-header"><div className="card-title">📋 Detail Pinjaman Aktif</div></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Nasabah</th><th>Jumlah Pinjaman</th><th>Sisa Pokok</th><th>Tenor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.detail.aktif.length === 0 ? (
                      <tr><td colSpan={5} className="text-center" style={{ padding: 24 }}>Tidak ada data</td></tr>
                    ) : data.detail.aktif.map((p: any) => (
                      <tr key={p._id}>
                        <td><strong>{(p.nasabah_id as any)?.nama_lengkap ?? '-'}</strong></td>
                        <td>{fmtRp(p.jumlah_pinjaman)}</td>
                        <td>{fmtRp(p.sisa_pokok)}</td>
                        <td>{p.tenor} bulan</td>
                        <td><span className="badge badge-green">Aktif</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabel detail penagihan */}
          {tab === 'penagihan' && (
            <div className="card">
              <div className="card-header"><div className="card-title">📋 Detail Penagihan</div></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Nasabah</th><th>No HP</th><th>Alamat</th><th>Hasil</th></tr>
                  </thead>
                  <tbody>
                    {[...data.detail.sudah_ditagih, ...data.detail.belum_ditagih, ...data.detail.tidak_ada].length === 0 ? (
                      <tr><td colSpan={4} className="text-center" style={{ padding: 24 }}>Tidak ada data</td></tr>
                    ) : [...data.detail.sudah_ditagih, ...data.detail.tidak_ada].map((p: any) => (
                      <tr key={p._id}>
                        <td><strong>{(p.nasabah_id as any)?.nama_lengkap ?? '-'}</strong></td>
                        <td>{(p.nasabah_id as any)?.no_hp ?? '-'}</td>
                        <td>{(p.nasabah_id as any)?.alamat ?? '-'}</td>
                        <td>
                          <span className={`badge ${p.hasil_kunjungan ? 'badge-green' : 'badge-red'}`}>
                            {p.hasil_kunjungan ?? 'Belum Ditagih'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
