import React from 'react'
import { AlertTriangle } from 'lucide-react'

const mockCanhBao = [
  { id: 1, vatTu: 'Thep hop 40x40', ma: 'ST001', congTrinh: 'CT Nha may A', ton: 5, minTon: 20, dvt: 'cay', mucDo: 'cao' },
  { id: 2, vatTu: 'Xi mang PCB40', ma: 'XM004', congTrinh: 'CT Khu dan cu D', ton: 8, minTon: 50, dvt: 'bao', mucDo: 'cao' },
  { id: 3, vatTu: 'Cat xay dung', ma: 'CT005', congTrinh: 'CT Van phong C', ton: 2, minTon: 15, dvt: 'm3', mucDo: 'cao' },
  { id: 4, vatTu: 'Ton lanh 0.45mm', ma: 'TG002', congTrinh: 'CT Kho B', ton: 0, minTon: 10, dvt: 'm2', mucDo: 'nguy_hiem' },
  { id: 5, vatTu: 'Be tong M200', ma: 'BT003', congTrinh: 'CT Truong hoc E', ton: 15, minTon: 30, dvt: 'm3', mucDo: 'trung_binh' },
]

export default function CanhBao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">CANH BAO TON KHO</h1>
        <p className="text-gray-500 mt-1 text-sm">Danh sach vat tu can bo sung theo cong trinh</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Danh sach canh bao ({mockCanhBao.length})</h3>
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">{mockCanhBao.length} muc can xu ly</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-xs">
              <th className="text-left py-3 font-medium">#</th>
              <th className="text-left py-3 font-medium">Ma vat tu</th>
              <th className="text-left py-3 font-medium">Ten vat tu</th>
              <th className="text-left py-3 font-medium">Cong trinh</th>
              <th className="text-right py-3 font-medium">Ton kho</th>
              <th className="text-right py-3 font-medium">Muc toi thieu</th>
              <th className="text-right py-3 font-medium">DVT</th>
              <th className="text-center py-3 font-medium">Muc do</th>
            </tr>
          </thead>
          <tbody>
            {mockCanhBao.map((item, i) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 text-gray-400">{i + 1}</td>
                <td className="py-3 text-blue-500 font-mono text-xs">{item.ma}</td>
                <td className="py-3 text-gray-800 font-medium">{item.vatTu}</td>
                <td className="py-3 text-gray-600">{item.congTrinh}</td>
                <td className="py-3 text-right text-red-600 font-bold">{item.ton}</td>
                <td className="py-3 text-right text-gray-500">{item.minTon}</td>
                <td className="py-3 text-right text-gray-500">{item.dvt}</td>
                <td className="py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.mucDo === 'nguy_hiem' ? 'bg-red-100 text-red-700' :
                    item.mucDo === 'cao' ? 'bg-amber-100 text-amber-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                    {item.mucDo === 'nguy_hiem' ? 'Nguy hiem' : item.mucDo === 'cao' ? 'Cao' : 'Trung binh'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
