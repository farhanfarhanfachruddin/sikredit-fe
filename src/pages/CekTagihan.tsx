import { useState } from 'react'
import { cicilanAPI } from '../api'

const fmtRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtTgl = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default function CekTagihanPage() {
  const [noHp, setNoHp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(null)

  const handleCek = async () => {
    if (!noHp) { setError('Nomor HP wajib diisi'); return }
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await cicilanAPI.cekTagihan(noHp)
      setData(res.data.data)
    } catch (e: any) {
      setError(e?.response?.data?.meta?.message || 'Nomor HP tidak ditemukan. Hubungi pemilik koperasi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0f2044,#1d4ed8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💳</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>SiKredit-KSP</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Cek Tagihan Nasabah</div>
        </div>
      </div>

      {/* Form Cek */}
      <div className="cek-tagihan-card" style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Cek Tagihan Saya</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          Masukkan nomor HP yang terdaftar di koperasi untuk melihat informasi tagihan Anda.
        </p>

        {error && <div className="alert alert-danger"><span className="alert-icon">⚠️</span>{error}</div>}

        <div className="form-group">
          <label>Nomor HP Terdaftar</label>
          <input
            type="tel"
            className="form-control"
            placeholder="Contoh: 081234567890"
            value={noHp}
            onChange={e => setNoHp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCek()}
          />
          <div className="form-hint">Nomor HP yang didaftarkan saat pertama kali meminjam</div>
        </div>

        <button className="btn btn-primary" onClick={handleCek} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? '⏳ Mencari...' : '🔍 Cek Tagihan'}
        </button>

        {/* Hasil */}
        {data && (
          <div style={{ marginTop: 24 }}>
            <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>Nasabah</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{data.nasabah?.nama_lengkap}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>📱 {data.nasabah?.no_hp}</div>
            </div>

            {!data.pinjaman ? (
              <div className="alert alert-info"><span className="alert-icon">ℹ️</span>Tidak ada pinjaman aktif saat ini.</div>
            ) : (
              <>
                {/* Info Pinjaman */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Total Pinjaman', val: fmtRp(data.pinjaman.jumlah_pinjaman) },
                    { label: 'Sisa Pokok', val: fmtRp(data.pinjaman.sisa_pokok) },
                    { label: 'Tenor', val: `${data.pinjaman.tenor} bulan` },
                    { label: 'Status', val: data.pinjaman.status },
                  ].map(i => (
                    <div key={i.label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 2 }}>{i.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{i.val}</div>
                    </div>
                  ))}
                </div>

                {/* Cicilan Berikutnya */}
                {data.cicilan_berikutnya && (
                  <div style={{ background: 'var(--warning-light)', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 8 }}>📅 Cicilan Berikutnya</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                      {fmtRp(data.cicilan_berikutnya.jumlah_cicilan)}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      Angsuran ke-{data.cicilan_berikutnya.angsuran_ke} · Jatuh tempo: {fmtTgl(data.cicilan_berikutnya.jatuh_tempo)}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge ${data.cicilan_berikutnya.status === 'Lunas' ? 'badge-green' : data.cicilan_berikutnya.status === 'Dibayar Sebagian' ? 'badge-yellow' : 'badge-red'}`}>
                        {data.cicilan_berikutnya.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Riwayat */}
                {data.riwayat_pembayaran?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>📋 Riwayat Pembayaran</div>
                    {data.riwayat_pembayaran.slice(0, 5).map((r: any) => (
                      <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{fmtRp(r.jumlah_bayar)}</div>
                          <div style={{ color: 'var(--gray-400)' }}>{fmtTgl(r.tanggal_bayar)}</div>
                        </div>
                        <span className={`badge ${r.status_pembayaran === 'Dibayar' ? 'badge-green' : r.status_pembayaran === 'Dibayar Sebagian' ? 'badge-yellow' : 'badge-red'}`}>
                          {r.status_pembayaran}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Reset */}
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
              onClick={() => { setData(null); setNoHp('') }}>
              🔄 Cek Nomor Lain
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 20, textAlign: 'center' }}>
        Halaman ini hanya untuk melihat informasi tagihan · Read-only<br />
        SiKredit-KSP · Koperasi Simpan Pinjam
      </div>
    </div>
  )
}
