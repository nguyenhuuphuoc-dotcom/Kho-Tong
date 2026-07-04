import React, { useState, useEffect } from 'react'
import { Shield, RefreshCw, CheckCircle, XCircle, Save, X } from 'lucide-react'
import { api } from '../api'
import { useCongTrinh } from '../context/CongTrinhContext'
import { useAuth } from '../context/AuthContext'

export default function PhanQuyen() {
  const { user: currentUser } = useAuth()
  const { congTrinhs } = useCongTrinh()
  const [users, setUsers]   = useState([])
  const [perms, setPerms]   = useState({})   // { userId: Set<congTrinhId> }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  const isAdmin = currentUser?.role === 'admin'

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, permsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/auth/permissions'),
      ])
      const userList = usersRes.data?.users || []
      setUsers(userList)

      // Build perms map: { userId: Set<ctId> }
      const permList = permsRes.data?.permissions || []
      const map = {}
      userList.forEach(u => { map[u.id] = new Set() })
      permList.forEach(p => {
        if (map[p.user_id]) map[p.user_id].add(p.cong_trinh_id)
      })
      setPerms(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const togglePerm = (userId, ctId) => {
    if (!isAdmin) return
    setPerms(prev => {
      const next = { ...prev, [userId]: new Set(prev[userId] || []) }
      if (next[userId].has(ctId)) next[userId].delete(ctId)
      else next[userId].add(ctId)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      // Build danh sách permission mới
      const permList = []
      Object.entries(perms).forEach(([userId, ctSet]) => {
        ctSet.forEach(ctId => permList.push({ user_id: parseInt(userId), cong_trinh_id: ctId }))
      })
      await api.post('/auth/permissions', { permissions: permList })
      setMsg({ type: 'ok', text: 'Lưu phân quyền thành công!' })
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.detail || 'Lỗi lưu phân quyền' })
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PHÂN QUYỀN</h1>
          <p className="text-gray-500 mt-1 text-sm">Quản lý quyền truy cập của từng tài khoản</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <div className="text-gray-500 font-medium">Chỉ admin mới truy cập được trang này</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PHÂN QUYỀN CÔNG TRÌNH</h1>
          <p className="text-gray-500 mt-1 text-sm">Chọn công trình mà từng người dùng được truy cập</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading}
            className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
          msg.type === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Hướng dẫn */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-sm text-blue-700">
        <strong>Cách dùng:</strong> Tick ô tích tương ứng giữa Người dùng và Công trình để cấp quyền xem.
        Admin luôn có quyền xem tất cả. Nhấn "Lưu phân quyền" để lưu thay đổi.
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">Đang tải...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">
          Chưa có tài khoản nào. Tạo tài khoản trước trong trang Người dùng.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-48">Người dùng</th>
                {congTrinhs.map(ct => (
                  <th key={ct.id} className="text-center px-3 py-3 text-gray-500 font-medium text-xs max-w-[120px]">
                    <div className="truncate" title={ct.ten_ct}>{ct.ten_ct}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const userPerms = perms[u.id] || new Set()
                const isCurrentAdmin = u.role === 'admin'

                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 text-sm">{u.ten}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                      {isCurrentAdmin && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">ADMIN</span>
                      )}
                    </td>
                    {congTrinhs.map(ct => (
                      <td key={ct.id} className="text-center px-3 py-3">
                        <input type="checkbox"
                          checked={isCurrentAdmin || userPerms.has(ct.id)}
                          disabled={isCurrentAdmin}
                          onChange={() => togglePerm(u.id, ct.id)}
                          className="w-4 h-4 accent-teal-500 cursor-pointer disabled:cursor-default"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
