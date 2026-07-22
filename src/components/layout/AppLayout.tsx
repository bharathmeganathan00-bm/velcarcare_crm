import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { TopHeader } from './TopHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileDrawer } from './MobileDrawer'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-surface-page">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader onMobileMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto px-3 pb-28 pt-4 sm:px-4 sm:pt-5 lg:px-6 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
