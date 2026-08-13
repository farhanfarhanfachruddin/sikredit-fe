import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { nasabahAPI, cicilanAPI, laporanAPI } from '../api'
import { Nasabah, Cicilan, Pinjaman } from '../types'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtTgl = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

type Step = 1 | 2 | 3 | 4
type StatusBayar = 'Dibayar' | 'Dibayar Sebagian' | 'Tidak Ada di Tempat'

interface NasabahAktif {
  nasabah: Nasabah
  pinjaman: Pinjaman
  cicilans: Cicilan[]
  cicilan_berikutnya: Cicilan | null
  hari_keterlambatan: number
}

export default function CatatCicilanPage() {
  const [step, setStep] = useState<Step>(1)
  const [listAktif, setListAktif] = useState<NasabahAktif[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<NasabahAktif | null>(null)
  const [statusBayar, setStatusBayar] = useState<StatusBayar | null>(null)
  const [jumlah, setJumlah] = useState('')
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasilKonfirmasi, setHasilKonfirmasi] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [dashboardData, setDashboardData] = useState<any>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = async () => {
    setLoading(true)
    try {
      // Ambil semua nasabah
      const resNasabah = await nasabahAPI.getAll({ limit: 100 })
      const nasabahs: Nasabah[] = resNasabah.data.data

      // Ambil data cicilan tiap nasabah
      const aktifList: NasabahAktif[] = []
      for (const n of nasabahs) {
        try {
          const resCicilan = await cicilanAPI.getByNasabah(n._id)
          const d = resCicilan.data.data
          if (d.pinjaman && d.pinjaman.status === 'Aktif') {
            const hariTerlambat = d.cicilan_berikutnya
              ? Math.max(0, Math.floor((Date.now() - new Date(d.cicilan_berikutnya.jatuh_tempo).getTime()) / (1000 * 60 * 60 * 24)))
              : 0
            aktifList.push({
              nasabah: n,
              pinjaman: d.pinjaman,
              cicilans: [],
              cicilan_berikutnya: d.cicilan_berikutnya,
              hari_keterlambatan: hariTerlambat,
            })
          }
        } catch { /* nasabah tanpa pinjaman aktif */ }
      }
      setListAktif(aktifList)

      // Dashboard stats
      const resDash = await laporanAPI.dashboard()
      setDashboardData(resDash.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = listAktif.filter(item =>
    !search ||
    item.nasabah.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    item.nasabah.no_hp.includes(search)
  )

 const pilihNasabah = (item: NasabahAktif) => {
  console.log('cicilan_berikutnya:', JSON.stringify(item.cicilan_berikutnya))
  setSelected(item)
  setStatusBayar(null)
  setJumlah('')
  setCatatan('')
  setStep(2)
}

  const handleSimpan = async () => {
    if (!selected || !statusBayar) return
    if (statusBayar !== 'Tidak Ada di Tempat' && (!jumlah || Number(jumlah) <= 0)) {
      showToast('❌ Jumlah wajib diisi')
      return
    }
    if (!selected.cicilan_berikutnya) {
      showToast('❌ Tidak ada cicilan yang perlu dibayar')
      return
    }

    setSaving(true)
    try {
      await cicilanAPI.bayar({
        cicilan_id: selected.cicilan_berikutnya._id,
        jumlah_bayar: statusBayar !== 'Tidak Ada di Tempat' ? Number(jumlah) : 0,
        status_pembayaran: statusBayar,
      })

      setHasilKonfirmasi({
        nama: selected.nasabah.nama_lengkap,
        no_hp: selected.nasabah.no_hp,
        status: statusBayar,
        jumlah: Number(jumlah),
        cicilan: selected.cicilan_berikutnya.jumlah_cicilan,
        catatan,
      })

      showToast(statusBayar === 'Tidak Ada di Tempat'
        ? '🚫 Kunjungan dicatat — nasabah tidak ada di tempat'
        : '✅ Pembayaran berhasil dicatat!')

      setStep(4)
      loadData()
    } catch (e: any) {
      showToast('❌ ' + (e?.response?.data?.meta?.message || 'Gagal menyimpan'))
    } finally {
      setSaving(false)
    }
  }

  const resetFlow = () => {
    setStep(1)
    setSelected(null)
    setStatusBayar(null)
    setJumlah('')
    setCatatan('')
    setHasilKonfirmasi(null)
  }

  const StepIndicator = () => (
    <div className="step-indicator" style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
      {[
        { n: 1, label: 'Pilih\nNasabah' },
        { n: 2, label: 'Detail\nTagihan' },
        { n: 3, label: 'Catat\nPembayaran' },
        { n: 4, label: 'Konfirmasi' },
      ].map(s => (
        <div key={s.n} className={`step-item${step > s.n ? ' done' : step === s.n ? ' active' : ''}`}>
          <div className="step-circle">{step > s.n ? '✓' : s.n}</div>
          <div className="step-label" style={{ whiteSpace: 'pre-line', textAlign: 'center', fontSize: 10 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )

  return (
    <Layout title="Catat Pembayaran Cicilan">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>💳 Catat Pembayaran Cicilan</h1>
          <p>Catat pembayaran cicilan nasabah · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {step > 1 && (
          <button className="btn btn-outline" onClick={resetFlow}>← Mulai Ulang</button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary)' }}>👥</div>
          <div className="stat-value">{listAktif.length}</div>
          <div className="stat-label">Nasabah Pinjaman Aktif</div>
          <div className="stat-sub">Bisa dicatat pembayarannya</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger)' }}>⏰</div>
          <div className="stat-value">{listAktif.filter(x => x.hari_keterlambatan > 0).length}</div>
          <div className="stat-label">Terlambat Bayar</div>
          <div className="stat-sub">Perlu perhatian khusus</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success)' }}>💰</div>
          <div className="stat-value" style={{ fontSize: 14 }}>{fmtRp(dashboardData?.penerimaan_hari_ini ?? 0)}</div>
          <div className="stat-label">Total Diterima Hari Ini</div>
          <div className="stat-sub">Kas masuk</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning)' }}>📋</div>
          <div className="stat-value">{dashboardData?.tagihan_hari_ini ?? 0}</div>
          <div className="stat-label">Tagihan Hari Ini</div>
          <div className="stat-sub">Jatuh tempo hari ini</div>
        </div>
      </div>

      {/* Flow Card */}
      <div className="card">
        <StepIndicator />

        {/* STEP 1 — Pilih Nasabah */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label>Cari Nasabah</label>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Ketik nama atau nomor HP..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Memuat data...</div></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">Tidak ada nasabah ditemukan</div>
                <div className="empty-desc">Pastikan nasabah sudah punya pinjaman aktif</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {filtered.map(item => (
                  <div
                    key={item.nasabah._id}
                    className="nasabah-card"
                    style={{
                      border: `2px solid ${item.hari_keterlambatan > 0 ? 'var(--danger)' : 'var(--gray-200)'}`,
                      borderRadius: 14, padding: 14, cursor: 'pointer',
                      background: item.hari_keterlambatan > 0 ? '#fff8f8' : '#fff',
                      transition: 'all .15s',
                    }}
                    onClick={() => pilihNasabah(item)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: item.hari_keterlambatan > 0 ? 'var(--danger)' : 'var(--primary)',
                        color: '#fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0,
                      }}>
                        {item.nasabah.nama_lengkap[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.nasabah.nama_lengkap}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          📱 {item.nasabah.no_hp} · {item.nasabah.pekerjaan || '-'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>
                          {fmtRp(item.cicilan_berikutnya?.jumlah_cicilan ?? 0)}/bln
                        </div>
                        {item.hari_keterlambatan > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                            ⚠️ {item.hari_keterlambatan} hari terlambat
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Detail Tagihan */}
        {step === 2 && selected && (
          <div>
            <div style={{ background: 'var(--primary-light)', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>📋 Detail Tagihan Nasabah</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, fontSize: 12 }}>
                {[
                  ['Nama Nasabah', selected.nasabah.nama_lengkap],
                  ['No. HP', `📱 ${selected.nasabah.no_hp}`],
                  ['Cicilan/Bulan', fmtRp(selected.cicilan_berikutnya?.jumlah_cicilan ?? 0)],
                  ['Sisa Pokok', fmtRp(selected.pinjaman.sisa_pokok)],
                  ['Hari Terlambat', selected.hari_keterlambatan > 0 ? `⚠️ ${selected.hari_keterlambatan} hari` : '✅ Tepat waktu'],
                  ['Alamat', selected.nasabah.alamat],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ color: 'var(--gray-400)', fontSize: 11 }}>{l}</div>
                    <div style={{ marginTop: 2, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected.cicilan_berikutnya && (
              <div style={{ background: 'var(--warning-light)', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 6 }}>📅 Cicilan Berikutnya</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtRp(selected.cicilan_berikutnya.jumlah_cicilan)}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                  Angsuran ke-{selected.cicilan_berikutnya.angsuran_ke} · Jatuh tempo: {fmtTgl(selected.cicilan_berikutnya.jatuh_tempo)}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Kembali</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Lanjut Catat →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Catat Pembayaran */}
        {step === 3 && selected && (
          <div>
            <div className="form-group">
              <label>Hasil Kunjungan <span className="req">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {([
                  { val: 'Dibayar', icon: '💰', label: 'Dibayar Lunas', sub: 'Terima cicilan penuh' },
                  { val: 'Dibayar Sebagian', icon: '💸', label: 'Bayar Sebagian', sub: 'Kurang dari cicilan' },
                  { val: 'Tidak Ada di Tempat', icon: '🚫', label: 'Tidak Ada', sub: 'Nasabah tidak di tempat' },
                ] as const).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => {
                      setStatusBayar(opt.val)
                      if (opt.val === 'Dibayar') {
                        setJumlah(String(selected.cicilan_berikutnya?.jumlah_cicilan ?? ''))
                      } else {
                        setJumlah('')
                      }
                    }}
                    style={{
                      padding: '16px 8px', border: `2px solid ${statusBayar === opt.val
                        ? opt.val === 'Dibayar' ? 'var(--success)'
                        : opt.val === 'Dibayar Sebagian' ? 'var(--warning)'
                        : 'var(--danger)'
                        : 'var(--gray-200)'}`,
                      borderRadius: 12, background: statusBayar === opt.val
                        ? opt.val === 'Dibayar' ? 'var(--success-light)'
                        : opt.val === 'Dibayar Sebagian' ? 'var(--warning-light)'
                        : 'var(--danger-light)'
                        : '#fff',
                      textAlign: 'center', cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{opt.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {statusBayar && statusBayar !== 'Tidak Ada di Tempat' && (
              <div className="form-group">
                <label>Jumlah Diterima (Rp) <span className="req">*</span></label>
                <input
  type="text"
  className="form-control"
  value={jumlah ? Number(jumlah.replace(/\./g, '')).toLocaleString('id-ID') : ''}
  onChange={e => {
    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
    setJumlah(raw)
  }}
  placeholder="Masukkan jumlah"
/>
                
                <div className="form-hint">
                  Cicilan bulan ini: <strong>{fmtRp(selected.cicilan_berikutnya?.jumlah_cicilan ?? 0)}</strong>
                </div>
              </div>
            )}

            {statusBayar === 'Tidak Ada di Tempat' && (
              <div className="alert alert-danger">
                <span className="alert-icon">🚫</span>
                Waktu kunjungan akan dicatat. Nasabah masuk antrian penagihan ulang hari berikutnya.
              </div>
            )}

            {statusBayar === 'Dibayar Sebagian' && (
              <div className="alert alert-warning">
                <span className="alert-icon">⚠️</span>
                Status "Dibayar Sebagian" — sisa yang masih terutang dihitung dan dicatat otomatis.
              </div>
            )}

            <div className="form-group">
              <label>Catatan Lapangan</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Catatan hasil kunjungan (opsional)"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Kembali</button>
              <button
                className="btn btn-success"
                onClick={handleSimpan}
                disabled={saving || !statusBayar}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Pembayaran'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Konfirmasi */}
        {step === 4 && hasilKonfirmasi && (
          <div>
            {hasilKonfirmasi.status !== 'Tidak Ada di Tempat' ? (
              <>
                <div className="alert alert-success" style={{ marginBottom: 14 }}>
                  <span className="alert-icon">✅</span>
                  <div><div style={{ fontWeight: 700 }}>Pembayaran Berhasil Dicatat!</div></div>
                </div>
                <div style={{ background: 'var(--success-light)', border: '1px solid #a7f3d0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                    {[
                      ['Nasabah', hasilKonfirmasi.nama],
                      ['No. HP', `📱 ${hasilKonfirmasi.no_hp}`],
                      ['Status', hasilKonfirmasi.status],
                      ['Jumlah Diterima', fmtRp(hasilKonfirmasi.jumlah)],
                      ['Cicilan Bulan Ini', fmtRp(hasilKonfirmasi.cicilan)],
                      ['Catatan', hasilKonfirmasi.catatan || '-'],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ color: 'var(--gray-400)' }}>{l}</div>
                        <div style={{ marginTop: 2, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-warning" style={{ marginBottom: 14 }}>
                <span className="alert-icon">🚫</span>
                <div>
                  <div style={{ fontWeight: 700 }}>Kunjungan Dicatat — Nasabah Tidak Ada di Tempat</div>
                  <div style={{ fontSize: 12 }}>Nasabah masuk antrian penagihan ulang hari berikutnya</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={resetFlow} style={{ flex: 1, justifyContent: 'center' }}>
                💳 Catat Pembayaran Lain
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </Layout>
  )
}
