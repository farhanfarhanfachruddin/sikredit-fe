import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { pengajuanAPI, nasabahAPI } from '../api'
import { Pengajuan, Nasabah } from '../types'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const statusBadge = (s: string) => {
  if (s === 'Disetujui') return <span className="badge badge-green">✅ Disetujui</span>
  if (s === 'Ditolak') return <span className="badge badge-red">❌ Ditolak</span>
  return <span className="badge badge-yellow">⏳ Menunggu</span>
}

const kelayakanBadge = (s?: string) => {
  if (s === 'Layak') return <span className="badge badge-green">✅ Layak</span>
  if (s === 'Pertimbangkan') return <span className="badge badge-yellow">⚠️ Pertimbangkan</span>
  if (s === 'Tidak Layak') return <span className="badge badge-red">❌ Tidak Layak</span>
  return <span className="badge badge-gray">-</span>
}

export default function PengajuanPage() {
  const [list, setList] = useState<Pengajuan[]>([])
  const [loading, setLoading] = useState(true)
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showHasilModal, setShowHasilModal] = useState(false)
  const [showKeputusanModal, setShowKeputusanModal] = useState(false)
  const [selectedPengajuan, setSelectedPengajuan] = useState<any>(null)
  const [hasilSAW, setHasilSAW] = useState<any>(null)
  const [form, setForm] = useState({ nasabah_id: '', jumlah_pengajuan: '', tenor: '' })
  const [keputusanForm, setKeputusanForm] = useState({ keputusan: '', alasan: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = () => {
    setLoading(true)
    pengajuanAPI.getAll()
      .then(res => setList(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    nasabahAPI.getAll({ limit: 100 }).then(res => setNasabahList(res.data.data))
  }, [])

  const handleProses = async () => {
    if (!form.nasabah_id || !form.jumlah_pengajuan || !form.tenor) {
      setError('Semua field wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await pengajuanAPI.create({
        nasabah_id: form.nasabah_id,
        jumlah_pengajuan: Number(form.jumlah_pengajuan),
        tenor: Number(form.tenor),
      })
      setHasilSAW(res.data.data)
      setShowModal(false)
      setShowHasilModal(true)
      loadData()
    } catch (e: any) {
      setError(e?.response?.data?.meta?.message || 'Gagal memproses pengajuan')
    } finally {
      setSaving(false)
    }
  }

  const handleKeputusan = async () => {
    if (!keputusanForm.keputusan) { setError('Pilih keputusan'); return }
    setSaving(true)
    try {
      await pengajuanAPI.keputusan(selectedPengajuan._id, {
        keputusan: keputusanForm.keputusan,
        alasan_penolakan: keputusanForm.alasan,
      })
      showToast(keputusanForm.keputusan === 'Disetujui'
        ? '✅ Pinjaman disetujui! Jadwal cicilan otomatis dibuat.'
        : '❌ Pengajuan ditolak.')
      setShowKeputusanModal(false)
      loadData()
    } catch (e: any) {
      setError(e?.response?.data?.meta?.message || 'Gagal')
    } finally {
      setSaving(false)
    }
  }

  const sawColor = (s: number) => s >= 0.7 ? 'var(--success)' : s >= 0.5 ? 'var(--warning)' : 'var(--danger)'

  return (
    <Layout title="Pengajuan Pinjaman">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Pengajuan Pinjaman</h1>
          <p>Proses pengajuan dengan rekomendasi kelayakan metode SAW</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ nasabah_id: '', jumlah_pengajuan: '', tenor: '' }); setError(''); setShowModal(true) }}>
          ➕ Pengajuan Baru
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nasabah</th>
                <th>Jumlah</th>
                <th>Tenor</th>
                <th>Skor SAW</th>
                <th>Kelayakan</th>
                <th>Keputusan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: 32 }}>⏳ Memuat...</td></tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <div className="empty-title">Belum ada pengajuan</div>
                      <div className="empty-desc">Klik "Pengajuan Baru" untuk memproses pengajuan pinjaman</div>
                    </div>
                  </td>
                </tr>
              ) : list.map(p => {
                const nasabah = p.nasabah_id as Nasabah
                return (
                  <tr key={p._id}>
                    <td><strong>{nasabah?.nama_lengkap ?? '-'}</strong><br /><span className="text-xs text-muted">{nasabah?.no_hp}</span></td>
                    <td>{fmtRp(p.jumlah_pengajuan)}</td>
                    <td>{p.tenor} bulan</td>
                    <td>
                      {p.skor_saw != null
                        ? <span style={{ fontWeight: 700, color: sawColor(p.skor_saw) }}>{p.skor_saw.toFixed(2)}</span>
                        : '-'}
                    </td>
                    <td>{kelayakanBadge(p.status_kelayakan)}</td>
                    <td>{statusBadge(p.keputusan)}</td>
                    <td>
                      {p.keputusan === 'Menunggu' && (
                        <button className="btn btn-sm btn-primary" onClick={() => {
                          setSelectedPengajuan(p)
                          setKeputusanForm({ keputusan: '', alasan: '' })
                          setError('')
                          setShowKeputusanModal(true)
                        }}>
                          ⚖️ Putuskan
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengajuan Baru */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3>📋 Pengajuan Pinjaman Baru</h3><p>Sistem akan menghitung skor SAW otomatis</p></div>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger"><span className="alert-icon">⚠️</span>{error}</div>}
              <div className="form-group">
                <label>Nasabah <span className="req">*</span></label>
                <select className="form-control" value={form.nasabah_id} onChange={e => setForm(p => ({ ...p, nasabah_id: e.target.value }))}>
                  <option value="">-- Pilih Nasabah --</option>
                  {nasabahList.map(n => <option key={n._id} value={n._id}>{n.nama_lengkap} — {n.no_hp}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Jumlah Pinjaman (Rp) <span className="req">*</span></label>
                  <input type="number" className="form-control" placeholder="Contoh: 5000000" value={form.jumlah_pengajuan} onChange={e => setForm(p => ({ ...p, jumlah_pengajuan: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Tenor (Bulan) <span className="req">*</span></label>
                  <input type="number" className="form-control" placeholder="Contoh: 12" min={1} max={60} value={form.tenor} onChange={e => setForm(p => ({ ...p, tenor: e.target.value }))} />
                </div>
              </div>
              <div className="alert alert-info">
                <span className="alert-icon">💡</span>
                Skor SAW dihitung otomatis berdasarkan data nasabah yang sudah terdaftar.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleProses} disabled={saving}>
                {saving ? '⏳ Menghitung SAW...' : '📊 Proses & Hitung SAW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hasil SAW */}
      {showHasilModal && hasilSAW && (
        <div className="modal-overlay" onClick={() => setShowHasilModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3>📊 Hasil Rekomendasi SAW</h3><p>Keputusan akhir tetap di tangan pemilik</p></div>
              <button className="btn-close" onClick={() => setShowHasilModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className={`saw-panel ${hasilSAW.rekomendasi.status === 'Layak' ? 'saw-layak' : hasilSAW.rekomendasi.status === 'Pertimbangkan' ? 'saw-pertimbangkan' : 'saw-tidak-layak'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Skor SAW</div>
                    <div className="saw-score">{hasilSAW.rekomendasi.skor.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, marginBottom: 4 }}>Rekomendasi</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{hasilSAW.rekomendasi.status}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Batas: {fmtRp(hasilSAW.rekomendasi.batas_pinjaman)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Detail Kriteria SAW:</div>
              <table className="saw-table">
                <thead>
                  <tr><th>Kriteria</th><th>Bobot</th><th>Nilai</th><th>Kontribusi</th></tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Penghasilan Bulanan', bobot: '30%', nilai: hasilSAW.rekomendasi.detail_kriteria.c1_penghasilan },
                    { label: 'Kelengkapan Data', bobot: '25%', nilai: hasilSAW.rekomendasi.detail_kriteria.c2_kelengkapan },
                    { label: 'Kepemilikan Jaminan', bobot: '25%', nilai: hasilSAW.rekomendasi.detail_kriteria.c3_jaminan },
                    { label: 'Riwayat Pembayaran', bobot: '20%', nilai: hasilSAW.rekomendasi.detail_kriteria.c4_riwayat },
                  ].map(k => (
                    <tr key={k.label}>
                      <td>{k.label}</td>
                      <td>{k.bobot}</td>
                      <td>{k.nilai.toFixed(2)}</td>
                      <td>
                        <div className="progress-bar">
                          <div className="progress-fill progress-blue" style={{ width: `${k.nilai * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="alert alert-info" style={{ marginTop: 14 }}>
                <span className="alert-icon">💡</span>
                Buka daftar pengajuan dan klik "Putuskan" untuk menyetujui atau menolak.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowHasilModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Keputusan */}
      {showKeputusanModal && selectedPengajuan && (
        <div className="modal-overlay" onClick={() => setShowKeputusanModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3>⚖️ Keputusan Pinjaman</h3><p>Skor SAW: {selectedPengajuan.skor_saw?.toFixed(2)} — {selectedPengajuan.status_kelayakan}</p></div>
              <button className="btn-close" onClick={() => setShowKeputusanModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger"><span className="alert-icon">⚠️</span>{error}</div>}
              <div className="form-group">
                <label>Keputusan <span className="req">*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`btn ${keputusanForm.keputusan === 'Disetujui' ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => setKeputusanForm(p => ({ ...p, keputusan: 'Disetujui' }))}
                  >✅ Setujui</button>
                  <button
                    className={`btn ${keputusanForm.keputusan === 'Ditolak' ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => setKeputusanForm(p => ({ ...p, keputusan: 'Ditolak' }))}
                  >❌ Tolak</button>
                </div>
              </div>
              {keputusanForm.keputusan === 'Ditolak' && (
                <div className="form-group">
                  <label>Alasan Penolakan</label>
                  <textarea className="form-control" placeholder="Tulis alasan penolakan..." value={keputusanForm.alasan} onChange={e => setKeputusanForm(p => ({ ...p, alasan: e.target.value }))} />
                </div>
              )}
              {keputusanForm.keputusan === 'Disetujui' && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  Jadwal cicilan {selectedPengajuan.tenor} bulan akan dibuat otomatis.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowKeputusanModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleKeputusan} disabled={saving || !keputusanForm.keputusan}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Keputusan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast success">{toast}</div>}
    </Layout>
  )
}
