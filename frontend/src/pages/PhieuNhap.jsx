import React, { useState, useEffect } from 'react'
import { Download, Search, RefreshCw, Eye, X, Plus, Trash2 } from 'lucide-react'
import { getPhieuList, getChiTietPhieu, createPhieu } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' ty'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const genSoPhieu = () => {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `NK-${ymd}-${String(Math.floor(Math.random()*900)+100)}`
}
const emptyItem = () => ({ ten_hang: '', dvt: 'cai', so_luong: 1, don_gia: 0, thanh_tien: 0 })

export default function PhieuNhap() {
  const { selectedCT, congTrinhs, isAdmin } = useCongTrinh()
  const { user } = useAuth()
  const isAdminUser = user?.role === 'admin' || isAdmin

  const [phieuList, setPhieuList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPhieu, setSelectedPhieu] = useState(null)
  const [chiTiet, setChiTiet] = useState([])
  const [loadingChiTiet, setLoadingChiTiet] = useState(false)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({ so_phieu: '', ngay: todayStr(), doi_tac: '', ghi_chu: '' })
  const [items, setItems] = useState([emptyItem()])

  const loadData = () => {
    setLoading(true)
    const params = { loai: 'NK', limit: 500 }
    if (selectedCT) params.cong_trinh_id = selectedCT.id
    getPhieuList(params)
      .then(res => setPhieuList(res.data?.data || []))
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

  const filtered = phieuList.filter(p =>
    !search ||
    (p.so_phieu || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.doi_tac || '').toLowerCase().includes(search.toLowerCase())
  )

  const tongTien = filtered.reduce((s, p) => s + (p.tong_tien || 0), 0)

  const openCreate = () => {
    setForm({ so_phieu: genSoPhieu(), ngay: todayStr(), doi_tac: '', ghi_chu: '' })
    setItems([emptyItem()])
    setCreateError('')
    setShowCreate(true)
  }

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [field]: val }
      const sl = field === 'so_luong' ? parseFloat(val) || 0 : parseFloat(it.so_luong) || 0
      const dg = field === 'don_gia'  ? parseFloat(val) || 0 : parseFloat(it.don_gia)  || 0
      updated.thanh_tien = sl * dg
      return updated
    }))
  }

  const tongItems = items.reduce((s, it) => s + (it.thanh_tien || 0), 0)

  const handleCreate = async () => {
    if (!selectedCT)           { setCreateError('Chua chon cong trinh'); return }
    if (!form.so_phieu.trim()) { setCreateError('Nhap so phieu'); return }
    const validItems = items.filter(it => it.ten_hang.trim())
    if (validItems.length === 0) { setCreateError('Them it nhat 1 hang hoa'); return }
    setCreating(true)
    setCreateError('')
    try {
      await createPhieu({
        cong_trinh_id: selectedCT.id,
        loai: 'NK',
        so_phieu: form.so_phieu.trim(),
        ngay: form.ngay,
        doi_tac: form.doi_tac.trim(),
        ghi_chu: form.ghi_chu.trim(),
        tong_tien: tongItems,
        items: validItems.map(it => ({
          ...it,
          so_luong: parseFloat(it.so_luong) || 0,
          don_gia:  parseFloat(it.don_gia)  || 0,
          thanh_tien: it.thanh_tien || 0,
        }))
      })
      setShowCreate(false)
      loadData()
    } catch (e) {
      setCreateError(e.response?.data?.detail || 'Loi tao phieu. Thu lai.')
    } finally {
      setCreating(false)
    }
  }

  const colSpan = isAdminUser ? 7 : 6

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PHIEU NHAP KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isAdminUser ? 'Tat ca phieu nhap kho tu cac cong trinh' : `Cong trinh: ${selectedCT?.ten_ct || '...'}`}
          </p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tat ca CT</span>
          }
        </div>
        <div className="flex gap-2">
          {selectedCT && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Tao phieu NK
            </button>
          )}
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Lam moi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Download className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{filtered.length}</div>
            <div className="text-sm text-gray-500">So phieu hien thi</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Download className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-gray-800">{phieuList.length}</div>
            <div className="text-sm text-gray-500">Tong phieu NK</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Download className="w-8 h-8 text-teal-500 flex-shrink-0" />
          <div>
            <div className="text-xl font-bold text-gray-800">{formatVND(tongTien)}</div>
            <div className="text-sm text-gray-500">Tong gia tri</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim so phieu, nha cung cap..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
        {isAdminUser && <span className="text-xs text-gray-400 italic">Chon CT o sidebar de filter</span>}
        <span className="text-xs text-gray-400">{filtered.length} phieu</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">So phieu</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngay</th>
                {isAdminUser && <th className="text-left px-4 py-3 text-gray-500 font-medium">Cong trinh</th>}
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nha cung cap / Ghi chu</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tong tien</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Chi tiet</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={colSpan} className="py-10 text-center text-gray-400">Dang tai du lieu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={colSpan} className="py-10 text-center text-gray-400">Khong co phieu nhap kho</td></tr>
                  : filtered.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">{p.so_phieu}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.ngay}</td>
                        {isAdminUser && (
                          <td className="px-4 py-3 text-gray-700 text-xs truncate max-w-[160px]">{ctMap[p.cong_trinh_id] || '—'}</td>
                        )}
                        <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[130px]">{p.doi_tac || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatVND(p.tong_tien)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => openChiTiet(p)}
                            className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot className="bg-blue-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={colSpan - 2} className="px-4 py-3 font-bold text-gray-700 text-sm">Tong cong ({filtered.length} phieu)</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">{formatVND(tongTien)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal xem chi tiet */}
      {selectedPhieu && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelectedPhieu(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-blue-700 text-lg">{selectedPhieu.so_phieu}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedPhieu.ngay} &nbsp;·&nbsp; {ctMap[selectedPhieu.cong_trinh_id] || ''}
                  {selectedPhieu.doi_tac && <> &nbsp;·&nbsp; {selectedPhieu.doi_tac}</>}
                </p>
              </div>
              <button onClick={() => setSelectedPhieu(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
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
                          <tr key={i} className="border-b border-gray-50">
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
              <span className="font-bold text-blue-700 text-base">Tong: {formatVND(selectedPhieu.tong_tien)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal tao phieu NK */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Tao Phieu Nhap Kho</h3>
                <p className="text-sm text-teal-600 font-medium">📌 {selectedCT?.ten_ct}</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">So phieu *</label>
                  <input value={form.so_phieu}
                    onChange={e => setForm(f => ({ ...f, so_phieu: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    placeholder="NK-20260702-001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ngay *</label>
                  <input type="date" value={form.ngay}
                    onChange={e => setForm(f => ({ ...f, ngay: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nha cung cap</label>
                  <input value={form.doi_tac}
                    onChange={e => setForm(f => ({ ...f, doi_tac: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Ten nha cung cap..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chu</label>
                  <input value={form.ghi_chu}
                    onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Ghi chu them..." />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Danh sach hang hoa *</label>
                  <button onClick={() => setItems(prev => [...prev, emptyItem()])}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    <Plus className="w-3 h-3" /> Them dong
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-center px-3 py-2 text-gray-500 font-medium w-8">#</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Ten hang *</th>
                        <th className="text-center px-2 py-2 text-gray-500 font-medium w-16">SL</th>
                        <th className="text-center px-2 py-2 text-gray-500 font-medium w-16">DVT</th>
                        <th className="text-center px-2 py-2 text-gray-500 font-medium w-24">Don gia</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium w-24">Thanh tien</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 text-gray-400 text-center">{i + 1}</td>
                          <td className="px-1 py-1">
                            <input value={it.ten_hang} onChange={e => updateItem(i, 'ten_hang', e.target.value)}
                              placeholder="Ten vat tu..."
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-300" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={it.so_luong} min="0" onChange={e => updateItem(i, 'so_luong', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-right focus:outline-none focus:border-blue-300" />
                          </td>
                          <td className="px-1 py-1">
                            <input value={it.dvt} onChange={e => updateItem(i, 'dvt', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-300" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={it.don_gia} min="0" onChange={e => updateItem(i, 'don_gia', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-right focus:outline-none focus:border-blue-300" />
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-blue-600">{formatVND(it.thanh_tien)}</td>
                          <td className="px-1 py-1 text-center">
                            {items.length > 1 && (
                              <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                                className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div>
                {createError && <p className="text-red-500 text-xs mb-1">{createError}</p>}
                <p className="text-base font-bold text-blue-700">Tong: {formatVND(tongItems)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                  Huy
                </button>
                <button onClick={handleCreate} disabled={creating}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {creating ? 'Dang luu...' : 'Luu Phieu NK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
