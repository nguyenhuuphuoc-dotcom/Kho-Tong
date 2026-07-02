import React, { useState, useEffect, useRef } from 'react'
import { Upload, Search, RefreshCw, Eye, X, Plus, Trash2, Bot, Loader, FileText } from 'lucide-react'
import { getPhieuList, getChiTietPhieu, createPhieu, docPhieu } from '../api'
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
  return `XK-${ymd}-${String(Math.floor(Math.random()*900)+100)}`
}
const emptyItem = () => ({ ten_hang: '', dvt: 'cai', so_luong: 1, don_gia: 0, thanh_tien: 0 })

export default function PhieuXuat() {
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

  // AI mode
  const [createMode, setCreateMode] = useState('manual') // 'manual' | 'ai'
  const [aiFile, setAiFile] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiDragging, setAiDragging] = useState(false)
  const aiRef = useRef()

  const loadData = () => {
    setLoading(true)
    const params = { loai: 'XK', limit: 500 }
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
    setCreateMode('manual')
    setAiFile(null)
    setAiError('')
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
        loai: 'XK',
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

  const handleAiRead = async () => {
    if (!aiFile) return
    setAiLoading(true)
    setAiError('')
    try {
      const fd = new FormData()
      fd.append('file', aiFile)
      const res = await docPhieu(fd)
      const phieuData = res.data?.phieu || res.data || {}
      const aiItems = phieuData.items || phieuData.hang_hoa || []
      setForm(f => ({
        ...f,
        so_phieu: phieuData.so_phieu || genSoPhieu(),
        ngay: phieuData.ngay || todayStr(),
        doi_tac: phieuData.doi_tac || phieuData.ncc || f.doi_tac,
        ghi_chu: f.ghi_chu,
      }))
      if (aiItems.length > 0) {
        setItems(aiItems.map(it => ({
          ten_hang: it.ten_hang || it.ten || '',
          dvt: it.dvt || 'cai',
          so_luong: it.so_luong || 0,
          don_gia: it.don_gia || 0,
          thanh_tien: it.thanh_tien || (it.so_luong || 0) * (it.don_gia || 0),
        })))
      }
      setCreateMode('manual')
    } catch (e) {
      setAiError(e.response?.data?.detail || 'Loi doc phieu AI. Thu lai.')
    } finally {
      setAiLoading(false)
    }
  }

  const colSpan = isAdminUser ? 7 : 6

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PHIEU XUAT KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isAdminUser ? 'Tat ca phieu xuat kho tu cac cong trinh' : `Cong trinh: ${selectedCT?.ten_ct || '...'}`}
          </p>
          {selectedCT
            ? <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">📌 {selectedCT.ten_ct}</span>
            : <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🏢 Tat ca CT</span>
          }
        </div>
        <div className="flex gap-2">
          {selectedCT && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Tao phieu XK
            </button>
          )}
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Lam moi
          </button>
        </div>
      </div>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim so phieu, nguoi nhan..."
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
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nguoi nhan / Ghi chu</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tong tien</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Chi tiet</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={colSpan} className="py-10 text-center text-gray-400">Dang tai du lieu...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={colSpan} className="py-10 text-center text-gray-400">Khong co phieu xuat kho</td></tr>
                  : filtered.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-orange-700">{p.so_phieu}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.ngay}</td>
                        {isAdminUser && (
                          <td className="px-4 py-3 text-gray-700 text-xs truncate max-w-[160px]">{ctMap[p.cong_trinh_id] || '—'}</td>
                        )}
                        <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[130px]">{p.doi_tac || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-orange-700">{formatVND(p.tong_