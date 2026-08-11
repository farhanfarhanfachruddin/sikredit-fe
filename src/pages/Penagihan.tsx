import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { penagihanAPI } from '../api'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtTgl = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default function PenagihanPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [hasilForm, setHasilForm] = useState({ hasil: '', jumlah: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [waLink, setWaLink] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = () => {
    setLoading(true)
    penagihanAPI.harian()
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const openCatat = (item: any) => {
    setSelected(item)
    setHasilForm({ hasil: '', jumlah: '' })
    setWaLink('')
    setShowModal(true)
  }

  const handleGetWA = async () => {
    if (!selected) return
    try {
      const res = await penagihanAPI.waLink(selected.nasabah_id)
      setWaLink(res.data.data.wa_link)
    } catch { showToast('❌ Gagal membuat WA Link') }
  }

  const handleCatat = async () => {
    if (!selected || !hasilForm.hasil) return
    setSaving(true)
    try {
      await penagihanAPI.catat({
        nasabah_id: selected.nasabah_id,
        cicilan_id: selected.cicilan_id ?? '',
        hasil_kunjungan: hasilForm.hasil,
        jumlah_bayar: hasilForm.jumlah ? Number(hasilForm.jumlah) : undefined,
      })
      showToast('✅ Hasil penagihan berhasil dicatat')
      setShowModal(false)
      loadData()
    } catch { showToast('❌ Gagal mencatat hasil') }
    finally { setSaving(false) }
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const totalTagihan = data
    ? (data.prioritas_nunggak?.length ?? 0) + (data.jadwal_hari_ini?.length ?? 0)
    : 0

  return (
    <Layout title="Penagihan Harian">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>📋 Penagihan Harian</h1>
          <p>{today} · {totalTagihan} tagihan hari ini</p>
        </div>
        <button className="btn btn-outline" onClick={loadData}>🔄 Refresh</button>
      </div>

      {/* Ringkasan */}
      {data && (
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary)' }}>📋</div>
            <div className="stat-value">{data.ringkasan?.total_tagihan_hari_ini ?? 0}</div>
            <div className="stat-label">Total Tagihan Hari Ini</div>
            <div className="stat-sub">Harian + Bulanan</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success)' }}>✅</div>
            <div className="stat-value">{data.ringkasan?.jadwal_hari_ini ?? 0}</div>
            <div className="stat-label">Jadwal Normal</div>
            <div className="stat-sub">Tepat waktu</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger)' }}>⚠️</div>
            <div className="stat-value">{data.ringkasan?.nunggak ?? 0}</div>
            <div className="stat-label">Nunggak</div>
            <div className="stat-sub">Perlu prioritas</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-title">Memuat data penagihan...</div>
          </div>
        </div>
      ) : !data || totalTagihan === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">Tidak ada penagihan hari ini</div>
            <div className="empty-desc">Semua cicilan sudah lunas atau belum jatuh tempo</div>
          </div>
        </div>
      ) : (
        <>
          {/* PRIORITAS NUNGGAK — TOPSIS */}
          {data.prioritas_nunggak?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                padding: '10px 14px', background: '#fff1f1', borderRadius: 10,
                border: '1px solid #fecaca'
              }}>
                <span style={{ fontSize: 18 }}>🔴</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 14 }}>
                    Prioritas Penagihan — {data.prioritas_nunggak.length} Nasabah Nunggak
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    Diurutkan berdasarkan metode TOPSIS · Tagih lebih dulu!
                  </div>
                </div>
              </div>

              {data.prioritas_nunggak.map((item: any) => (
                <NasabahCard key={item.nasabah_id} item={item} isNunggak onCatat={openCatat} onWA={async () => {
                  try {
                    const res = await penagihanAPI.waLink(item.nasabah_id)
                    window.open(res.data.data.wa_link, '_blank')
                  } catch { showToast('❌ Gagal membuat WA Link') }
                }} />
              ))}
            </div>
          )}

          {/* JADWAL HARI INI — Normal */}
          {data.jadwal_hari_ini?.length > 0 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                padding: '10px 14px', background: '#f0fdf4', borderRadius: 10,
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>
                    Jadwal Hari Ini — {data.jadwal_hari_ini.length} Tagihan
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    Cicilan yang jatuh tempo hari ini
                  </div>
                </div>
              </div>

              {data.jadwal_hari_ini.map((item: any) => (
                <NasabahCard key={item.nasabah_id} item={item} isNunggak={false} onCatat={openCatat} onWA={async () => {
                  try {
                    const res = await penagihanAPI.waLink(item.nasabah_id)
                    window.open(res.data.data.wa_link, '_blank')
                  } catch { showToast('❌ Gagal membuat WA Link') }
                }} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Catat Hasil */}
      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>📝 Catat Hasil Kunjungan</h3>
                <p>{selected.nama} · {selected.jenis_cicilan === 'harian' ? '📅 Harian' : '📆 Bulanan'}</p>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hasil Kunjungan <span className="req">*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Dibayar', 'Dibayar Sebagian', 'Tidak Ada di Tempat'].map(h => (
                    <button key={h}
                      className={`btn ${hasilForm.hasil === h ? 'btn-primary' : 'btn-outline'}`}
                      style={{ justifyContent: 'flex-start' }}
                      onClick={() => setHasilForm(p => ({ ...p, hasil: h }))}>
                      {h === 'Dibayar' ? '✅' : h === 'Dibayar Sebagian' ? '⚠️' : '🔴'} {h}
                    </button>
                  ))}
                </div>
              </div>

              {(hasilForm.hasil === 'Dibayar' || hasilForm.hasil === 'Dibayar Sebagian') && (
                <div className="form-group">
                  <label>Jumlah Diterima (Rp)</label>
                  <input type="number" className="form-control"
                    placeholder={`Cicilan: ${fmtRp(selected.jumlah_cicilan)}`}
                    value={hasilForm.jumlah}
                    onChange={e => setHasilForm(p => ({ ...p, jumlah: e.target.value }))} />
                </div>
              )}

              <div className="divider" />
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>Kirim pengingat via WhatsApp:</div>
              {waLink ? (
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="btn btn-sm" style={{ background: '#25D366', color: '#fff' }}>
                  💬 Buka WhatsApp & Kirim Pesan
                </a>
              ) : (
                <button className="btn btn-sm btn-outline" onClick={handleGetWA}>🔗 Generate WA Link</button>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCatat}
                disabled={saving || !hasilForm.hasil}>
                {saving ? '⏳...' : '💾 Simpan Hasil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast success">{toast}</div>}
    </Layout>
  )
}

// Komponen Card Nasabah
function NasabahCard({ item, isNunggak, onCatat, onWA }: {
  item: any
  isNunggak: boolean
  onCatat: (item: any) => void
  onWA: () => void
}) {
  const fmtRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <div style={{
      border: `2px solid ${isNunggak ? 'var(--danger)' : 'var(--gray-200)'}`,
      borderRadius: 14, padding: 14, marginBottom: 8,
      background: isNunggak ? '#fff8f8' : '#fff',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Rank badge kalau nunggak */}
        {isNunggak && item.urutan_prioritas && (
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: item.urutan_prioritas === 1 ? '#ef4444' : item.urutan_prioritas === 2 ? '#f97316' : '#eab308',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
          }}>
            #{item.urutan_prioritas}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.nama}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                📱 {item.no_hp} · 📍 {item.alamat}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>
                {fmtRp(item.jumlah_cicilan)}
              </div>
              {isNunggak && item.skor_topsis && (
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                  TOPSIS: {item.skor_topsis.toFixed(3)}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${item.jenis_cicilan === 'harian' ? 'badge-blue' : 'badge-purple'}`}>
              {item.jenis_cicilan === 'harian' ? '📅 Harian' : `📆 Bulanan (tgl ${item.tanggal_tagih})`}
            </span>
            {isNunggak && (
              <>
                <span className="badge badge-red">⚠️ {item.hari_keterlambatan} hari terlambat</span>
                {item.total_nunggak > 1 && (
                  <span className="badge badge-red">{item.total_nunggak} cicilan nunggak</span>
                )}
              </>
            )}
            <span className="badge badge-gray">💰 Sisa {fmtRp(item.sisa_pokok)}</span>
          </div>

          {/* Tombol Aksi */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-primary" onClick={() => onCatat(item)}>
              📝 Catat Hasil
            </button>
            <button className="btn btn-sm" style={{ background: '#25D366', color: '#fff' }} onClick={onWA}>
              💬 Kirim WA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}