import React, { useState, useRef } from 'react'
import { Upload, FileText, Loader, CheckCircle, AlertCircle, Save, X, Bot } from 'lucide-react'
import { docPhieu, createPhieu } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' ty'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}

export default function AIReader() {
  const { congTrinhs, selectedCT } = useCongTrinh()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [savedOk, setSavedOk] = useState(false)
  const [congTrinhId, setCongTrinhId] = useState(selectedCT?.id || '')
  const fileRef = useRef()

  // Drag & drop
  const [dragging, setDragging] = useState(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setResult(null); setError(null); setSavedOk(false) }
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setResult(null); setError(null); setSavedOk(false) }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSavedOk(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await docPhieu(fd)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Co loi khi doc phieu. Vui long thu lai.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result || !congTrinhId) return
    setSaving(true)
    try {
      const phieuData = result.phieu || result
      const items = phieuData.items || phieuData.hang_hoa || []
      const tong_tien = items.reduce((s, it) => s + (it.thanh_tien || (it.so_luong || 0) * (it.don_gia || 0)), 0)
      await createPhieu({
        cong_trinh_id: parseInt(congTrinhId),
        loai: phieuData.loai || 'NK',
        so_phieu: phieuData.so_phieu || `AI-${Date.now()}`,
        ngay: phieuData.ngay || new Date().toISOString().split('T')[0],
        doi_tac: phieuData.doi_tac || phieuData.ncc || '',
        ghi_chu: 'Nhap bang AI Reader',
        tong_tien,
        items: items.map(it => ({
          ten_hang: it.ten_hang || it.ten || '',
          dvt: it.dvt || 'cai',
          so_luong: it.so_luong || 0,
          don_gia: it.don_gia || 0,
          thanh_tien: it.thanh_tien || (it.so_luong || 0) * (it.don_gia || 0),
          ghi_chu: it.ghi_chu || '',
        }))
      })
      setSavedOk(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Loi luu phieu. Vui long thu lai.')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setSavedOk(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const phieuData = result?.phieu || result || {}
  const items = phieuData?.items || phieuData?.hang_hoa || []
  const tong_tien = items.reduce((s, it) => s + (it.thanh_tien || (it.so_luong || 0) * (it.don_gia || 0)), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">AI READER — NHAP LIEU TU DONG</h1>
        <p className="text-gray-500 mt-1 text-sm">Upload anh hoac PDF phieu NK/XK, AI doc va trich xuat thong tin tu dong</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upload card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">1. Upload phieu</h3>

          {/* Chon cong trinh */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Cong trinh *</label>
            <select
              value={congTrinhId}
              onChange={e => setCongTrinhId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 text-gray-700"
            >
              <option value="">-- Chon cong trinh --</option>
              {congTrinhs.map(ct => (
                <option key={ct.id} value={ct.id}>{ct.ten_ct}</option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm">Click hoac keo file vao day</p>
            <p className="text-gray-400 text-xs mt-1">Ho tro: JPG, PNG, PDF</p>
            <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile} />
          </div>

          {/* File info */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-blue-700 truncate flex-1">{file.name}</span>
              <span className="text-xs text-blue-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={reset} className="p-0.5 hover:bg-blue-100 rounded text-blue-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading || !congTrinhId}
            className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> AI dang doc phieu...</>
              : <><Bot className="w-4 h-4" /> Doc phieu bang AI</>
            }
          </button>

          {!congTrinhId && (
            <p className="text-xs text-amber-600 text-center">Vui long chon cong trinh truoc khi doc phieu</p>
          )}
        </div>

        {/* Result card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">2. Ket qua doc phieu</h3>

          {!result && !error && !loading && (
            <div className="flex flex-col items-center justify-center h-56 text-gray-400">
              <Bot className="w-14 h-14 mb-3 text-gray-200" />
              <p className="text-sm">Upload phieu de AI doc tu dong</p>
              <p className="text-xs mt-1 text-gray-300">Ho tro: anh chup, scan PDF</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500">
              <Loader className="w-12 h-12 mb-3 text-blue-400 animate-spin" />
              <p className="text-sm font-medium">AI dang phan tich phieu...</p>
              <p className="text-xs text-gray-400 mt-1">Co the mat 30–60 giay</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Doc phieu that bai</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {savedOk && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Luu phieu thanh cong!</p>
                <p className="text-xs text-green-500 mt-0.5">Phieu da duoc luu vao he thong</p>
              </div>
            </div>
          )}

          {result && !savedOk && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Doc phieu thanh cong!</span>
              </div>

              {/* Info phieu */}
              <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">So phieu:</span>
                  <span className="ml-1 font-semibold text-gray-700">{phieuData.so_phieu || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Ngay:</span>
                  <span className="ml-1 font-semibold text-gray-700">{phieuData.ngay || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Loai:</span>
                  <span className={`ml-1 font-semibold ${(phieuData.loai || 'NK') === 'NK' ? 'text-green-600' : 'text-orange-600'}`}>
                    {(phieuData.loai || 'NK') === 'NK' ? 'Nhap kho' : 'Xuat kho'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">NCC:</span>
                  <span className="ml-1 font-semibold text-gray-700">{phieuData.doi_tac || phieuData.ncc || '—'}</span>
                </div>
              </div>

              {/* Bang hang hoa */}
              {items.length > 0 && (
                <div className="overflow-auto max-h-44 rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-gray-400">#</th>
                        <th className="text-left p-2 text-gray-400">Ten hang</th>
                        <th className="text-right p-2 text-gray-400">SL</th>
                        <th className="text-left p-2 text-gray-400">DVT</th>
                        <th className="text-right p-2 text-gray-400">Don gia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          <td className="p-2 text-gray-400">{i + 1}</td>
                          <td className="p-2 text-gray-700">{it.ten_hang || it.ten}</td>
                          <td className="p-2 text-right text-gray-700">{fmt(it.so_luong)}</td>
                          <td className="p-2 text-gray-400">{it.dvt}</td>
                          <td className="p-2 text-right text-gray-600">{formatVND(it.don_gia)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{items.length} dong hang · Tong: <strong className="text-gray-700">{formatVND(tong_tien)}</strong></span>
                <button
                  onClick={handleSave}
                  disabled={saving || !congTrinhId}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? <><Loader className="w-4 h-4 animate-spin" /> Dang luu...</> : <><Save className="w-4 h-4" /> Xac nhan luu phieu</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Huong dan */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h4 className="font-semibold text-blue-800 mb-3 text-sm">Huong dan su dung AI Reader</h4>
        <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
            <span>Chon cong trinh can nhap phieu vao</span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
            <span>Upload anh chup hoac file PDF phieu nhap / xuat kho</span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
            <span>Kiem tra ket qua AI doc, sau do nhan "Xac nhan luu phieu"</span>
          </div>
        </div>
      </div>
    </div>
  )
}
