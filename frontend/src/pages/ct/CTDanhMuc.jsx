import React, { useState, useEffect } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { Plus, Search, RefreshCw, Trash2, Package, X } from 'lucide-react'
import { getHangHoa, createHangHoa, deleteHangHoa } from '../../api'

export default function CTDanhMuc() {
  const { ctId } = useOutletContext() || {}
  const { id } = useParams()
  const realId = ctId || id

  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)
  const [form, setForm]       = useState({ ten_hang: '', dvt: 'cai', nhom: 'Vat tu', mo_ta: '' })

  const loadData = () => {
    setLoading(true)
    getHangHoa({ cong_trinh_id: realId, limit: 2000 })
      .then(res => setList(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [realId])

  const filtered = list.filter(h =>
    !search ||
    (h.ten_hang || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.ma_hang  || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!form.ten_hang.trim()) { setMsg({ err: true, text: 'Nhap ten hang hoa' }); return }
    setSaving(true); setMsg(null)
    try {
      await createHangHoa({ ...form, cong_trinh_id: Number(realId) })
      setMsg({ err: false, text: 'Da them: ' + form.ten_hang })
      setForm({ ten_hang: '', dvt: 'cai', nhom: 'Vat tu', mo_ta: '' })
      loadData()
    } catch (e) {
      setMsg({ err: true, text: e.response?.data?.detail || 'Loi them hang hoa' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (ma) => {
    if (!window.confirm('Xoa hang hoa nay?')) return
    try {
      await deleteHangHoa(ma)
      setList(l => l.filter(h => h.ma_hang !== ma))
    } catch (e) {
      alert('Loi xoa: ' + (e.response?.data?.detail || e.message))
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">DANH MUC HANG HOA</h1>
          <p className="text-sm text-gray-500 mt-0.5">{list.length} mat hang dang quan ly</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setShowForm(v => !v); setMsg(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Them hang hoa
          </button>
        </div>
      </div>

      {/* Form thêm mới */}
      {showForm && (
        <div className="bg-white rounded-xl border border-teal-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Them hang hoa moi</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Ten hang hoa *</label>
              <input
                value={form.ten_hang}
                onChange={e => setForm(f => ({...f, ten_hang: e.target.value}))}
                placeholder="Vi du: Xi mang PC40, Sat phi 6mm..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Don vi tinh</label>
              <input
                value={form.dvt}
                onChange={e => setForm(f => ({...f, dvt: e.target.value}))}
                placeholder="cai, kg, m, m2..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nhom</label>
              <select
                value={form.nhom}
                onChange={e => setForm(f => ({...f, nhom: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
              >
                <option>Vat tu</option>
                <option>Thiet bi</option>
                <option>MM-CCDC</option>
                <option>VPP</option>
                <option>Khac</option>
              </select>
            </div>
          </div>

          {msg && (
            <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${msg.err ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {msg.err ? '✗' : '✓'} {msg.text}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Huy
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Them vao danh muc
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tim hang hoa..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Dang tai...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{search ? 'Khong tim thay ket qua' : 'Chua co hang hoa nao'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-teal-500 text-sm hover:underline">
                + Them hang hoa dau tien
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Ma hang</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Ten hang hoa</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">DVT</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Nhom</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => (
                <tr key={h.ma_hang || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{h.ma_hang}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{h.ten_hang}</td>
                  <td className="px-4 py-3 text-gray-500">{h.dvt}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{h.nhom || 'Vat tu'}</span>
                  </td>
                  <td className="px-2 py-3">
                    <button onClick={() => handleDelete(h.ma_hang)}
                      className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">{filtered.length} hang hoa</p>
      )}
    </div>
  )
}
