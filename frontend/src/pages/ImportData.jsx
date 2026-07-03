import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader, AlertTriangle, RotateCcw } from 'lucide-react'
import { api } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'
import { useAuth } from '../context/AuthContext'

const STEPS = ['upload', 'preview', 'importing', 'done']

export default function ImportData() {
  const { congTrinhs, selectedCT } = useCongTrinh()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [step, setStep] = useState('upload')
  const [file, setFile] = useState(null)
  const [ctId, setCtId] = useState(selectedCT?.id || '')
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const ctName = congTrinhs.find(c => c.id === Number(ctId))?.ten_ct || ''

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setError('Chỉ hỗ trợ file .xlsx hoặc .xls')
      return
    }
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handlePreview = async () => {
    if (!file) { setError('Chưa chọn file'); return }
    if (!ctId) { setError('Chưa chọn công trình'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('cong_trinh_id', ctId)
      const res = await api.post('/import/preview/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      setPreview(res.data)
      setStep('preview')
    } catch (e) {
      setError(e.response?.data?.detail || 'Lỗi đọc file. Kiểm tra lại sheet QLTK.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setStep('importing')
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('cong_trinh_id', ctId)
      const res = await api.post('/import/execute/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      })
      setResult(res.data)
      setStep('done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Lỗi import. Thử lại.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  if (!isAdmin) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">INPUT DU LIEU</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">
        Chi admin moi truy cap duoc trang nay.
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">INPUT DU LIEU</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Import hang loat tu file Excel (sheet QLTK) vao he thong
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { key: 'upload',    label: '1. Chon file' },
          { key: 'preview',   label: '2. Kiem tra' },
          { key: 'importing', label: '3. Dang import' },
          { key: 'done',      label: '4. Hoan tat' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.key}>
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              step === s.key
                ? 'bg-blue-500 text-white'
                : STEPS.indexOf(step) > i
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {STEPS.indexOf(step) > i ? '✓ ' : ''}{s.label}
            </div>
            {i < arr.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          {/* Chọn công trình */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cong trinh dich <span className="text-red-500">*</span>
            </label>
            <select
              value={ctId}
              onChange={e => setCtId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Chon cong trinh --</option>
              {congTrinhs.map(ct => (
                <option key={ct.id} value={ct.id}>{ct.ten_ct}</option>
              ))}
            </select>
          </div>

          {/* Upload zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              File Excel (sheet QLTK) <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-blue-400 bg-blue-50'
                  : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              {file ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB — Click de doi file</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-gray-500 font-medium">Keo tha file vao day hoac click de chon</p>
                  <p className="text-xs text-gray-400">Ho tro: .xlsx, .xls — Sheet phai co ten <strong>QLTK</strong></p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          {/* Hướng dẫn */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 space-y-1">
            <p className="font-semibold">⚠ Luu y truoc khi import:</p>
            <p>• File phai co sheet ten chinh xac la <strong>QLTK</strong></p>
            <p>• Cot A:B = Danh muc, Cot H:L = Nhap kho, Cot N:R = Xuat kho</p>
            <p>• Du lieu cu cua cong trinh se KHONG bi xoa, chi them moi</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={loading || !file || !ctId}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Dang doc file...</> : 'Kiem tra truoc khi import →'}
          </button>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && preview && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Ket qua doc file</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Cong trinh: <span className="font-medium text-teal-600">{ctName}</span>
              {' · '}File: <span className="font-medium">{file?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{preview.hang_hoa.toLocaleString()}</div>
              <div className="text-sm text-indigo-500 mt-1">Mat hang (danh muc)</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{preview.phieu_nk.toLocaleString()}</div>
              <div className="text-sm text-green-500 mt-1">Phieu Nhap kho</div>
              <div className="text-xs text-gray-400 mt-0.5">{preview.dong_nk.toLocaleString()} dong hang</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{preview.phieu_xk.toLocaleString()}</div>
              <div className="text-sm text-orange-500 mt-1">Phieu Xuat kho</div>
              <div className="text-xs text-gray-400 mt-0.5">{preview.dong_xk.toLocaleString()} dong hang</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" />
            Qua trinh import co the mat <strong>5–15 phut</strong> tuy theo kich thuoc file.
            Khong dong tab nay trong khi import.
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Chon lai file
            </button>
            <button onClick={handleImport}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Xac nhan Import
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center space-y-4">
          <Loader className="w-14 h-14 text-blue-500 animate-spin mx-auto" />
          <p className="text-lg font-semibold text-gray-700">Dang import du lieu...</p>
          <p className="text-sm text-gray-400">
            Vui long cho, khong dong tab nay.<br />
            Co the mat 5–15 phut.
          </p>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div className="text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800">Import hoan tat!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cong trinh: <span className="font-medium text-teal-600">{ctName}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{result.hang_hoa?.thanh_cong}</div>
              <div className="text-xs text-indigo-500 mt-1">Mat hang them moi</div>
              {result.hang_hoa?.loi > 0 && (
                <div className="text-xs text-red-400">{result.hang_hoa.loi} loi</div>
              )}
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{result.nhap_kho?.thanh_cong}</div>
              <div className="text-xs text-green-500 mt-1">Phieu Nhap kho</div>
              {result.nhap_kho?.loi > 0 && (
                <div className="text-xs text-red-400">{result.nhap_kho.loi} loi</div>
              )}
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{result.xuat_kho?.thanh_cong}</div>
              <div className="text-xs text-orange-500 mt-1">Phieu Xuat kho</div>
              {result.xuat_kho?.loi > 0 && (
                <div className="text-xs text-red-400">{result.xuat_kho.loi} loi</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Import file khac
            </button>
            <a href="/"
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 flex items-center justify-center gap-2 text-center">
              Xem Bao cao tong hop →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
