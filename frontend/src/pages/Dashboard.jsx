import React, { useState, useEffect } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, registerables } from 'chart.js'

ChartJS.register(...registerables)

import {
  Building2, Download, Upload, Package, DollarSign, AlertTriangle,
  ArrowRight, Database, Smartphone, RefreshCw, Monitor, AlertCircle,
  CheckCircle, RotateCcw, StickyNote, Plus, Trash2, X
} from 'lucide-react'
import { getBaoCaoTongHop, getBieuDo } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'

// ── Màu ghi chú ──────────────────────────────────────────────
const NOTE_COLORS = [
  { key: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', btn: 'bg-yellow-400' },
  { key: 'blue',   bg: 'bg-blue-50',   border: 'border-blue-200',   btn: 'bg-blue-400'   },
  { key: 'green',  bg: 'bg-green-50',  border: 'border-green-200',  btn: 'bg-green-400'  },
  { key: 'pink',   bg: 'bg-pink-50',   border: 'border-pink-200',   btn: 'bg-pink-400'   },
]
const colorMap = Object.fromEntries(NOTE_COLORS.map(c => [c.key, c]))

function GhiChuWidget() {
  const [notes, setNotes] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('khounice_ghi_chu') || '[]') }
    catch { return [] }
  })
  const [draft, setDraft]   = React.useState('')
  const [color, setColor]   = React.useState('yellow')
  const [editId, setEditId] = React.useState(null)
  const [editText, setEditText] = React.useState('')

  const save = (next) => {
    setNotes(next)
    localStorage.setItem('khounice_ghi_chu', JSON.stringify(next))
  }

  const addNote = () => {
    if (!draft.trim()) return
    save([{ id: Date.now(), noi_dung: draft.trim(), mau: color, created_at: new Date().toLocaleString('vi-VN') }, ...notes])
    setDraft('')
  }

  const deleteNote = (id) => save(notes.filter(n => n.id !== id))

  const startEdit = (n) => { setEditId(n.id); setEditText(n.noi_dung) }
  const saveEdit  = (id) => {
    save(notes.map(n => n.id === id ? { ...n, noi_dung: editText } : n))
    setEditId(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-gray-800">Ghi chu cong viec</h3>
        <span className="ml-auto text-xs text-gray-400">{notes.length} ghi chu</span>
      </div>

      {/* Input thêm mới */}
      <div className="flex gap-2 mb-4">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addNote() }}
          placeholder="Nhap ghi chu... (Ctrl+Enter de luu)"
          rows={2}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-300 resize-none"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {NOTE_COLORS.map(c => (
              <button key={c.key} onClick={() => setColor(c.key)}
                className={`w-5 h-5 rounded-full ${c.btn} transition-transform ${color === c.key ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`} />
            ))}
          </div>
          <button onClick={addNote} disabled={!draft.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors">
            <Plus className="w-3 h-3" /> Them
          </button>
        </div>
      </div>

      {/* Danh sách ghi chú */}
      {notes.length === 0
        ? <div className="text-center text-gray-300 py-6 text-sm">Chua co ghi chu nao</div>
        : <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {notes.map(n => {
              const c = colorMap[n.mau] || colorMap.yellow
              return (
                <div key={n.id} className={`rounded-xl border p-3 text-sm ${c.bg} ${c.border} relative group`}>
                  {editId === n.id
                    ? <div className="space-y-1.5">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          autoFocus
                          rows={3}
                          className="w-full bg-transparent border-none outline-none text-gray-800 text-sm resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">Huy</button>
                          <button onClick={() => saveEdit(n.id)} className="text-xs text-blue-600 font-medium hover:text-blue-800">Luu</button>
                        </div>
                      </div>
                    : <>
                        <p className="text-gray-800 whitespace-pre-wrap cursor-pointer leading-relaxed"
                          onClick={() => startEdit(n)}>{n.noi_dung}</p>
                        <p className="text-xs text-gray-400 mt-1.5">{n.created_at}</p>
                        <button onClick={() => deleteNote(n.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded-full text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                  }
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')

function formatVND(n) {
  const num = n ?? 0
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' ty'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr'
  return num.toLocaleString('vi-VN')
}

function KPICard({ icon: Icon, iconBg, title, value, subtitle, valueColor, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 flex-1 min-w-0">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500 truncate">{title}</div>
        {loading
          ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
          : <div className={`text-2xl font-bold leading-tight ${valueColor || 'text-gray-800'}`}>{value}</div>
        }
        <div className="text-xs text-gray-400 truncate">{subtitle}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { selectedCT, dateFrom, dateTo } = useCongTrinh()
  const [chartMode, setChartMode] = useState('month')
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState(null)
  const [topVatTu, setTopVatTu] = useState([])
  const [bangCT, setBangCT] = useState([])
  const [canhBao, setCanhBao] = useState([])
  const [bieuDoData, setBieuDoData] = useState([])

  const loadData = () => {
    setLoading(true)
    const ctParam = selectedCT ? { cong_trinh_id: selectedCT.id } : {}
    const dateParam = { date_from: dateFrom, date_to: dateTo }
    Promise.all([
      getBaoCaoTongHop({ ...ctParam, ...dateParam }),
      getBieuDo({ period: chartMode, from_date: dateFrom, to_date: dateTo, ...ctParam })
    ])
      .then(([bcRes, bdRes]) => {
        const bc = bcRes.data || {}
        setKpi(bc.kpi || {})
        setTopVatTu(bc.top_vat_tu_xk || [])
        setBangCT(bc.bang_cong_trinh || [])
        setCanhBao(bc.canh_bao_ton_thap || [])
        setBieuDoData(bdRes.data?.data || [])
      })
      .catch(err => console.error('Load data error:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [chartMode, selectedCT, dateFrom, dateTo])

  const phieuNhap = kpi?.so_phieu_nk || 0
  const phieuXuat = kpi?.so_phieu_xk || 0
  const tongPhieu = phieuNhap + phieuXuat

  const barChartData = {
    labels: bieuDoData.length ? bieuDoData.map(d => d.period) : ['Chua co du lieu'],
    datasets: [
      {
        type: 'bar',
        label: 'Nhap',
        data: bieuDoData.map(d => d.tong_nk),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        type: 'bar',
        label: 'Xuat',
        data: bieuDoData.map(d => d.tong_xk),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 4,
        yAxisID: 'y',
      },
    ]
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, padding: 10 } },
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left', grid: { color: '#f1f5f9' }, beginAtZero: true },
    }
  }

  const donutData = {
    labels: ['Nhap kho', 'Xuat kho'],
    datasets: [{
      data: [phieuNhap || 1, phieuXuat || 1],
      backgroundColor: ['rgba(34, 197, 94, 0.85)', 'rgba(249, 115, 22, 0.85)'],
      borderColor: ['#22c55e', '#f97316'],
      borderWidth: 2,
      hoverOffset: 4,
    }]
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
    }
  }

  const tongCT = bangCT.reduce((a, c) => ({
    so_phieu_nk: a.so_phieu_nk + (c.so_phieu_nk || 0),
    so_phieu_xk: a.so_phieu_xk + (c.so_phieu_xk || 0),
    tong_tien_nk: a.tong_tien_nk + (c.tong_tien_nk || 0),
    tong_tien_xk: a.tong_tien_xk + (c.tong_tien_xk || 0),
  }), { so_phieu_nk: 0, so_phieu_xk: 0, tong_tien_nk: 0, tong_tien_xk: 0 })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">BAO CAO TONG HOP</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">Theo doi hoat dong nhap - xuat - ton kho</p>
            {selectedCT
              ? <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">📌 {selectedCT.ten_ct}</span>
              : <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">🏢 Tat ca cong trinh</span>
            }
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Lam moi
        </button>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-4">
        <KPICard loading={loading} icon={Building2} iconBg="bg-blue-500" title="Tong cong trinh" value={kpi?.so_cong_trinh ?? '—'} subtitle="Dang hoat dong" />
        <KPICard loading={loading} icon={Download} iconBg="bg-green-500" title="Phieu nhap" value={kpi?.so_phieu_nk ?? '—'} subtitle="Tong so phieu" />
        <KPICard loading={loading} icon={Upload} iconBg="bg-orange-500" title="Phieu xuat" value={kpi?.so_phieu_xk ?? '—'} subtitle="Tong so phieu" />
        <KPICard loading={loading} icon={Package} iconBg="bg-purple-500" title="Mat hang quan ly" value={fmt(kpi?.so_mat_hang)} subtitle="Ma hang hoa" />
        <KPICard loading={loading} icon={DollarSign} iconBg="bg-teal-500" title="Tong tien nhap" value={formatVND(kpi?.tong_tien_nk)} subtitle="Gia tri phieu NK" />
        <KPICard loading={loading} icon={AlertTriangle} iconBg="bg-red-500" title="Canh bao het hang" value={kpi?.so_canh_bao ?? '—'} subtitle="Can kiem tra" valueColor="text-red-600" />
      </div>

      {/* Row 2: Chart + Donut + Top Vat tu */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '5fr 3fr 4fr' }}>
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Bieu do Nhap - Xuat</h3>
            <select
              value={chartMode}
              onChange={e => setChartMode(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-blue-300"
            >
              <option value="day">Theo ngay</option>
              <option value="month">Theo thang</option>
            </select>
          </div>
          <div style={{ height: 220 }}>
            {loading
              ? <div className="h-full flex items-center justify-center text-gray-400 text-sm">Dang tai...</div>
              : <Bar data={barChartData} options={barChartOptions} />
            }
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Ty le nhap xuat</h3>
          <div style={{ height: 200 }} className="relative">
            {loading
              ? <div className="h-full flex items-center justify-center text-gray-400 text-sm">Dang tai...</div>
              : <>
                  <Doughnut data={donutData} options={donutOptions} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10px' }}>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-800">{fmt(tongPhieu)}</div>
                      <div className="text-xs text-gray-400">Tong phieu</div>
                    </div>
                  </div>
                </>
            }
          </div>
        </div>

        {/* Top Vat tu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Vat tu xuat nhieu nhat</h3>
          {loading
            ? <div className="text-gray-400 text-sm text-center py-4">Dang tai...</div>
            : topVatTu.length === 0
              ? <div className="text-gray-400 text-sm text-center py-4">Chua co du lieu</div>
              : <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-400 font-medium w-6">#</th>
                      <th className="text-left py-2 text-gray-400 font-medium">Ten hang</th>
                      <th className="text-right py-2 text-gray-400 font-medium">SL</th>
                      <th className="text-right py-2 text-gray-400 font-medium">Tien</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVatTu.slice(0, 8).map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 text-gray-700 truncate max-w-[90px]" title={item.ten_hang}>{item.ten_hang}</td>
                        <td className="py-2 text-right font-semibold text-gray-800">{fmt(item.so_luong)}</td>
                        <td className="py-2 text-right text-gray-500">{formatVND(item.thanh_tien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          }
        </div>
      </div>

      {/* Row 3: Tong hop cong trinh + Canh bao */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tong hop theo cong trinh */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Tong hop theo cong trinh</h3>
          {loading
            ? <div className="text-gray-400 text-sm text-center py-4">Dang tai...</div>
            : <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="text-left py-2 font-medium">#</th>
                      <th className="text-left py-2 font-medium">Cong trinh</th>
                      <th className="text-right py-2 font-medium">P.Nhap</th>
                      <th className="text-right py-2 font-medium">Tien NK</th>
                      <th className="text-right py-2 font-medium">P.Xuat</th>
                      <th className="text-right py-2 font-medium">Tien XK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bangCT.length === 0
                      ? <tr><td colSpan={6} className="py-4 text-center text-gray-400">Chua co du lieu</td></tr>
                      : bangCT.map((ct, i) => (
                          <tr key={ct.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 text-gray-400">{i + 1}</td>
                            <td className="py-2 text-gray-700 truncate max-w-[120px]" title={ct.ten_ct}>{ct.ten_ct}</td>
                            <td className="py-2 text-right text-green-600">{ct.so_phieu_nk || 0}</td>
                            <td className="py-2 text-right text-gray-700">{formatVND(ct.tong_tien_nk)}</td>
                            <td className="py-2 text-right text-orange-600">{ct.so_phieu_xk || 0}</td>
                            <td className="py-2 text-right text-gray-700">{formatVND(ct.tong_tien_xk)}</td>
                          </tr>
                        ))
                    }
                    {bangCT.length > 0 && (
                      <tr className="border-t-2 border-gray-200 font-bold bg-gray-50">
                        <td className="py-2 text-gray-600" colSpan={2}>Tong cong</td>
                        <td className="py-2 text-right text-green-700">{tongCT.so_phieu_nk}</td>
                        <td className="py-2 text-right text-gray-800">{formatVND(tongCT.tong_tien_nk)}</td>
                        <td className="py-2 text-right text-orange-700">{tongCT.so_phieu_xk}</td>
                        <td className="py-2 text-right text-gray-800">{formatVND(tongCT.tong_tien_xk)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* Canh bao ton kho */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Canh bao het hang</h3>
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {canhBao.length} canh bao
            </span>
          </div>
          {loading
            ? <div className="text-gray-400 text-sm text-center py-4">Dang tai...</div>
            : canhBao.length === 0
              ? <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <CheckCircle className="w-10 h-10 text-green-400 mb-2" />
                  <span className="text-sm">Khong co canh bao ton kho</span>
                </div>
              : <div className="space-y-2 max-h-64 overflow-y-auto">
                  {canhBao.map((cb, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{cb.ten_hang}</div>
                        {cb.ma_ct && <div className="text-xs text-gray-500">{cb.ma_ct}</div>}
                        <div className="text-xs text-red-600 font-medium mt-0.5">
                          Ton kho: {fmt(cb.ton_cuoi)} {cb.dvt || ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>

      {/* Ghi chú công việc */}
      <GhiChuWidget />

      {/* Flow Diagram */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Luong du lieu he thong</h3>
        <div className="flex items-stretch gap-2">
          {[
            { icon: Smartphone, color: 'bg-blue-500', label: 'APP CON', items: [`${kpi?.so_cong_trinh || 0} app cong trinh`, 'Nhap / xuat kho', 'Offline capable'] },
            { icon: RefreshCw, color: 'bg-green-500', label: 'DONG BO', items: ['Auto sync Supabase', 'Real-time update', 'Delta sync'] },
            { icon: Database, color: 'bg-purple-500', label: 'DATABASE TONG', items: ['Supabase PostgreSQL', 'Real-time', 'Backup tu dong'] },
            { icon: Monitor, color: 'bg-orange-500', label: 'WEB APP', items: ['Dashboard', 'Bao cao', 'Quan tri'] },
          ].map((node, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex-1 border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center gap-2">
                <div className={`w-10 h-10 rounded-xl ${node.color} flex items-center justify-center`}>
                  <node.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-bold text-gray-700">{node.label}</div>
                <ul className="text-xs text-gray-500 space-y-0.5 text-left w-full">
                  {node.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-1">
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {i < arr.length - 1 && (
                <div className="flex items-center">
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
