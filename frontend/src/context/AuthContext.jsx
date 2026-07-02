import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'hpcons_token'
const USER_KEY  = 'hpcons_user'

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token, setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(true)

  // Gắn Bearer token vào mọi request
  useEffect(() => {
    const id = api.interceptors.request.use(cfg => {
      const t = localStorage.getItem(TOKEN_KEY)
      if (t) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${t}` }
      return cfg
    })
    return () => api.interceptors.request.eject(id)
  }, [])

  // Verify token khi khởi động
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) { setLoading(false); return }
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: u } = res.data
    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(access_token)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
