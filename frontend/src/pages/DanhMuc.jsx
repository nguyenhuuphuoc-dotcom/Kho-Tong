import React, { useState, useEffect } from 'react'
import { Box, Search, RefreshCw, Plus, X } from 'lucide-react'
import { getHangHoa, createHangHoa } from '../api'
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

  const loadData = () => {
    if (ctLoading) return
    setLoading(true)
    const params = { limit: 2000 }
    if (selectedCT) params.cong_trinh_id = selectedCT.id
    getHangHoa(params)
      .then(res => {
        setData(res.data?.data || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [selectedCT, ctLoading])

  // Danh sách nhóm duy nhất
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
    if (!form.ten_hang.trim()) { setCreateError('Nhap ten hang hoa'); return }
    if (!selectedCT) { setCreateError('Chua chon cong trinh'); return }
    setCreating(true)
    setCreateError('')
    try {
      await createHangHoa({
        ma_hang: form.ma_hang.trim() || undefined,
        ten_hang: form.ten_hang.trim(),
        dvt: form.dvt.trim() || 'cai',
        nhom: form.nhom.trim() || undefined,
        cong_trinh_id: selectedCT.id,
      })
      setShowCreate(false)
      loadData()
    } catch (e) {
      setCreateError(e.response?.data?.detail || 'Loi tao hang hoa. Thu lai.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">VAT TU - HANG HOA</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Dang tai...' : `${data.length} ma hang hoa trong he thong`}
          </p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tat ca CT</span>
          }
        </div>
        <div className="flex gap-2">
          {selectedCT && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Tao hang hoa
            </button>
          )}
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Lam moi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{data.length}</div>
            <div className="text-sm text-gray-500">Tong ma hang</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Box className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{nhomList.length}</div>
            <div className="text-sm text-gray-500">Nhom hang hoa</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Box className="w-8 h-8 text-teal-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{filtered.length}</div>
            <div className="text-sm text-gray-500">Ket qua loc</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim ten hang, ma hang..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        <select value={filterNhom} onChange={e => setFilterNhom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-300">
          <option value="">Tat ca nhom</option>
          {nhomList.map(nhom => (
            <option key={nhom} value={nhom}>{nhom}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 italic">Chon CT o sidebar de filter</span>
        <span className="text-xs text-gray-400">{filtered.length} dong</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ma hang</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ten hang hoa</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nhom</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">DVT</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Cong trinh</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Dang tai du lieu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Khong co hang hoa</td></tr>
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
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tao hang hoa */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Tao Hang Hoa Moi</h3>
                <p className="text-sm text-teal-600 font-medium">📌 {selectedCT?.ten_ct}</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ten hang hoa *</label>
                <input value={form.ten_hang}
                  onChange={e => setForm(f => ({ ...f, ten_hang: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="Vi du: Xi mang PCB40, Sat phi 10..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ma hang</label>
                  <input value={form.ma_hang}
                    onChange={e => setForm(f => ({ ...f, ma_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Tu dong neu bo trong" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">DVT</label>
                  <input value={form.dvt}
                    onChange={e => setForm(f => ({ ...f, dvt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="cai, kg, m, m2..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nhom hang</label>
                <input value={form.nhom}
                  onChange={e => setForm(f => ({ ...f, nhom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  placeholder="Vi du: Vat lieu xay dung, Thiet bi dien..." />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div>
                {createError && <p className="text-red-500 text-xs">{createError}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                  Huy
                </button>
                <button onClick={handleCreate} disabled={creating}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {creating ? 'Dang luu...' : 'Tao hang hoa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
