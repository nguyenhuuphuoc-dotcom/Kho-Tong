import React, { useState, useEffect } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { Download, Search, RefreshCw, Eye, Plus, X, Trash2, FileDown } from 'lucide-react'
import { getPhieuList, getChiTietPhieu, createPhieu, getHangHoa } from '../../api'
import { exportPhieuList } from '../../utils/exportExcel'
import { useAuth } from '../../context/AuthContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' ty'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}
const today = () => new Date().toISOString().slice(0, 10)

const emptyItem = () => ({ ten_hang: '', dvt: 'cai', so_luong: '', don_gia: '', thanh_tien: '' })

export default function CTNhapKho() {
  const { ctId } = useOutletContext() || {}
  const { id } = useParams()
  const realId = ctId || id
  const { user } = useAuth()

  const [phieuList, setPhieuList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPhieu, setSelectedPhieu] = useState(null)
  const [chiTiet, setChiTiet] = useState([])
  const [loadingCT, setLoadingCT] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Form tao moi
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ so_phieu: '', ngay: today(), doi_tac: '', ghi_chu: '' })
  const [items, setItems] = useState([emptyItem()])
  const [hangHoaList, setHangHoaList] = useState([])
  const [saveMsg, setSaveMsg] = useState(null)

  const loadData = () => {
    setLoading(true)
    getPhieuList({ loai: 'NK', cong_trinh_id: realId, limit: 500 })
      .then(res => setPhieuList(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    getHangHoa({ cong_trinh_id: realId, limit: 2000 })
      .then(res => setHangHoaList(res.data?.data || []))
      .catch(() => {})
  }, [realId])

  const openChiTiet = (phieu) => {
    setSelectedPhieu(phieu)
    setLoadingCT(true)
    getChiTietPhieu(phieu.id)
      .then(res => setChiTiet(res.data?.items || []))
      .catch(() => setChiTiet([]))
      .finally(() => setLoadingCT(false))
  }

  const filtered = phieuList.filter(p =>
    !search ||
    (p.so_phieu || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.doi_tac || '').toLowerCase().includes(search.toLowerCase())
  )

  // Items logic
  const updateItem = (i, field, val) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: val }
    // Tự tính thành tiền
    if (field === 'so_luong' || field === 'don_gia') {
      const sl = field === 'so_luong' ? parseFloat(val) : parseFloat(next[i].so_luong)
      const dg = field === 'don_gia' ? parseFloat(val) : parseFloat(next[i].don_gia)
      next[i].thanh_tien = (!isNaN(sl) && !isNaN(dg)) ? sl * dg : ''
    }
    setItems(next)
  }

  const addItem = () => setItems([...items, emptyItem()])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const tongTien = items.reduce((s, it) => s + (parseFloat(it.thanh_tien) || 0), 0)

  const handleSelectHang = (i, tenHang) => {
    const hh = hangHoaList.find(h => h.ten_hang === tenHang)
    const next = [...items]
    next[i] = { ...next[i], ten_hang: tenHang, dvt: hh?.dvt || 'cai' }
    setItems(next)
  }

  const handleSave = async () => {
    if (!form.so_phieu || !form.ngay) { setSaveMsg({ type: 'err', text: 'Vui long nhap so phieu va ngay' }); return }
    const validItems = items.filter(it => it.ten_hang && parseFloat(it.so_luong) > 0)
    if (validItems.length === 0) { setSaveMsg({ type: 'err', text: 'Can it nhat 1 dong hang hop le' }); return }
    setSaving(true)
    setSaveMsg(null)
    try {
      await createPhieu({
        cong_trinh_id: parseInt(realId),
        loai: 'NK',
        so_phieu: form.so_phieu,
        ngay: form.ngay,
        doi_tac: form.doi_tac,
        ghi_chu: form.ghi_chu,
        tong_tien: tongTien,
        user_email: user?.email || '',
        items: validItems.map(it => ({
          ten_hang: it.ten_hang,
          dvt: it.dvt || 'cai',
          so_luong: parseFloat(it.so_luong) || 0,
          don_gia: parseFloat(it.don_gia) || 0,
          thanh_tien: parseFloat(it.thanh_tien) || 0,
        }))
      })
      setSaveMsg({ type: 'ok', text: 'Luu phieu thanh cong!' })
      setForm({ so_phieu: '', ngay: today(), doi_tac: '', ghi_chu: '' })
      setItems([emptyItem()])
      setShowForm(false)
      loadData()
    } catch (e) {
      setSaveMsg({ type: 'err', text: e.response?.data?.detail || 'Loi khi luu phieu' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PHIEU NHAP KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">{phieuList.length} phieu nhap</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={async () => {
              setExporting(true)
              try {
                await exportPhieuList({ phieuList: filtered, loai: 'NK' })
              } catch (e) { alert(e.message) }
              finally { setExporting(false) }
            }}
            disabled={exporting || filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm disabled:opacity-50">
            <FileDown className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? '...' : 'Excel'}
          </button>
          <button onClick={() => { setShowForm(true); setSaveMsg(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Tao phieu NK
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${saveMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {saveMsg.text}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim so phieu, NCC..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-300" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">So phieu</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Ngay</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">NCC</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Tong tien</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">CT</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">Dang tai...</td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chua co phieu nhap kho</td></tr>
                : filtered.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-green-700">{p.so_phieu}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.ngay}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[120px]">{p.doi_tac || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{formatVND(p.tong_tien)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => openChiTiet(p)}
                          className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot className="bg-green-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-2 font-bold text-gray-700 text-sm">Tong ({filtered.length} phieu)</td>
                <td className="px-4 py-2 text-right font-bold text-green-700">
                  {formatVND(filtered.reduce((s, p) => s + (p.tong_tien || 0), 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal chi tiet */}
      {selectedPhieu && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelectedPhieu(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-green-700">{selectedPhieu.so_phieu}</h3>
                <p className="text-xs text-gray-500">{selectedPhieu.ngay}{selectedPhieu.doi_tac ? ` · ${selectedPhieu.doi_tac}` : ''}</p>
              </div>
              <button onClick={() => setSelectedPhieu(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="overflow-auto flex-1 p-5">
              {loadingCT
                ? <div className="text-center py-8 text-gray-400">Dang tai...</div>
                : <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 text-gray-500">#</th>
                        <th className="text-left p-2 text-gray-500">Ten hang</th>
                        <th className="text-right p-2 text-gray-500">SL</th>
                        <th className="text-left p-2 text-gray-500">DVT</th>
                        <th className="text-right p-2 text-gray-500">Don gia</th>
                        <th className="text-right p-2 text-gray-500">Thanh tien</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiTiet.map((it, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="p-2 text-gray-400">{i+1}</td>
                          <td className="p-2 text-gray-800">{it.ten_hang}</td>
                          <td className="p-2 text-right">{fmt(it.so_luong)}</td>
                          <td className="p-2 text-gray-500 text-xs">{it.dvt}</td>
                          <td className="p-2 text-right text-gray-600">{formatVND(it.don_gia)}</td>
                          <td className="p-2 text-right font-medium">{formatVND(it.thanh_tien)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between text-sm">
              <span className="text-gray-500">{chiTiet.length} dong</span>
              <span className="font-bold text-green-700">Tong: {formatVND(selectedPhieu.tong_tien)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal tao phieu */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-4">
            <div className="flex items-center justify-between p-5 border-b bg-green-50 rounded-t-xl">
              <h3 className="font-bold text-gray-800 text-lg">Tao Phieu Nhap Kho Moi</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Form header */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">So phieu *</label>
                  <input value={form.so_phieu} onChange={e => setForm({...form, so_phieu: e.target.value})}
                    placeholder="VD: NK-001"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Ngay *</label>
                  <input type="date" value={form.ngay} onChange={e => setForm({...form, ngay: e.target.value})}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">NCC / Doi tac</label>
                  <input value={form.doi_tac} onChange={e => setForm({...form, doi_tac: e.target.value})}
                    placeholder="Ten nha cung cap"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Ghi chu</label>
                  <input value={form.ghi_chu} onChange={e => setForm({...form, ghi_chu: e.target.value})}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                </div>
              </div>

              {/* Items table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium w-8">#</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium">Ten hang hoa</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium w-20">DVT</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium w-24">So luong</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium w-28">Don gia</th>
                      <th className="text-right px-3 py-2 text-gray-500 font-medium w-28">Thanh tien</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 text-gray-400 text-xs">{i+1}</td>
                        <td className="px-3 py-1.5">
                          <input
                            list={`hang-list-${i}`}
                            value={it.ten_hang}
                            onChange={e => { updateItem(i, 'ten_hang', e.target.value); handleSelectHang(i, e.target.value) }}
                            placeholder="Ten hang..."
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-300"
                          />
                          <datalist id={`hang-list-${i}`}>
                            {hangHoaList.slice(0, 100).map(h => <option key={h.ma_hang} value={h.ten_hang} />)}
                          </datalist>
                        </td>
                        <td className="px-3 py-1.5">
                          <input value={it.dvt} onChange={e => updateItem(i, 'dvt', e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-300" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={it.so_luong} onChange={e => updateItem(i, 'so_luong', e.target.value)}
                            placeholder="0"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-green-300" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={it.don_gia} onChange={e => updateItem(i, 'don_gia', e.target.value)}
                            placeholder="0"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-green-300" />
                        </td>
                        <td className="px-3 py-1.5 text-right text-xs font-medium text-gray-700">
                          {it.thanh_tien ? formatVND(parseFloat(it.thanh_tien)) : '—'}
                        </td>
                        <td className="px-2">
                          <button onClick={() => removeItem(i)} disabled={items.length === 1}
                            className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded disabled:opacity-30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                  <button onClick={addItem} className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Them dong
                  </button>
                  <span className="text-sm font-bold text-gray-700">Tong: {formatVND(tongTien)}</span>
                </div>
              </div>

              {saveMsg && (
                <div className={`p-3 rounded-xl text-sm ${saveMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {saveMsg.text}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Huy
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Dang luu...</> : 'Luu Phieu NK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
