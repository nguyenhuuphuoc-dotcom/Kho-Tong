import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const CongTrinhContext = createContext(null)

export function CongTrinhProvider({ children }) {
  const [congTrinhs, setCongTrinhs]   = useState([])
  const [selectedCT, setSelectedCT]   = useState(null)
  const [isAdmin, setIsAdmin]         = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom]       = useState('2025-01-01')
  const [dateTo, setDateTo]           = useState(today)

  const loadCongTrinh = () => {
    api.get('/auth/my-congtrinh')
      .then(res => {
        const list = res.data?.congtrinhs || []
        const admin = res.data?.is_admin || false
        setCongTrinhs(list)
        setIsAdmin(admin)
        // Tự động chọn CT đầu tiên (cả admin lẫn user thường)
        if (list.length > 0) {
          setSelectedCT(list[0])
        }
      })
      .catch(() => {})
  }

  useEffect(() => { loadCongTrinh() }, [])

  return (
    <CongTrinhContext.Provider value={{ congTrinhs, selectedCT, setSelectedCT, isAdmin, loadCongTrinh, dateFrom, dateTo, setDateFrom, setDateTo }}>
      {children}
    </CongTrinhContext.Provider>
  )
}

export function useCongTrinh() {
  const ctx = useContext(CongTrinhContext)
  if (!ctx) return { congTrinhs: [], selectedCT: null, setSelectedCT: () => {}, isAdmin: false }
  return ctx
}
