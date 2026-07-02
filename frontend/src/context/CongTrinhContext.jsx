import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCongTrinh } from '../api'

const CongTrinhContext = createContext(null)

export function CongTrinhProvider({ children }) {
  const [congTrinhs, setCongTrinhs] = useState([])
  const [selectedCT, setSelectedCT] = useState(null) // null = tất cả

  useEffect(() => {
    getCongTrinh()
      .then(res => setCongTrinhs(res.data?.data || []))
      .catch(() => {})
  }, [])

  return (
    <CongTrinhContext.Provider value={{ congTrinhs, selectedCT, setSelectedCT }}>
      {children}
    </CongTrinhContext.Provider>
  )
}

export function useCongTrinh() {
  const ctx = useContext(CongTrinhContext)
  if (!ctx) return { congTrinhs: [], selectedCT: null, setSelectedCT: () => {} }
  return ctx
}
