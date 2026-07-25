export interface User {
  id: string
  username: string
  nama: string
  role: 'pemilik' | 'operator'
}

export interface Nasabah {
  _id: string
  nik: string
  nama_lengkap: string
  tanggal_lahir: string
  no_kk: string
  foto_ktp?: string
  no_hp: string
  alamat: string
  pekerjaan?: string
  penghasilan: number
  createdAt: string
}

export interface Jaminan {
  _id: string
  nasabah_id: string
  jenis_jaminan: string
  nilai_jaminan?: number
  dokumen_jaminan?: string
}

export interface Pengajuan {
  _id: string
  nasabah_id: Nasabah | string
  user_id: User | string
  tanggal_pengajuan: string
  jumlah_pengajuan: number
  tenor: number
  skor_saw?: number
  status_kelayakan?: 'Layak' | 'Pertimbangkan' | 'Tidak Layak'
  keputusan: 'Disetujui' | 'Ditolak' | 'Menunggu'
  alasan_penolakan?: string
  createdAt: string
}

export interface Pinjaman {
  _id: string
  pengajuan_id: string
  nasabah_id: Nasabah | string
  tanggal_pinjaman: string
  jumlah_pinjaman: number
  tenor: number
  sisa_pokok: number
  status: 'Aktif' | 'Lunas' | 'Macet'
}

export interface Cicilan {
  _id: string
  pinjaman_id: string
  angsuran_ke: number
  jatuh_tempo: string
  jumlah_cicilan: number
  status_cicilan: 'Belum Bayar' | 'Dibayar Sebagian' | 'Lunas'
}

export interface Pembayaran {
  _id: string
  cicilan_id: string
  user_id: string
  tanggal_bayar: string
  jumlah_bayar: number
  status_pembayaran: 'Dibayar' | 'Dibayar Sebagian' | 'Tidak Ada di Tempat'
}

export interface PrioritasPenagihan {
  nasabah_id: string
  nama: string
  no_hp: string
  alamat: string
  jumlah_cicilan: number
  hari_keterlambatan: number
  sisa_pokok: number
  riwayat_keterlambatan: number
  skor_topsis: number
  urutan_prioritas: number
}

export interface DashboardData {
  total_nasabah: number
  pinjaman_aktif: number
  tagihan_hari_ini: number
  tagihan_menunggak: number
  penerimaan_hari_ini: number
}

export interface ApiResponse<T> {
  meta: { status: number; message: string }
  data: T
  pagination?: {
    total: number
    page: number
    limit: number
    totalPage: number
  }
}
