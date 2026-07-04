import React, { useState, useEffect } from 'react'
import { ClipboardList, RefreshCw, Search, Filter } from 'lucide-react'
import { getNhatKy } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

const ACTION_LABELS = {
  create_nk:    { label: 'Tạo phiếu NK',  color: 'bg-green-100 text-green-700' },
  create_xk:    { label: 'Tạo phiếu XK',  color: 'bg-orange-100 text-orange-700' },
  delete_phieu: { label: 'Xóa phiếu',     color: 'bg-red-100 text-red-700' },
  login:        { label: 'Đăng nhập',     color: 'bg-blue-100 text-blue-700' },
  manual:       { label: 'Thủ công',      color: 'bg-gray-100 text-gray-600' },
}

function fmtAction(action) {
  return ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-600' }
}

function fmtTime(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return ts }
}

export default function NhatKy() {
  const { selectedCT, ctLoading, congTrinhs } = useCongTrinh()
  const ctMap = Object.fromEntries((congTrinhs || []).map(ct => [ct.id, ct.ten_ct]))

  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [page, setPage]       = useState(0)
  const PAGE_SIZE = 50

  const loadData = () => {
    if (ctLoading) return
    setLoading(true)
    const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
    if (filterAction) params.action = filterAction
    if (selectedCT)   params.cong_trinh_id = selectedCT.id
    getNhatKy(params)
      .then(res => setLogs(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [page, filterAction, selectedCT, ctLoading])

  const filtered = logs.filter(l =>
    !search ||
    (l.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.details    || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action     || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">NHẬT KÝ HOẠT ĐỘNG</h1>
          <p className="text-gray-500 mt-1 text-sm">Theo dõi toàn bộ thao tác trên hệ thống</p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tất cả công trình</span>
          }
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm người dùng, chi tiết..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-300">
            <option value="">Tất cả hành động</option>
            <option value="create_nk">Tạo phiếu NK</option>
            <option value="create_xk">Tạo phiếu XK</option>
            <option value="delete_phieu">Xóa phiếu</option>
            <option value="login">Đăng nhập</option>
          </select>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} bản ghi</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Thời gian</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Người dùng</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Hành động</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Chi tiết</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Công trình</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Đang tải...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">
                      <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      Chưa có nhật ký nào
                    </td></tr>
                  : filtered.map((log, i) => {
                      const act = fmtAction(log.action)
                      return (
                        <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{page * PAGE_SIZE + i + 1}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{fmtTime(log.created_at)}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{log.user_email || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${act.color}`}>
                              {act.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs max-w-[280px] truncate" title={log.details}>{log.details || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]">
                            {log.cong_trinh_id ? (ctMap[log.cong_trinh_id] || `CT #${log.cong_trinh_id}`) : '—'}
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          ← Trang trước
        </button>
        <span className="text-sm text-gray-500">Trang {page + 1}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={logs.length < PAGE_SIZE || loading}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          Trang sau →
        </button>
      </div>
    </div>
  )
}
