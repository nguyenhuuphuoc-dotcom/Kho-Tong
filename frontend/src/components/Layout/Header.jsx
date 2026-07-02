import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, HelpCircle, Calendar, Download, ChevronRight, Home, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

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

export default function Header({ notificationCount = 5 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const pageName = routeNames[location.pathname] || 'Trang chu'

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors bg-white">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>01/06/2026 - 30/06/2026</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          <Download className="w-4 h-4" />
          <span>Xuat bao cao</span>
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
