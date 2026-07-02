import React, { useState, useEffect } from 'react'
import { Box, Search, RefreshCw } from 'lucide-react'
import { getHangHoa } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

export default function DanhMuc() {
  const { selectedCT, congTrinhs } = useCongTrinh()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterNhom, setFilterNhom] = useState('')

  const loadData = () => {
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

  useEffect(() => { loadData() }, [selectedCT])

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
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Lam moi
        </button>
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
    </div>
  )
}
