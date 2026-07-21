import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV_ITEMS } from '@/config/nav'
import { useAuth } from '@/context/AuthContext'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Misc'
import { cn } from '@/lib/utils'

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, can, isManager, logout } = useAuth()

  const items = NAV_ITEMS.filter((item) => {
    if (item.managerOnly) return isManager
    if (item.module) return can(item.module, 'view')
    return true
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-brand-charcoal animate-slide-up">
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <div className="rounded-xl bg-white px-2.5 py-1.5">
            <Logo variant="mark" className="h-7" />
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <Avatar name={user?.name} src={user?.photo_url} size={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs capitalize text-slate-400">{user?.role} · {user?.staff_id}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 no-scrollbar">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                  isActive ? 'bg-brand-red text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="border-t border-white/5 px-4 py-4 text-left text-sm font-semibold text-brand-red"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
