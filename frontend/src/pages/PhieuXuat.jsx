import React, { useState, useEffect } from 'react'
import { Upload, Search, RefreshCw, Eye, X } from 'lucide-react'
import { getPhieuList, getChiTietPhieu } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' ty'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}

export default function PhieuXuat() {
  const { selectedCT, congTrinhs } = useCongTrinh()
  const [phieuList, setPhieuList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPhieu, setSelectedPhieu] = useState(null)
  const [chiTiet, setChiTiet] = useState([])
  const [loadingChiTiet, setLoadingChiTiet] = useState(false)

  const loadData = () => {
    setLoading(true)
    const params = { loai: 'XK', limit: 500 }
    if (selectedCT) params.cong_trinh_id = selectedCT.id
    getPhieuList(params)
      .then(res => {
        setPhieuList(res.data?.data || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [selectedCT])

  const openChiTiet = (phieu) => {
    setSelectedPhieu(phieu)
    setLoadingChiTiet(true)
    getChiTietPhieu(phieu.id)
      .then(res => setChiTiet(res.data?.items || []))
      .catch(() => setChiTiet([]))
      .finally(() => setLoadingChiTiet(false))
  }

  const ctMap = Object.fromEntries((congTrinhs || []).map(ct => [ct.id, ct.ten_ct]))

  const filtered = phieuList.filter(p => {
    const matchSearch = !search ||
      (p.so_phieu || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.doi_tac || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const tongTien = filtered.reduce((s, p) => s + (p.tong_tien || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PHIEU XUAT KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">Tat ca phieu xuat kho tu cac cong trinh</p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tat ca CT</span>
          }
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Lam moi
        </button>
      </div>

      {/* Stats nhanh */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Upload className="w-8 h-8 text-orange-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{filtered.length}</div>
            <div className="text-sm text-gray-500">So phieu hien thi</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Upload className="w-8 h-8 text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{phieuList.length}</div>
            <div className="text-sm text-gray-500">Tong phieu XK</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Upload className="w-8 h-8 text-teal-500 flex-shrink-0" />
          <div>
            <div className="text-xl font-bold text-gray-800">{formatVND(tongTien)}</div>
            <div className="text-sm text-gray-500">Tong gia tri</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim so phieu, nguoi nhan..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        <span className="text-xs text-gray-400 italic">Chon CT o sidebar de filter</span>
        <span className="text-xs text-gray-400">{filtered.length} phieu</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">So phieu</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngay</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Cong trinh</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nguoi nhan / Ghi chu</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tong tien</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Chi tiet</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Dang tai du lieu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Khong co phieu xuat kho</td></tr>
                  : filtered.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-orange-700">{p.so_phieu}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.ngay}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs truncate max-w-[160px]" title={ctMap[p.cong_trinh_id]}>
                          {ctMap[p.cong_trinh_id] || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[130px]" title={p.doi_tac}>
                          {p.doi_tac || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-orange-700">{formatVND(p.tong_tien)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => openChiTiet(p)}
                            className="p-1.5 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot className="bg-orange-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 font-bold text-gray-700 text-sm">Tong cong ({filtered.length} phieu)</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-700">{formatVND(tongTien)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal chi tiet */}
      {selectedPhieu && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelectedPhieu(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  <span className="text-orange-600">{selectedPhieu.so_phieu}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedPhieu.ngay} &nbsp;·&nbsp; {ctMap[selectedPhieu.cong_trinh_id] || ''}
                  {selectedPhieu.doi_tac && <> &nbsp;·&nbsp; {selectedPhieu.doi_tac}</>}
                </p>
              </div>
              <button onClick={() => setSelectedPhieu(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-5">
              {loadingChiTiet
                ? <div className="text-center text-gray-400 py-8">Dang tai...</div>
                : chiTiet.length === 0
                  ? <div className="text-center text-gray-400 py-8">Khong co chi tiet</div>
                  : <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-gray-500 font-medium">#</th>
                          <th className="text-left p-2 text-gray-500 font-medium">Ten hang</th>
                          <th className="text-right p-2 text-gray-500 font-medium">SL</th>
                          <th className="text-left p-2 text-gray-500 font-medium">DVT</th>
                          <th className="text-right p-2 text-gray-500 font-medium">Don gia</th>
                          <th className="text-right p-2 text-gray-500 font-medium">Thanh tien</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chiTiet.map((item, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="p-2 text-gray-400 text-xs">{i + 1}</td>
                            <td className="p-2 text-gray-800">{item.ten_hang}</td>
                            <td className="p-2 text-right text-gray-700">{fmt(item.so_luong)}</td>
                            <td className="p-2 text-gray-500 text-xs">{item.dvt}</td>
                            <td className="p-2 text-right text-gray-600">{formatVND(item.don_gia)}</td>
                            <td className="p-2 text-right font-medium text-gray-800">{formatVND(item.thanh_tien)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              }
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center text-sm">
              <span className="text-gray-500">{chiTiet.length} dong hang</span>
              <span className="font-bold text-orange-700 text-base">Tong: {formatVND(selectedPhieu.tong_tien)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
