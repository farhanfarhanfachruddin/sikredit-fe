import api from './axios'

// ── AUTH ──
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  register: (data: object) => api.post('/auth/register', data),
}

// ── NASABAH ──
export const nasabahAPI = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/nasabah', { params }),
  getById: (id: string) => api.get(`/nasabah/${id}`),
  create: (data: object) => api.post('/nasabah', data),
  update: (id: string, data: object) => api.put(`/nasabah/${id}`, data),
  findByNoHp: (noHp: string) => api.get(`/nasabah/cek-hp/${noHp}`),
}

// ── JAMINAN ──
export const jaminanAPI = {
  getByNasabah: (nasabahId: string) => api.get(`/jaminan/nasabah/${nasabahId}`),
  create: (data: object) => api.post('/jaminan', data),
  update: (id: string, data: object) => api.put(`/jaminan/${id}`, data),
  delete: (id: string) => api.delete(`/jaminan/${id}`),
}

// ── PENGAJUAN ──
export const pengajuanAPI = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/pengajuan', { params }),
  getById: (id: string) => api.get(`/pengajuan/${id}`),
  create: (data: object) => api.post('/pengajuan', data),
  keputusan: (id: string, data: { keputusan: string; alasan_penolakan?: string }) =>
    api.put(`/pengajuan/${id}/keputusan`, data),
}

// ── CICILAN ──
export const cicilanAPI = {
  getByPinjaman: (pinjamanId: string) => api.get(`/cicilan/pinjaman/${pinjamanId}`),
  getByNasabah: (nasabahId: string) => api.get(`/cicilan/nasabah/${nasabahId}`),
  bayar: (data: object) => api.post('/cicilan/bayar', data),
  cekTagihan: (no_hp: string) => api.post('/cicilan/cek-tagihan', { no_hp }),
}

// ── PENAGIHAN ──
export const penagihanAPI = {
  harian: () => api.get('/penagihan/harian'),
  catat: (data: object) => api.post('/penagihan/catat', data),
  waLink: (nasabahId: string) => api.get(`/penagihan/wa-link/${nasabahId}`),
}

// ── LAPORAN ──
export const laporanAPI = {
  dashboard: () => api.get('/laporan/dashboard'),
  pinjaman: (periode?: string) => api.get('/laporan/pinjaman', { params: { periode } }),
  cicilan: (periode?: string) => api.get('/laporan/cicilan', { params: { periode } }),
  penagihan: (periode?: string) => api.get('/laporan/penagihan', { params: { periode } }),
}
