import React, { useState, useEffect } from 'react'
import { Building2, Search, RefreshCw, MapPin, Hash, FileText, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCongTrinh } from '../api'

export default function CongTrinh() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const loadData = () => {
    setLoading(true)
    getCongTrinh()
      .then(res => setData(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const filtered = data.filter(ct =>
    !search ||
    (ct.ten_ct || '').toLowerCase().includes(search.toLowerCase()) ||
    (ct.ma_ct || '').toLowerCase().includes(search.toLowerCase()) ||
    (ct.dia_chi || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">DANH SACH CONG TRINH</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Dang tai...' : `${data.length} cong trinh dang quan ly`}
          </p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Lam moi
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tim cong trinh theo ten, ma, dia chi..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300" />
        </div>
      </div>

      {/* Cards */}
      {loading
        ? <div className="text-center text-gray-400 py-12">Dang tai du lieu...</div>
        : filtered.length === 0
          ? <div className="text-center text-gray-400 py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div>Khong co cong trinh</div>
            </div>
          : <div className="grid grid-cols-1 gap-4">
              {filtered.map((ct, i) => (
                <div key={ct.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-gray-800 text-base">{ct.ten_ct}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Hash className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-mono text-gray-500">{ct.ma_ct}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                          Hoat dong
                        </span>
                        <button
                          onClick={() => navigate(`/ct/${ct.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Vao Kho
                        </button>
                      </div>
                    </div>
                    {ct.dia_chi && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-500">{ct.dia_chi}</span>
                      </div>
                    )}
                    {ct.ghi_chu && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-400 italic">{ct.ghi_chu}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}
