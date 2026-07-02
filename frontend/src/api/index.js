import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

// Interceptors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Cong trinh
export const getCongTrinh = () => api.get('/cong-trinh')
export const createCongTrinh = (data) => api.post('/cong-trinh', data)
export const updateCongTrinh = (id, data) => api.put(`/cong-trinh/${id}`, data)
export const deleteCongTrinh = (id) => api.delete(`/cong-trinh/${id}`)

// Phieu
export const getPhieuList = (params) => api.get('/phieu', { params })
export const getChiTietPhieu = (id) => api.get(`/phieu/${id}/chi-tiet`)
export const createPhieu = (data) => api.post('/phieu', data)
export const deletePhieu = (id) => api.delete(`/phieu/${id}`)

// Hang hoa
export const getHangHoa = (params) => api.get('/hang-hoa', { params })
export const createHangHoa = (data) => api.post('/hang-hoa', data)
export const updateHangHoa = (ma, data) => api.put(`/hang-hoa/${ma}`, data)
export const deleteHangHoa = (ma) => api.delete(`/hang-hoa/${ma}`)

// Ton kho
export const getTonKho = (params) => api.get('/ton-kho', { params })

// Bao cao
export const getBaoCaoTongHop = (params) => api.get('/bao-cao/tong-hop', { params })
export const getBieuDo = (params) => api.get('/bao-cao/bieu-do', { params })

// AI
export const docPhieu = (formData) => api.post('/ai/doc-phieu', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000
})
export const docPhieuMulti = (formData) => api.post('/ai/doc-phieu-multi', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000
})
export const splitPdf = (formData) => api.post('/files/split-pdf', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  responseType: 'blob',
  timeout: 60000
})
