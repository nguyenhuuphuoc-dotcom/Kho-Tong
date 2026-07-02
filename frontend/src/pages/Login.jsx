import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Vui long nhap day du email va mat khau'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Dang nhap that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo + tiêu đề */}
        <div className="text-center mb-8">
          <img src="/logo-hpcons.png" alt="HP Cons" className="h-16 w-auto object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">HPCons AppTong</h1>
          <p className="text-gray-400 text-sm mt-1">He thong quan ly kho v2.0</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Dang nhap</h2>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@hpcons.com.vn"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Mat khau */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Mat khau</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader className="w-4 h-4 animate-spin" /> Dang dang nhap...</>
                : 'Dang nhap'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">© 2026 HP Construction Viet Nam</p>
      </div>
    </div>
  )
}
