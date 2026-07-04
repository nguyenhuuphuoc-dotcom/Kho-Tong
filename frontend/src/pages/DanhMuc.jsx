import React, { useState, useEffect } from 'react'
import { Box, Search, RefreshCw, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { getHangHoa, createHangHoa, updateHangHoa, deleteHangHoa } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

export default function DanhMuc() {
  const { selectedCT, ctLoading, congTrinhs } = useCongTrinh()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterNhom, setFilterNhom] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({ ma_hang: '', ten_hang: '', dvt: '', nhom: '' })

  // Edit modal
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({ ten_hang: '', dvt: '', nhom: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState(null)

  const loadData = () => {
    if (ctLoading) return
    setLoading(true)
    const params = { limit: 2000 }
    if (selectedCT) params.cong_trinh_id = selectedCT.id
    getHangHoa(params)
      .then(res => setData(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [selectedCT, ctLoading])

  const nhomList = [...new Set(data.map(r => r.nhom).filter(Boolean))].sort()
  const ctMap = Object.fromEntries((congTrinhs || []).map(ct => [ct.id, ct.ten_ct]))

  const filtered = data.filter(r => {
    const matchSearch = !search ||
      (r.ten_hang || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.ma_hang || '').toLowerCase().includes(search.toLowerCase())
    const matchNhom = !filterNhom || r.nhom === filterNhom
    return matchSearch && matchNhom
  })

  const openCreate = () => {
    setForm({ ma_hang: '', ten_hang: '', dvt: '', nhom: '' })
    setCreateError('')
    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!form.ten_hang.trim()) { setCreateError('Nhập tên hàng hóa'); return }
    if (!selectedCT) { setCreateError('Chưa chọn công trình'); return }
    setCreating(true); setCreateError('')
    try {
      await createHangHoa({
        ma_hang: form.ma_hang.trim() || undefined,
        ten_hang: form.ten_hang.trim(),
        dvt: form.dvt.trim() || 'cái',
        nhom: form.nhom.trim() || undefined,
        cong_trinh_id: selectedCT.id,
      })
      setShowCreate(false)
      loadData()
    } catch (e) {
      setCreateError(e.response?.data?.detail || 'Lỗi tạo hàng hóa. Thử lại.')
    } finally { setCreating(false) }
  }

  const openEdit = (r) => {
    setEditItem(r)
    setEditForm({ ten_hang: r.ten_hang || '', dvt: r.dvt || '', nhom: r.nhom || '' })
    setEditMsg(null)
  }

  const handleEditSave = async () => {
    if (!editForm.ten_hang.trim()) { setEditMsg({ err: true, text: 'Nhập tên hàng hóa' }); return }
    setEditSaving(true); setEditMsg(null)
    try {
      await updateHangHoa(editItem.ma_hang, editForm)
      setData(d => d.map(r => r.ma_hang === editItem.ma_hang ? { ...r, ...editForm } : r))
      setEditMsg({ err: false, text: 'Đã cập nhật!' })
      setTimeout(() => { setEditItem(null); setEditMsg(null) }, 800)
    } catch (e) {
      setEditMsg({ err: true, text: e.response?.data?.detail || 'Lỗi cập nhật' })
    } finally { setEditSaving(false) }
  }

  const handleDelete = async (ma, ten) => {
    if (!window.confirm(`Xóa "${ten}"?`)) return
    try {
      await deleteHangHoa(ma)
      setData(d => d.filter(r => r.ma_hang !== ma))
    } catch (e) {
      alert('Lỗi xóa: ' + (e.response?.data?.detail || e.message))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">VẬT TƯ - HÀNG HÓA</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Đang tải...' : `${data.length} mã hàng hóa trong hệ thống`}
          </p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tất cả CT</span>
          }
        </div>
        <div className="flex gap-2">
          {selectedCT && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Tạo hàng hóa
            </button>
          )}
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{data.length}</div>
            <div className="text-sm text-gray-500">Tổng mã hàng</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Box className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{nhomList.length}</div>
            <div className="text-sm text-gray-500">Nhóm hàng hóa</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Box className="w-8 h-8 text-teal-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{filtered.length}</div>
            <div className="text-sm text-gray-500">Kết quả lọc</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên hàng, mã hàng..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        <select value={filterNhom} onChange={e => setFilterNhom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-300">
          <option value="">Tất cả nhóm</option>
          {nhomList.map(nhom => (
            <option key={nhom} value={nhom}>{nhom}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 italic">Chọn CT ở sidebar để filter</span>
        <span className="text-xs text-gray-400">{filtered.length} dòng</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mã hàng</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tên hàng hóa</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nhóm</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">DVT</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Công trình</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Không có hàng hóa</td></tr>
                  : filtered.map((r, i) => (
                      <tr key={r.ma_hang || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-blue-600 font-medium">{r.ma_hang}</td>
                        <td className="px-4 py-2.5 text-gray-800">{r.ten_hang}</td>
                        <td className="px-4 py-2.5">
                          {r.nhom
                            ? <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{r.nhom}</span>
                            : <span className="text-gray-400 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{r.dvt || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{ctMap[r.cong_trinh_id] || '—'}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(r)}
                              className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(r.ma_hang, r.ten_hang)}
                              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo hàng hóa */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Tạo Hàng Hóa Mới</h3>
                <p className="text-sm text-teal-600 font-medium">📌 {selectedCT?.ten_ct}</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên hàng hóa *</label>
                <input value={form.ten_hang}
                  onChange={e => setForm(f => ({ ...f, ten_hang: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="Ví dụ: Xi măng PCB40, Sắt phi 10..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mã hàng</label>
                  <input value={form.ma_hang}
                    onChange={e => setForm(f => ({ ...f, ma_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Tự động nếu bỏ trống" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">DVT</label>
                  <input value={form.dvt}
                    onChange={e => setForm(f => ({ ...f, dvt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="cái, kg, m, m2..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nhóm hàng</label>
                <input value={form.nhom}
                  onChange={e => setForm(f => ({ ...f, nhom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="Ví dụ: Vật liệu xây dựng, Thiết bị điện..." />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div>{createError && <p className="text-red-500 text-xs">{createError}</p>}</div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                  Hủy
                </button>
                <button onClick={handleCreate} disabled={creating}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {creating ? 'Đang lưu...' : 'Tạo hàng hóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa hàng hóa */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setEditItem(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-semibold text-gray-800">Sửa hàng hóa</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{editItem.ma_hang}</p>
              </div>
              <button onClick={() => setEditItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tên hàng hóa *</label>
                <input value={editForm.ten_hang}
                  onChange={e => setEditForm(f => ({ ...f, ten_hang: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Đơn vị tính</label>
                  <input value={editForm.dvt}
                    onChange={e => setEditForm(f => ({ ...f, dvt: e.target.value }))}
                    placeholder="cái, kg, m..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nhóm</label>
                  <input value={editForm.nhom}
                    onChange={e => setEditForm(f => ({ ...f, nhom: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              {editMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg ${editMsg.err ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {editMsg.err ? '✗' : '✓'} {editMsg.text}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditItem(null)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                  Hủy
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
