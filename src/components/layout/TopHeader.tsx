import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Phone, Search, Settings, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Misc'
import { Logo } from '@/components/ui/Logo'
import { COMPANY } from '@/data/mockData'
import { GlobalSearch } from '@/components/common/GlobalSearch'
import { Notifications } from '@/components/layout/Notifications'

export function TopHeader({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-surface-border bg-white/90 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile: logo + menu */}
      <button onClick={onMobileMenu} className="rounded-lg p-2 text-slate-600 hover:bg-surface-muted lg:hidden">
        <Menu className="h-6 w-6" />
      </button>
      <div className="lg:hidden">
        <Logo variant="mark" className="h-8" />
      </div>

      {/* Desktop global search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="hidden lg:flex flex-1 max-w-xl items-center gap-2.5 rounded-xl border border-surface-border bg-surface-muted px-3.5 h-10 text-sm text-slate-400 hover:bg-slate-100 transition"
      >
        <Search className="h-4 w-4" />
        Search by customer, vehicle, invoice, job card…
        <kbd className="ml-auto rounded-md border border-surface-border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button onClick={() => setSearchOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-surface-muted lg:hidden">
          <Search className="h-5 w-5" />
        </button>

        <a
          href={`tel:${COMPANY.phones[0]}`}
          className="hidden sm:flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-status-success hover:bg-status-successBg"
        >
          <Phone className="h-4 w-4" />
          {COMPANY.phones[0]}
        </a>

        <Notifications />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-muted"
          >
            <Avatar name={user?.name} src={user?.photo_url} size={34} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold leading-tight text-brand-charcoal">{user?.name}</p>
              <p className="text-[11px] capitalize text-slate-400">{user?.role}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 animate-fade-in rounded-xl border border-surface-border bg-white p-1.5 shadow-float">
                <div className="border-b border-surface-border px-3 py-2">
                  <p className="text-sm font-bold text-brand-charcoal">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <MenuBtn icon={<User className="h-4 w-4" />} label="My Profile" onClick={() => { setMenuOpen(false); navigate('/staff') }} />
                <MenuBtn icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => { setMenuOpen(false); navigate('/settings') }} />
                <MenuBtn icon={<LogOut className="h-4 w-4" />} label="Sign out" danger onClick={logout} />
              </div>
            </>
          )}
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}

function MenuBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        danger ? 'text-status-danger hover:bg-status-dangerBg' : 'text-slate-700 hover:bg-surface-muted'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
