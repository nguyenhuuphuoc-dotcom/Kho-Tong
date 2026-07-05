import React, { useState, useEffect } from 'react'
import { History, Search, RefreshCw, Download, Upload } from 'lucide-react'
import { getLichSuGiaoDich } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' tỷ'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}

export default function LichSuGiaoDich() {
  const { selectedCT, ctLoading, congTrinhs, dateFrom, dateTo } = useCongTrinh()

  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [loaiFilter, setLoaiFilter] = useState('')   // '' | 'NK' | 'XK'

  const loadData = () => {
    if (ctLoading) return
    setLoading(true)
    const params = { limit: 2000 }
    if (selectedCT) params.cong_trinh_id = selectedCT.id
    if (loaiFilter)  params.loai = loaiFilter
    if (dateFrom)    params.date_from = dateFrom
    if (dateTo)      params.date_to   = dateTo
    getLichSuGiaoDich(params)
      .then(res => {
        setData(res.data?.data || [])
        setTotal(res.data?.total || 0)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [selectedCT, ctLoading, loaiFilter, dateFrom, dateTo])

  const ctMap = Object.fromEntries((congTrinhs || []).map(ct => [ct.id, ct.ten_ct]))

  const filtered = data.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.ten_hang || '').toLowerCase().includes(q) ||
           (r.so_phieu || '').toLowerCase().includes(q) ||
           (r.doi_tac  || '').toLowerCase().includes(q)
  })

  const tongNK = filtered.filter(r => r.loai === 'NK').reduce((s, r) => s + (r.thanh_tien || 0), 0)
  const tongXK = filtered.filter(r => r.loai === 'XK').reduce((s, r) => s + (r.thanh_tien || 0), 0)
  const countNK = filtered.filter(r => r.loai === 'NK').length
  const countXK = filtered.filter(r => r.loai === 'XK').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">LỊCH SỬ GIAO DỊCH</h1>
          <p className="text-gray-500 mt-1 text-sm">Toàn bộ hàng hóa nhập/xuất theo từng phiếu</p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tất cả CT</span>
          }
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:border-blue-200"
          onClick={() => setLoaiFilter(loaiFilter === 'NK' ? '' : 'NK')}>
          <Download className={`w-8 h-8 flex-shrink-0 ${loaiFilter === 'NK' ? 'text-blue-600' : 'text-blue-400'}`} />
          <div>
            <div className="text-2xl font-bold text-gray-800">{countNK}</div>
            <div className="text-sm text-gray-500">Dòng nhập kho · {formatVND(tongNK)}</div>
          </div>
          {loaiFilter === 'NK' && <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Đang lọc</span>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:border-orange-200"
          onClick={() => setLoaiFilter(loaiFilter === 'XK' ? '' : 'XK')}>
          <Upload className={`w-8 h-8 flex-shrink-0 ${loaiFilter === 'XK' ? 'text-orange-600' : 'text-orange-400'}`} />
          <div>
            <div className="text-2xl font-bold text-gray-800">{countXK}</div>
            <div className="text-sm text-gray-500">Dòng xuất kho · {formatVND(tongXK)}</div>
          </div>
          {loaiFilter === 'XK' && <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Đang lọc</span>}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên hàng, số phiếu, đối tác..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        <div className="flex gap-1">
          {['', 'NK', 'XK'].map(v => (
            <button key={v} onClick={() => setLoaiFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                loaiFilter === v
                  ? v === 'NK' ? 'bg-blue-500 text-white' : v === 'XK' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {v === '' ? 'Tất cả' : v === 'NK' ? 'Nhập kho' : 'Xuất kho'}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} / {total} dòng</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tên hàng hóa</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">SL</th>
                <th className="text-left px-2 py-3 text-gray-500 font-medium">ĐVT</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Đơn giá</th>
                <th className="text-right px-3 py-3 text-gray-500 font-medium">Thành tiền</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">Loại</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Số phiếu</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Ngày</th>
                <th className="text-left px-3 py-3 text-gray-500 font-medium">Đối tác</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={10} className="py-10 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={10} className="py-10 text-center text-gray-400">Không có dữ liệu</td></tr>
                  : filtered.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 text-gray-800 font-medium max-w-[200px] truncate">{r.ten_hang}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{fmt(r.so_luong)}</td>
                        <td className="px-2 py-2.5 text-gray-500 text-xs">{r.dvt || '—'}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 text-xs">{formatVND(r.don_gia)}</td>
                        <td className={`px-3 py-2.5 text-right font-semibold text-xs ${r.loai === 'NK' ? 'text-blue-700' : 'text-orange-700'}`}>
                          {formatVND(r.thanh_tien)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.loai === 'NK' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {r.loai === 'NK' ? '↓ NK' : '↑ XK'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-blue-600">{r.so_phieu}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{r.ngay}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs truncate max-w-[120px]">{r.doi_tac || '—'}</td>
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
