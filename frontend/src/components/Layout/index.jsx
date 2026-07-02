import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header notificationCount={5} />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#F8FAFC' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
