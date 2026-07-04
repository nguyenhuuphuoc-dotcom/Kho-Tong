import React, { useState, useRef } from 'react'
import { useOutletContext, useParams, useNavigate } from 'react-router-dom'
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle,
  Loader, AlertTriangle, RotateCcw, Package
} from 'lucide-react'
import { api } from '../../api'

const STEPS = ['upload', 'preview', 'importing', 'done']

export default function CTImportData() {
  const { congTrinh, ctId } = useOutletContext() || {}
  const { id } = useParams()
  const navigate = useNavigate()
  const realId = ctId || id

  const [step, setStep]       = useState('upload')
  const [file, setFile]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setError('Chỉ hỗ trợ file .xlsx hoặc .xls')
      return
    }
    setFile(f); setError('')
  }

  const handlePreview = async () => {
    if (!file) { setError('Chưa chọn file'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('cong_trinh_id', realId)
      const res = await api.post('/import/preview/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
      })
      setPreview(res.data); setStep('preview')
    } catch (e) {
      setError(e.response?.data?.detail || 'Lỗi đọc file. Kiểm tra lại sheet QLTK.')
    } finally { setLoading(false) }
  }

  const handleImport = async () => {
    setStep('importing'); setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('cong_trinh_id', realId)
      const res = await api.post('/import/execute/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 600000,
      })
      setResult(res.data); setStep('done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Lỗi import. Thử lại.')
      setStep('preview')
    } finally { setLoading(false) }
  }

  const reset = () => {
    setStep('upload'); setFile(null); setPreview(null); setResult(null); setError('')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">IMPORT DỮ LIỆU</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Import hàng loạt từ file Excel (sheet QLTK) vào công trình{' '}
          <span className="font-semibold text-teal-600">{congTrinh?.ten_ct || `#${realId}`}</span>.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { key: 'upload',    label: '1. Chọn file' },
          { key: 'preview',   label: '2. Kiểm tra' },
          { key: 'importing', label: '3. Đang import' },
          { key: 'done',      label: '4. Hoàn tất' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.key}>
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              step === s.key
                ? 'bg-teal-500 text-white'
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File Excel (sheet QLTK) <span className="text-red-500">*</span></label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragging ? 'border-teal-400 bg-teal-50'
                : file   ? 'border-green-400 bg-green-50'
                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              {file ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB — Click để đổi file</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-gray-500 font-medium">Kéo thả file vào đây hoặc click để chọn</p>
                  <p className="text-xs text-gray-400">Hỗ trợ: .xlsx, .xls — Sheet phải có tên <strong>QLTK</strong></p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 space-y-1">
            <p className="font-semibold">⚠ Lưu ý trước khi import:</p>
            <p>• File phải có sheet tên chính xác là <strong>QLTK</strong></p>
            <p>• Cột A:B = Danh mục, Cột H:L = Nhập kho, Cột N:R = Xuất kho</p>
            <p>• Dữ liệu cũ của công trình sẽ KHÔNG bị xóa, chỉ thêm mới</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={loading || !file}
            className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Đang đọc file...</>
              : 'Kiểm tra trước khi import →'}
          </button>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && preview && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Kết quả đọc file</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              File: <span className="font-medium">{file?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{preview.hang_hoa?.toLocaleString()}</div>
              <div className="text-sm text-indigo-500 mt-1">Mặt hàng (danh mục)</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{preview.phieu_nk?.toLocaleString()}</div>
              <div className="text-sm text-green-500 mt-1">Phiếu Nhập kho</div>
              <div className="text-xs text-gray-400 mt-0.5">{preview.dong_nk?.toLocaleString()} dòng hàng</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{preview.phieu_xk?.toLocaleString()}</div>
              <div className="text-sm text-orange-500 mt-1">Phiếu Xuất kho</div>
              <div className="text-xs text-gray-400 mt-0.5">{preview.dong_xk?.toLocaleString()} dòng hàng</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" />
            Quá trình import có thể mất <strong>5–15 phút</strong> tùy theo kích thước file.
            Không đóng tab này trong khi import.
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Chọn lại file
            </button>
            <button onClick={handleImport}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Xác nhận Import
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center space-y-4">
          <Loader className="w-14 h-14 text-teal-500 animate-spin mx-auto" />
          <p className="text-lg font-semibold text-gray-700">Đang import dữ liệu...</p>
          <p className="text-sm text-gray-400">
            Vui lòng chờ, không đóng tab này.<br />
            Có thể mất 5–15 phút.
          </p>
        </div>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div className="text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800">Import hoàn tất!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Công trình: <span className="font-medium text-teal-600">{congTrinh?.ten_ct}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{result.hang_hoa?.thanh_cong}</div>
              <div className="text-xs text-indigo-500 mt-1">Mặt hàng thêm mới</div>
              {result.hang_hoa?.loi > 0 && <div className="text-xs text-red-400">{result.hang_hoa.loi} lỗi</div>}
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{result.nhap_kho?.thanh_cong}</div>
              <div className="text-xs text-green-500 mt-1">Phiếu Nhập kho</div>
              {result.nhap_kho?.loi > 0 && <div className="text-xs text-red-400">{result.nhap_kho.loi} lỗi</div>}
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{result.xuat_kho?.thanh_cong}</div>
              <div className="text-xs text-orange-500 mt-1">Phiếu Xuất kho</div>
              {result.xuat_kho?.loi > 0 && <div className="text-xs text-red-400">{result.xuat_kho.loi} lỗi</div>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Import file khác
            </button>
            <button onClick={() => navigate(`/ct/${realId}/ton-kho`)}
              className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold text-sm hover:bg-teal-600 flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Xem Tồn kho →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
