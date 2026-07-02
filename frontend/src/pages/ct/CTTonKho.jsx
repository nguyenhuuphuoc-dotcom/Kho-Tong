import React, { useState, useEffect } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { Package, Search, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { getTonKho } from '../../api'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')

export default function CTTonKho() {
  const { ctId } = useOutletContext() || {}
  const { id } = useParams()
  const realId = ctId || id

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterNhom, setFilterNhom] = useState('')
  const [showCanhBao, setShowCanhBao] = useState(false)

  const loadData = () => {
    setLoading(true)
    getTonKho({ cong_trinh_id: realId })
      .then(res => setData(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [realId])

  const nhomList = [...new Set(data.map(r => r.nhom).filter(Boolean))].sort()

  const filtered = data.filter(r => {
    const matchSearch = !search || (r.ten_hang || '').toLowerCase().includes(search.toLowerCase())
    const matchNhom = !filterNhom || r.nhom === filterNhom
    const matchCB = !showCanhBao || (r.ton_cuoi ?? 0) <= 0
    return matchSearch && matchNhom && matchCB
  })

  const hetHang = data.filter(r => (r.ton_cuoi ?? 0) <= 0)
  const conHang = data.filter(r => (r.ton_cuoi ?? 0) > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TON KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">Ton kho cua cong trinh nay</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-medium disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Lam moi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Package className="w-8 h-8 text-purple-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{fmt(data.length)}</div>
            <div className="text-sm text-gray-500">Tong mat hang</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{fmt(conHang.length)}</div>
            <div className="text-sm text-gray-500">Con hang</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:border-red-200 transition-colors"
          onClick={() => setShowCanhBao(!showCanhBao)}>
          <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-red-600">{fmt(hetHang.length)}</div>
            <div className="text-sm text-gray-500">Het hang</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim ten hang hoa..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-300" />
        </div>
        <select value={filterNhom} onChange={e => setFilterNhom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none">
          <option value="">Tat ca nhom</option>
          {nhomList.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={showCanhBao} onChange={e => setShowCanhBao(e.target.checked)} className="w-4 h-4 rounded" />
          Chi hien het hang
        </label>
        <span className="text-xs text-gray-400">{filtered.length} dong</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ten hang hoa</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nhom</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tong nhap</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tong xuat</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Ton cuoi</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">DVT</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">TT</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} className="py-10 text-center text-gray-400">Dang tai...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={8} className="py-10 text-center text-gray-400">Khong co du lieu</td></tr>
                  : filtered.map((r, i) => {
                      const het = (r.ton_cuoi ?? 0) <= 0
                      return (
                        <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${het ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{i+1}</td>
                          <td className="px-4 py-2.5 text-gray-800 font-medium">{r.ten_hang}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{r.nhom || '—'}</td>
                          <td className="px-4 py-2.5 text-right text-green-600">{fmt(r.tong_nhap)}</td>
                          <td className="px-4 py-2.5 text-right text-orange-600">{fmt(r.tong_xuat)}</td>
                          <td className={`px-4 py-2.5 text-right font-bold ${het ? 'text-red-600' : 'text-purple-700'}`}>
                            {fmt(r.ton_cuoi)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{r.dvt || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${het ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${het ? 'bg-red-500' : 'bg-green-500'}`} />
                              {het ? 'Het' : 'Con'}
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
