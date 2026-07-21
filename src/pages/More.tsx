import { Link } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { NAV_ITEMS } from '@/config/nav'
import { useAuth } from '@/context/AuthContext'
import { SectionTitle, Avatar } from '@/components/ui/Misc'

export function More() {
  const { user, can, isManager, logout } = useAuth()
  const items = NAV_ITEMS.filter((item) => {
    if (item.managerOnly) return isManager
    if (item.module) return can(item.module, 'view')
    return true
  })

  return (
    <div>
      <div className="card mb-4 flex items-center gap-3 p-4">
        <Avatar name={user?.name} src={user?.photo_url} size={52} />
        <div>
          <p className="font-bold text-brand-charcoal">{user?.name}</p>
          <p className="text-sm capitalize text-slate-500">{user?.role} · {user?.staff_id}</p>
        </div>
      </div>

      <SectionTitle title="All Modules" />
      <div className="card divide-y divide-surface-border overflow-hidden">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-brand-charcoal"><item.icon className="h-5 w-5" /></span>
            <span className="flex-1 font-semibold text-brand-charcoal">{item.label}</span>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </Link>
        ))}
      </div>

      <button onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-redLight py-3.5 font-semibold text-brand-red">
        <LogOut className="h-5 w-5" /> Sign out
      </button>
    </div>
  )
}
