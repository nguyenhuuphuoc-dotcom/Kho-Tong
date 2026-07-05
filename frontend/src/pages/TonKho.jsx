import React, { useState, useEffect } from 'react'
import { Package, Search, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { getTonKho } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')

export default function TonKho() {
  const { selectedCT, ctLoading } = useCongTrinh()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCanhBao, setShowCanhBao] = useState(false)

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

  const filtered = data.filter(r => {
    const matchSearch = !search ||
      (r.ten_hang || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.nhom || '').toLowerCase().includes(search.toLowerCase())
    const matchCB = !showCanhBao || (r.ton_cuoi ?? 0) <= 0
    return matchSearch && matchCB
  })

  const canhBaoCount = data.filter(r => (r.ton_cuoi ?? 0) <= 0).length
  const conHangCount = data.filter(r => (r.ton_cuoi ?? 0) > 0).length

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
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} className="py-10 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={9} className="py-10 text-center text-gray-400">Không có dữ liệu tồn kho</td></tr>
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
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
