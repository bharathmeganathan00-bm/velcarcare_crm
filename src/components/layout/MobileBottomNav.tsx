import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Home,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Users,
  UserPlus,
  Car,
  FileText,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Job Cards', to: '/job-cards', icon: ClipboardList },
  { label: 'Billing', to: '/invoices', icon: ReceiptText },
]

const QUICK_ACTIONS = [
  { label: 'Add Customer', to: '/customers/new', icon: UserPlus, color: 'bg-brand-red' },
  { label: 'Add Vehicle', to: '/vehicles/new', icon: Car, color: 'bg-status-info' },
  { label: 'New Job Card', to: '/job-cards/new', icon: ClipboardList, color: 'bg-status-success' },
  { label: 'New Invoice', to: '/invoices/new', icon: FileText, color: 'bg-brand-charcoal' },
]

export function MobileBottomNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* Quick action sheet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute bottom-24 left-1/2 w-[92%] max-w-sm -translate-x-1/2 animate-slide-up">
            <div className="rounded-3xl bg-white p-4 shadow-float">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-charcoal">Quick Actions</h3>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-surface-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      setOpen(false)
                      navigate(a.to)
                    }}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-surface-muted p-3 text-center active:scale-95 transition"
                  >
                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-white', a.color)}>
                      <a.icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-slate-700">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-surface-border bg-white lg:hidden">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}

        {/* Central FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-14 w-14 -translate-y-4 items-center justify-center rounded-2xl bg-brand-red text-white shadow-float transition active:scale-95',
            open && 'rotate-45',
          )}
          aria-label="Quick actions"
        >
          <Plus className="h-7 w-7" />
        </button>

        {TABS.slice(2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
        <Tab label="More" to="/more" icon={MoreHorizontal} />
      </nav>
    </>
  )
}

function Tab({ label, to, icon: Icon }: { label: string; to: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-0.5 text-[10px] font-semibold',
          isActive ? 'text-brand-red' : 'text-slate-400',
        )
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  )
}
