import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, HelpCircle, Calendar, Download, ChevronRight, Home, LogOut, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCongTrinh } from '../../context/CongTrinhContext'
import { getPhieuList, getTonKho } from '../../api'
import { exportBaoCaoTongHop, exportPhieuList } from '../../utils/exportExcel'

const routeNames = {
  '/':             'Bao cao tong hop',
  '/phieu-nhap':   'Phieu nhap kho',
  '/phieu-xuat':   'Phieu xuat kho',
  '/ton-kho':      'Ton kho',
  '/danh-muc':     'Vat tu - Hang hoa',
  '/bao-cao':      'Bao cao chi tiet',
  '/cong-trinh':   'Danh sach cong trinh',
  '/nha-cung-cap': 'Nha cung cap',
  '/ai-reader':    'Nhap kho AI',
  '/cai-dat':      'Cau hinh',
  '/canh-bao':     'Canh bao ton kho',
  '/nguoi-dung':   'Nguoi dung',
  '/phan-quyen':   'Phan quyen',
}

const formatVN = (d) => {
  if (!d) return '?'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const PRESETS = [
  { label: 'T10-12/2025', from: '2025-10-01', to: '2025-12-31' },
  { label: 'Nam 2025',    from: '2025-01-01', to: '2025-12-31' },
  { label: 'Nam 2026',    from: '2026-01-01', to: new Date().toISOString().split('T')[0] },
  { label: 'Tat ca',      from: '2025-01-01', to: new Date().toISOString().split('T')[0] },
]

export default function Header({ notificationCount = 5 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dateFrom, dateTo, setDateFrom, setDateTo, selectedCT, congTrinhs } = useCongTrinh()
  const [showMenu, setShowMenu]     = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [tempFrom, setTempFrom]     = useState(dateFrom)
  const [tempTo, setTempTo]         = useState(dateTo)
  const [exporting, setExporting]   = useState(false)

  const pickerRef = useRef(null)
  const pageName  = routeNames[location.pathname] || 'Trang chu'

  // Đóng picker khi click bên ngoài
  useEffect(() => {
    function handleOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const openPicker = () => {
    setTempFrom(dateFrom)
    setTempTo(dateTo)
    setShowPicker(v => !v)
  }

  const applyDate = () => {
    if (tempFrom) setDateFrom(tempFrom)
    if (tempTo)   setDateTo(tempTo)
    setShowPicker(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const exportLabel = location.pathname === '/phieu-nhap'
    ? 'Xuat NK'
    : location.pathname === '/phieu-xuat'
      ? 'Xuat XK'
      : 'Xuat bao cao'

  const handleExport = async () => {
    setExporting(true)
    try {
      const ctId   = selectedCT?.id
      const params = { limit: 2000 }
      if (ctId)     params.cong_trinh_id = ctId
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo

      const path = location.pathname

      if (path === '/phieu-nhap') {
        // Chỉ xuất NK
        const res = await getPhieuList({ ...params, loai: 'NK' })
        await exportPhieuList({
          phieuList: res.data?.data || [],
          loai: 'NK',
          ctName:   selectedCT?.ten_ct || '',
          dateFrom, dateTo, congTrinhs,
        })
      } else if (path === '/phieu-xuat') {
        // Chỉ xuất XK
        const res = await getPhieuList({ ...params, loai: 'XK' })
        await exportPhieuList({
          phieuList: res.data?.data || [],
          loai: 'XK',
          ctName:   selectedCT?.ten_ct || '',
          dateFrom, dateTo, congTrinhs,
        })
      } else {
        // Xuất full báo cáo tổng hợp (NK + XK + Tồn kho)
        const [resNK, resXK, resTK] = await Promise.all([
          getPhieuList({ ...params, loai: 'NK' }),
          getPhieuList({ ...params, loai: 'XK' }),
          getTonKho(ctId ? { cong_trinh_id: ctId } : {}),
        ])
        await exportBaoCaoTongHop({
          nkList:     resNK.data?.data || [],
          xkList:     resXK.data?.data || [],
          tonKhoList: resTK.data?.data || [],
          ctName:     selectedCT?.ten_ct || '',
          dateFrom, dateTo, congTrinhs,
        })
      }
    } catch (e) {
      alert('Loi xuat bao cao: ' + (e.message || 'Thu lai.'))
    } finally {
      setExporting(false)
    }
  }

  const initials = (user?.ten || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between" style={{ minHeight: 64 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Home className="w-4 h-4 text-gray-400" />
        <span className="text-gray-400">Trang chu</span>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-gray-700 font-medium">{pageName}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* ── Date Range Picker ── */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={openPicker}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors bg-white
              ${showPicker
                ? 'border-blue-400 text-blue-600'
                : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="font-medium">{formatVN(dateFrom)}</span>
            <span className="text-gray-400 mx-0.5">–</span>
            <span className="font-medium">{formatVN(dateTo)}</span>
          </button>

          {showPicker && (
            <div
              className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50"
              style={{ width: 280 }}
            >
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Chon khoang thoi gian</span>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tu ngay</label>
                  <input
                    type="date"
                    value={tempFrom}
                    onChange={e => setTempFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Den ngay</label>
                  <input
                    type="date"
                    value={tempTo}
                    onChange={e => setTempTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Quick presets */}
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Chon nhanh</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => { setTempFrom(p.from); setTempTo(p.to) }}
                        className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={applyDate}
                    className="flex-1 bg-blue-500 text-white text-sm py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                  >
                    Ap dung
                  </button>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Huy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60">
          {exporting
            ? <Loader className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />}
          <span>{exporting ? 'Dang xuat...' : exportLabel}</span>
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
              {notificationCount}
            </span>
          )}
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 pl-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-700 leading-tight">{user?.ten || 'Admin'}</div>
              <div className="text-xs text-gray-400 leading-tight capitalize">{user?.role || 'admin'}</div>
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <div className="text-sm font-semibold text-gray-700">{user?.ten}</div>
                  <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Dang xuat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
