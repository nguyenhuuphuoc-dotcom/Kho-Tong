import React, { useState, useEffect } from 'react'
import {
  Building2, Search, RefreshCw, MapPin, Hash, FileText,
  Plus, Trash2, X, CheckCircle, XCircle, CheckCircle2, RotateCcw
} from 'lucide-react'
import { api, updateCongTrinhStatus } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

export default function CongTrinh() {
  const { loadCongTrinh } = useCongTrinh()
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [updating, setUpdating] = useState(null)  // id dang update trang thai
  const [msg, setMsg]           = useState(null)
  const [form, setForm] = useState({ ten_ct: '', ma_ct: '', dia_chi: '', ghi_chu: '' })

  const loadData = () => {
    setLoading(true)
    // Dùng trailing slash để tránh SPA catch-all route
    api.get('/cong-trinh/')
      .then(res => setData(res.data?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const filtered = data.filter(ct =>
    !search ||
    (ct.ten_ct || '').toLowerCase().includes(search.toLowerCase()) ||
    (ct.ma_ct || '').toLowerCase().includes(search.toLowerCase()) ||
    (ct.dia_chi || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.ten_ct || !form.ma_ct) {
      setMsg({ type: 'err', text: 'Vui lòng nhập Tên và Mã công trình' }); return
    }
    setSaving(true); setMsg(null)
    try {
      await api.post('/cong-trinh/', form)
      setMsg({ type: 'ok', text: `Tạo thành công: ${form.ten_ct}` })
      setForm({ ten_ct: '', ma_ct: '', dia_chi: '', ghi_chu: '' })
      setShowForm(false)
      loadData()
      loadCongTrinh()
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.detail || 'Lỗi tạo công trình' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, ten) => {
    if (!window.confirm(`Xóa vĩnh viễn công trình: ${ten}?\nThao tác này không thể hoàn tác.`)) return
    try {
      await api.delete(`/cong-trinh/${id}`)
      setMsg({ type: 'ok', text: `Đã xóa: ${ten}` })
      loadData(); loadCongTrinh()
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.detail || 'Lỗi xóa công trình' })
    }
  }

  const handleToggleStatus = async (ct) => {
    const newStatus = (ct.trang_thai || 'hoat_dong') === 'hoat_dong' ? 'hoan_thanh' : 'hoat_dong'
    const label = newStatus === 'hoan_thanh' ? 'Hoàn thành' : 'Hoạt động lại'
    if (!window.confirm(`${label} công trình: ${ct.ten_ct}?`)) return
    setUpdating(ct.id)
    try {
      await updateCongTrinhStatus(ct.id, newStatus)
      setData(prev => prev.map(c => c.id === ct.id ? { ...c, trang_thai: newStatus } : c))
      setMsg({ type: 'ok', text: `Cập nhật trạng thái thành công: ${ct.ten_ct}` })
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.detail || 'Lỗi cập nhật trạng thái' })
    } finally {
      setUpdating(null)
    }
  }

  const getTrangThaiInfo = (trang_thai) => {
    if (!trang_thai || trang_thai === 'hoat_dong') {
      return { label: 'Hoạt động', className: 'bg-green-100 text-green-700' }
    }
    return { label: 'Hoàn thành', className: 'bg-gray-100 text-gray-500' }
  }

  const dang_hoat_dong = data.filter(c => !c.trang_thai || c.trang_thai === 'hoat_dong').length
  const hoan_thanh    = data.filter(c => c.trang_thai === 'hoan_thanh').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">DANH SÁCH CÔNG TRÌNH</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {data.length} công trình — <span className="text-green-600">{dang_hoat_dong} hoạt động</span>
            {hoan_thanh > 0 && <span className="text-gray-400"> · {hoan_thanh} hoàn thành</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Thêm công trình
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
          msg.type === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã, địa chỉ..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
      </div>

      {/* List */}
      {loading
        ? <div className="text-center text-gray-400 py-12">Đang tải...</div>
        : filtered.length === 0
          ? <div className="text-center text-gray-400 py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <div className="font-medium">
                {search ? 'Không tìm thấy kết quả' : 'Chưa có công trình nào'}
              </div>
              {!search && <div className="text-sm mt-1">Nhấn "Thêm công trình" để tạo mới</div>}
            </div>
          : <div className="grid grid-cols-1 gap-3">
              {filtered.map((ct, i) => {
                const ttInfo = getTrangThaiInfo(ct.trang_thai)
                const isHoanThanh = ct.trang_thai === 'hoan_thanh'
                const isUpdating = updating === ct.id
                return (
                  <div key={ct.id} className={`bg-white rounded-xl border p-5 flex items-start gap-4 hover:shadow-sm transition-all ${
                    isHoanThanh ? 'border-gray-100 opacity-70' : 'border-gray-100'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      isHoanThanh ? 'bg-gray-100 text-gray-400' : 'bg-teal-100 text-teal-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`font-bold ${isHoanThanh ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {ct.ten_ct}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span className="text-xs font-mono text-gray-500">{ct.ma_ct}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Badge trạng thái */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ttInfo.className}`}>
                            {ttInfo.label}
                          </span>

                          {/* Nút Hoàn thành / Hoạt động lại */}
                          <button
                            onClick={() => handleToggleStatus(ct)}
                            disabled={isUpdating}
                            title={isHoanThanh ? 'Hoạt động lại' : 'Đánh dấu Hoàn thành'}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              isHoanThanh
                                ? 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                                : 'hover:bg-amber-50 text-gray-400 hover:text-amber-600'
                            }`}
                          >
                            {isUpdating
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : isHoanThanh
                                ? <RotateCcw className="w-4 h-4" />
                                : <CheckCircle2 className="w-4 h-4" />
                            }
                          </button>

                          {/* Nút xóa */}
                          <button
                            onClick={() => handleDelete(ct.id, ct.ten_ct)}
                            title="Xóa công trình"
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {ct.dia_chi && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">{ct.dia_chi}</span>
                        </div>
                      )}
                      {ct.ghi_chu && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-400 italic">{ct.ghi_chu}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
      }

      {/* Modal tạo CT */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Thêm công trình mới</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tên công trình *</label>
                <input value={form.ten_ct} onChange={e => setForm({...form, ten_ct: e.target.value})}
                  placeholder="VD: Nhà xưởng Bình Dương"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Mã công trình *</label>
                <input value={form.ma_ct} onChange={e => setForm({...form, ma_ct: e.target.value.toUpperCase()})}
                  placeholder="VD: CT001"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Địa chỉ</label>
                <input value={form.dia_chi} onChange={e => setForm({...form, dia_chi: e.target.value})}
                  placeholder="Địa chỉ công trình..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ghi chú</label>
                <input value={form.ghi_chu} onChange={e => setForm({...form, ghi_chu: e.target.value})}
                  placeholder="Ghi chú thêm..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Tạo công trình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
