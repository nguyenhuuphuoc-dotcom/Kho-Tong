import React, { useState, useEffect } from 'react'
import { Package, Search, RefreshCw, AlertCircle, CheckCircle, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { getTonKho, getHangHoa, themHangTonKho, dieuChinhTonKho, xoaHangTonKho } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
// CRUD ton kho: them hang (phieu TD), dieu chinh (phieu DC), xoa hang

export default function TonKho() {
  const { selectedCT, ctLoading, congTrinhs } = useCongTrinh()
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCanhBao, setShowCanhBao] = useState(false)

  // Modal state
  const [modal, setModal] = useState(null)   // { type: 'them' | 'sua' | 'xoa', row? }
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [form, setForm] = useState({})
  const [hangHoaList, setHangHoaList] = useState([])

  const loadData = () => {
    if (ctLoading) return
    setLoading(true)
    const params = selectedCT ? { cong_trinh_id: selectedCT.id } : {}
    getTonKho(params)
      .then(res => setData(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [selectedCT, ctLoading])

  useEffect(() => {
    if (ctLoading) return
    getHangHoa({ limit: 2000 })
      .then(res => setHangHoaList(res.data?.data || []))
      .catch(() => {})
  }, [ctLoading])

  const filtered = data.filter(r => {
    const matchSearch = !search ||
      (r.ten_hang || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.nhom || '').toLowerCase().includes(search.toLowerCase())
    const matchCB = !showCanhBao || (r.ton_cuoi ?? 0) <= 0
    return matchSearch && matchCB
  })

  const canhBaoCount = data.filter(r => (r.ton_cuoi ?? 0) <= 0).length
  const conHangCount = data.filter(r => (r.ton_cuoi ?? 0) > 0).length

  const ctIdOfRow = (row) => row?.cong_trinh_id || selectedCT?.id

  // ── Modal handlers ─────────────────────────────────────────
  const openThem = () => {
    if (!selectedCT) { alert('Chọn 1 công trình ở sidebar trước khi thêm hàng'); return }
    setForm({ ten_hang: '', dvt: 'cái', so_luong: '', don_gia: '', ghi_chu: '' })
    setModalError('')
    setModal({ type: 'them' })
  }
  const openSua = (row) => {
    setForm({ ton_moi: row.ton_cuoi ?? 0, ghi_chu: '' })
    setModalError('')
    setModal({ type: 'sua', row })
  }
  const openXoa = (row) => {
    setModalError('')
    setModal({ type: 'xoa', row })
  }
  const closeModal = () => { if (!saving) setModal(null) }

  const handleSave = async () => {
    setSaving(true)
    setModalError('')
    try {
      if (modal.type === 'them') {
        if (!form.ten_hang.trim()) throw new Error('Nhập tên hàng')
        const sl = parseFloat(form.so_luong)
        if (!sl || sl <= 0) throw new Error('Số lượng phải lớn hơn 0')
        await themHangTonKho({
          cong_trinh_id: selectedCT.id,
          ten_hang: form.ten_hang.trim(),
          dvt: form.dvt || 'cái',
          so_luong: sl,
          don_gia: parseFloat(form.don_gia) || 0,
          ghi_chu: form.ghi_chu || '',
          user_email: user?.email || '',
        })
      } else if (modal.type === 'sua') {
        const tonMoi = parseFloat(form.ton_moi)
        if (isNaN(tonMoi) || tonMoi < 0) throw new Error('Tồn mới không hợp lệ')
        await dieuChinhTonKho({
          cong_trinh_id: ctIdOfRow(modal.row),
          ten_hang: modal.row.ten_hang,
          dvt: modal.row.dvt || 'cái',
          ton_hien_tai: modal.row.ton_cuoi ?? 0,
          ton_moi: tonMoi,
          ghi_chu: form.ghi_chu || '',
          user_email: user?.email || '',
        })
      } else if (modal.type === 'xoa') {
        await xoaHangTonKho({
          ten_hang: modal.row.ten_hang,
          cong_trinh_id: ctIdOfRow(modal.row),
          user_email: user?.email || '',
        })
      }
      setModal(null)
      loadData()
    } catch (e) {
      setModalError(e.response?.data?.detail || e.message || 'Lỗi. Thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TỒN KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">Theo dõi tồn kho theo công trình và vật tư</p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tất cả CT</span>
          }
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openThem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Thêm hàng
          </button>
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Package className="w-8 h-8 text-purple-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{fmt(data.length)}</div>
            <div className="text-sm text-gray-500">Tổng mặt hàng</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{fmt(conHangCount)}</div>
            <div className="text-sm text-gray-500">Còn hàng trong kho</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:border-red-200 transition-colors"
          onClick={() => setShowCanhBao(!showCanhBao)}>
          <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-red-600">{fmt(canhBaoCount)}</div>
            <div className="text-sm text-gray-500">Hết hàng / cần kiểm tra</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên hàng hóa, nhóm..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        <span className="text-xs text-gray-400 italic">Chọn CT ở sidebar để lọc</span>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={showCanhBao} onChange={e => setShowCanhBao(e.target.checked)}
            className="w-4 h-4 rounded" />
          Chỉ hiển thị hết hàng
        </label>
        <span className="text-xs text-gray-400">{filtered.length} dòng</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tên hàng hóa</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nhóm</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Công trình</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tổng nhập</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tổng xuất</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tồn cuối</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">ĐVT</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={10} className="py-10 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={10} className="py-10 text-center text-gray-400">Không có dữ liệu tồn kho</td></tr>
                  : filtered.map((r, i) => {
                      const hetHang = (r.ton_cuoi ?? 0) <= 0
                      return (
                        <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${hetHang ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 text-gray-800 font-medium">{r.ten_hang}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{r.nhom || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{r.ma_ct || '—'}</td>
                          <td className="px-4 py-2.5 text-right text-green-600">{fmt(r.tong_nhap)}</td>
                          <td className="px-4 py-2.5 text-right text-orange-600">{fmt(r.tong_xuat)}</td>
                          <td className={`px-4 py-2.5 text-right font-bold ${hetHang ? 'text-red-600' : 'text-purple-700'}`}>
                            {fmt(r.ton_cuoi)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{r.dvt || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              hetHang ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${hetHang ? 'bg-red-500' : 'bg-green-500'}`} />
                              {hetHang ? 'Hết hàng' : 'Còn hàng'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center whitespace-nowrap">
                            <button onClick={() => openSua(r)} title="Điều chỉnh tồn"
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => openXoa(r)} title="Xóa hàng khỏi tồn kho"
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg">
                {modal.type === 'them' && 'Thêm hàng vào kho'}
                {modal.type === 'sua' && 'Điều chỉnh tồn kho'}
                {modal.type === 'xoa' && 'Xóa hàng khỏi tồn kho'}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {modal.type === 'them' && (
              <div className="space-y-3">
                <div className="text-xs text-gray-500">
                  Công trình: <b className="text-teal-600">{selectedCT?.ten_ct}</b> — hệ thống sẽ tạo phiếu nhập "TD-..." để giữ dấu vết.
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tên hàng *</label>
                  <input list="dm-hang-hoa" value={form.ten_hang}
                    onChange={e => setForm(f => ({ ...f, ten_hang: e.target.value }))}
                    placeholder="Gõ vài chữ để chọn từ danh mục..." className={inputCls} autoFocus />
                  <datalist id="dm-hang-hoa">
                    {hangHoaList.map((h, i) => <option key={i} value={h.ten_hang} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">ĐVT</label>
                    <input value={form.dvt} onChange={e => setForm(f => ({ ...f, dvt: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Số lượng *</label>
                    <input type="number" min="0" value={form.so_luong}
                      onChange={e => setForm(f => ({ ...f, so_luong: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Đơn giá</label>
                    <input type="number" min="0" value={form.don_gia}
                      onChange={e => setForm(f => ({ ...f, don_gia: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ghi chú</label>
                  <input value={form.ghi_chu} onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))} className={inputCls} />
                </div>
              </div>
            )}

            {modal.type === 'sua' && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <div className="font-medium text-gray-800">{modal.row.ten_hang}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Tồn hiện tại: <b className="text-purple-700">{fmt(modal.row.ton_cuoi)}</b> {modal.row.dvt || ''}
                    {modal.row.ma_ct ? ` · ${modal.row.ma_ct}` : ''}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tồn mới *</label>
                  <input type="number" min="0" value={form.ton_moi}
                    onChange={e => setForm(f => ({ ...f, ton_moi: e.target.value }))} className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Lý do điều chỉnh</label>
                  <input value={form.ghi_chu} placeholder="VD: kiểm kê thực tế, nhập sai số lượng..."
                    onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))} className={inputCls} />
                </div>
                <p className="text-xs text-gray-400">
                  Hệ thống sẽ tự tạo phiếu điều chỉnh "DC-..." (nhập nếu tăng, xuất nếu giảm) — lịch sử nhập xuất được giữ nguyên.
                </p>
              </div>
            )}

            {modal.type === 'xoa' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    Xóa <b>{modal.row.ten_hang}</b> sẽ xóa <b>toàn bộ dòng nhập/xuất</b> của hàng này trong công trình
                    {modal.row.ma_ct ? <> <b>{modal.row.ma_ct}</b></> : ''} và không khôi phục được.
                    <div className="text-xs text-gray-500 mt-1">
                      Chỉ dùng khi tạo nhầm tên hàng. Nếu chỉ muốn đưa tồn về 0, hãy dùng nút Điều chỉnh.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalError && <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{modalError}</div>}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} disabled={saving}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modal.type === 'xoa' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}>
                {saving ? 'Đang lưu...' : modal.type === 'xoa' ? 'Xóa vĩnh viễn' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
