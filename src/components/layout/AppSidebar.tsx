import { NavLink } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { NAV_ITEMS } from '@/config/nav'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { user, can, isManager } = useAuth()

  const items = NAV_ITEMS.filter((item) => {
    if (item.managerOnly) return isManager
    if (item.module) return can(item.module, 'view')
    return true
  })

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-brand-charcoal text-slate-300 transition-all duration-300 shrink-0',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        {!collapsed ? (
          <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5">
            <Logo variant="mark" className="h-7" />
          </div>
        ) : (
          <div className="mx-auto rounded-lg bg-white p-1">
            <img src="/logo.svg" alt="VCC" className="h-7 w-7 object-contain" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition',
            collapsed && 'hidden',
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-white/5 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">{user?.name}</p>
          <p className="capitalize">{user?.role} · {user?.staff_id}</p>
        </div>
      )}
    </aside>
  )
}
