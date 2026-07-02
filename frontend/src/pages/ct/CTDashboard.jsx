import React, { useState, useEffect } from 'react'
import { useOutletContext, Link, useParams } from 'react-router-dom'
import { Download, Upload, Package, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'
import { getPhieuList, getTonKho } from '../../api'

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' ty'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}

export default function CTDashboard() {
  const { ctId } = useOutletContext() || {}
  const { id } = useParams()
  const realId = ctId || id

  const [phieuNK, setPhieuNK] = useState([])
  const [phieuXK, setPhieuXK] = useState([])
  const [tonKho, setTonKho] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    if (!realId) return
    setLoading(true)
    Promise.all([
      getPhieuList({ loai: 'NK', cong_trinh_id: realId, limit: 200 }),
      getPhieuList({ loai: 'XK', cong_trinh_id: realId, limit: 200 }),
      getTonKho({ cong_trinh_id: realId }),
    ])
      .then(([nkRes, xkRes, tkRes]) => {
        setPhieuNK(nkRes.data?.data || [])
        setPhieuXK(xkRes.data?.data || [])
        setTonKho(tkRes.data?.data || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [realId])

  const tongTienNK = phieuNK.reduce((s, p) => s + (p.tong_tien || 0), 0)
  const tongTienXK = phieuXK.reduce((s, p) => s + (p.tong_tien || 0), 0)
  const hetHang = tonKho.filter(r => (r.ton_cuoi ?? 0) <= 0)
  const conHang = tonKho.filter(r => (r.ton_cuoi ?? 0) > 0)

  // 5 phiếu gần nhất
  const recentNK = [...phieuNK].sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '')).slice(0, 5)
  const recentXK = [...phieuXK].sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '')).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TONG QUAN KHO</h1>
          <p className="text-gray-500 mt-1 text-sm">Thong ke nhap xuat ton kho cua cong trinh nay</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-sm font-medium disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Lam moi
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Download, bg: 'bg-green-500', label: 'So phieu NK', value: loading ? '...' : phieuNK.length, sub: formatVND(tongTienNK) },
          { icon: Upload,   bg: 'bg-orange-500', label: 'So phieu XK', value: loading ? '...' : phieuXK.length, sub: formatVND(tongTienXK) },
          { icon: Package,  bg: 'bg-purple-500', label: 'Mat hang con hang', value: loading ? '...' : conHang.length, sub: `/ ${tonKho.length} mat hang` },
          { icon: AlertCircle, bg: 'bg-red-500', label: 'Het hang', value: loading ? '...' : hetHang.length, sub: 'Can nhap them', color: 'text-red-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{kpi.label}</div>
              <div className={`text-xl font-bold ${kpi.color || 'text-gray-800'}`}>{kpi.value}</div>
              <div className="text-xs text-gray-400">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent phieu */}
      <div className="grid grid-cols-2 gap-4">
        {/* NK */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Phieu nhap gan nhat</h3>
            <Link to={`/ct/${realId}/nhap-kho`} className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              Xem tat ca <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading
            ? <div className="text-gray-400 text-sm text-center py-4">Dang tai...</div>
            : recentNK.length === 0
              ? <div className="text-gray-400 text-sm text-center py-4">Chua co phieu nhap</div>
              : <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left py-1.5 font-medium">So phieu</th>
                    <th className="text-left py-1.5 font-medium">Ngay</th>
                    <th className="text-right py-1.5 font-medium">Tong tien</th>
                  </tr></thead>
                  <tbody>
                    {recentNK.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 font-mono text-green-700 font-medium">{p.so_phieu}</td>
                        <td className="py-1.5 text-gray-500">{p.ngay}</td>
                        <td className="py-1.5 text-right text-gray-700">{formatVND(p.tong_tien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          }
        </div>

        {/* XK */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Phieu xuat gan nhat</h3>
            <Link to={`/ct/${realId}/xuat-kho`} className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              Xem tat ca <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading
            ? <div className="text-gray-400 text-sm text-center py-4">Dang tai...</div>
            : recentXK.length === 0
              ? <div className="text-gray-400 text-sm text-center py-4">Chua co phieu xuat</div>
              : <table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left py-1.5 font-medium">So phieu</th>
                    <th className="text-left py-1.5 font-medium">Ngay</th>
                    <th className="text-right py-1.5 font-medium">Tong tien</th>
                  </tr></thead>
                  <tbody>
                    {recentXK.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 font-mono text-orange-700 font-medium">{p.so_phieu}</td>
                        <td className="py-1.5 text-gray-500">{p.ngay}</td>
                        <td className="py-1.5 text-right text-gray-700">{formatVND(p.tong_tien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          }
        </div>
      </div>

      {/* Het hang canh bao */}
      {!loading && hetHang.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-red-700">{hetHang.length} mat hang het hang — can nhap them</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {hetHang.slice(0, 9).map((r, i) => (
              <div key={i} className="bg-red-50 rounded-lg px-3 py-2 text-xs">
                <div className="font-medium text-gray-800 truncate">{r.ten_hang}</div>
                <div className="text-red-600 font-semibold">Ton: {fmt(r.ton_cuoi)} {r.dvt}</div>
              </div>
            ))}
          </div>
          {hetHang.length > 9 && (
            <Link to={`/ct/${realId}/ton-kho`} className="mt-3 text-xs text-teal-600 hover:underline block text-center">
              Xem them {hetHang.length - 9} mat hang khac...
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
