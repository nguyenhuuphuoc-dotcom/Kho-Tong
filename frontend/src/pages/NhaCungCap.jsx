import React from 'react'
import { Truck } from 'lucide-react'

export default function NhaCungCap() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">NHA CUNG CAP</h1>
        <p className="text-gray-500 mt-1 text-sm">Quan ly danh sach nha cung cap</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-cyan-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nha cung cap</h3>
        <p className="text-gray-500 text-sm">Trang nay dang duoc phat trien. Vui long quay lai sau.</p>
      </div>
    </div>
  )
}
