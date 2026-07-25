import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { nasabahAPI, jaminanAPI } from '../api'
import { Nasabah } from '../types'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const initForm = {
  nik: '', nama_lengkap: '', tanggal_lahir: '', no_kk: '',
  no_hp: '', alamat: '', pekerjaan: '', penghasilan: '',
  jaminan_jenis: '', jaminan_nilai: '',
}

export default function NasabahPage() {
  const [list, setList] = useState<Nasabah[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadData = () => {
    setLoading(true)
    nasabahAPI.getAll({ search, page, limit: 10 })
      .then(res => {
        setList(res.data.data)
        setTotalPage(res.data.pagination?.totalPage ?? 1)
        setTotal(res.data.pagination?.total ?? 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [search, page])

  const openAdd = () => {
    setEditId(null)
    setForm(initForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = async (n: Nasabah) => {
    setEditId(n._id)
    setForm({
      nik: n.nik, nama_lengkap: n.nama_lengkap,
      tanggal_lahir: n.tanggal_lahir?.split('T')[0] ?? '',
      no_kk: n.no_kk, no_hp: n.no_hp, alamat: n.alamat,
      pekerjaan: n.pekerjaan ?? '', penghasilan: String(n.penghasilan),
      jaminan_jenis: '', jaminan_nilai: '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nik || !form.nama_lengkap || !form.no_hp || !form.penghasilan) {
      setError('NIK, nama, no HP, dan penghasilan wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: any = {
        ...form,
        penghasilan: Number(form.penghasilan),
        tanggal_lahir: form.tanggal_lahir || new Date().toISOString().split('T')[0],
      }
      if (form.jaminan_jenis) {
        payload.jaminan = {
          jenis_jaminan: form.jaminan_jenis,
          nilai_jaminan: form.jaminan_nilai ? Number(form.jaminan_nilai) : null,
        }
      }
      delete payload.jaminan_jenis
      delete payload.jaminan_nilai

      if (editId) {
        await nasabahAPI.update(editId, payload)
        showToast('✅ Data nasabah berhasil diperbarui')
      } else {
        await nasabahAPI.create(payload)
        showToast('✅ Nasabah berhasil didaftarkan')
      }
      setShowModal(false)
      loadData()
    } catch (e: any) {
      setError(e?.response?.data?.meta?.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Layout title="Data Nasabah">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Data Nasabah</h1>
          <p>Kelola seluruh data nasabah koperasi · {total} nasabah terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Tambah Nasabah</button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Cari nama, NIK, atau no HP..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Lengkap</th>
                <th>NIK</th>
                <th>No HP</th>
                <th>Pekerjaan</th>
                <th>Penghasilan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: 32 }}>⏳ Memuat data...</td></tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">👥</div>
                      <div className="empty-title">Belum ada nasabah</div>
                      <div className="empty-desc">Klik "Tambah Nasabah" untuk mendaftarkan nasabah baru</div>
                    </div>
                  </td>
                </tr>
              ) : list.map((n, i) => (
                <tr key={n._id}>
                  <td>{(page - 1) * 10 + i + 1}</td>
                  <td><strong>{n.nama_lengkap}</strong></td>
                  <td className="text-mono">{n.nik}</td>
                  <td>{n.no_hp}</td>
                  <td>{n.pekerjaan || '-'}</td>
                  <td>{fmtRp(n.penghasilan)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(n)}>✏️ Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="table-footer">
            <span>Total {total} nasabah</span>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPage }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPage, p + 1))} disabled={page === totalPage}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editId ? '✏️ Edit Data Nasabah' : '➕ Tambah Nasabah Baru'}</h3>
                <p>Lengkapi seluruh data identitas nasabah</p>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger"><span className="alert-icon">⚠️</span>{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>NIK <span className="req">*</span></label>
                  <input className="form-control" placeholder="16 digit NIK" maxLength={16} value={form.nik} onChange={f('nik')} />
                </div>
                <div className="form-group">
                  <label>No KK <span className="req">*</span></label>
                  <input className="form-control" placeholder="16 digit No KK" maxLength={16} value={form.no_kk} onChange={f('no_kk')} />
                </div>
              </div>
              <div className="form-group">
                <label>Nama Lengkap <span className="req">*</span></label>
                <input className="form-control" placeholder="Sesuai KTP" value={form.nama_lengkap} onChange={f('nama_lengkap')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" className="form-control" value={form.tanggal_lahir} onChange={f('tanggal_lahir')} />
                </div>
                <div className="form-group">
                  <label>No HP <span className="req">*</span></label>
                  <input className="form-control" placeholder="08xxxxxxxxxx" value={form.no_hp} onChange={f('no_hp')} />
                </div>
              </div>
              <div className="form-group">
                <label>Alamat Lengkap <span className="req">*</span></label>
                <textarea className="form-control" placeholder="Alamat sesuai KTP" value={form.alamat} onChange={f('alamat')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pekerjaan</label>
                  <input className="form-control" placeholder="Pekerjaan nasabah" value={form.pekerjaan} onChange={f('pekerjaan')} />
                </div>
                <div className="form-group">
                  <label>Penghasilan Bulanan (Rp) <span className="req">*</span></label>
                  <input type="number" className="form-control" placeholder="Contoh: 2500000" value={form.penghasilan} onChange={f('penghasilan')} />
                </div>
              </div>

              {!editId && (
                <>
                  <div className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 12 }}>
                    🏠 Data Jaminan (opsional)
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Jenis Jaminan</label>
                      <input className="form-control" placeholder="Contoh: BPKB, Sertifikat" value={form.jaminan_jenis} onChange={f('jaminan_jenis')} />
                    </div>
                    <div className="form-group">
                      <label>Nilai Jaminan (Rp)</label>
                      <input type="number" className="form-control" placeholder="Estimasi nilai" value={form.jaminan_nilai} onChange={f('jaminan_nilai')} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast success">{toast}</div>}
    </Layout>
  )
}
