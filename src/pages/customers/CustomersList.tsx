import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, ChevronRight, Plus, UserPlus, Users } from 'lucide-react'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Avatar } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { QueryState } from '@/components/common/QueryState'
import { CallButton, WhatsAppButton } from '@/components/common/ActionButtons'
import { useCustomers } from '@/hooks/data'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useDebounced } from '@/hooks/useDebounced'

export function CustomersList() {
  const [q, setQ] = useState('')
  const search = useDebounced(q)
  const navigate = useNavigate()
  const { can } = useAuth()
  const { data: rows = [], isLoading, error } = useCustomers(search)

  return (
    <div>
      <SectionTitle
        title="Customers"
        subtitle={rows.length ? `${rows.length} shown` : 'Manage your customers'}
        action={
          can('customers', 'add') && (
            <Link to="/customers/new" className="hidden sm:block">
              <Button><Plus className="h-4 w-4" /> Add Customer</Button>
            </Link>
          )
        }
      />

      <SearchFilterBar value={q} onChange={setQ} placeholder="Search by name or phone…" />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No customers found"
            description="Try a different search, or add your first customer."
            action={<Link to="/customers/new"><Button><UserPlus className="h-4 w-4" /> Add Customer</Button></Link>}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="card cursor-pointer p-4 transition hover:shadow-cardHover"
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-brand-charcoal">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.phone}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> {c.vehicle_count} vehicle{c.vehicle_count !== 1 ? 's' : ''}</span>
                <span className="font-semibold text-brand-charcoal">{formatCurrency(c.total_spent)} lifetime</span>
              </div>
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <CallButton phone={c.phone} />
                <WhatsAppButton phone={c.whatsapp ?? c.phone} label="WhatsApp" className="flex-1" message={`Dear ${c.name}, greetings from VELCARCARE.`} />
              </div>
            </div>
          ))}
        </div>
      </QueryState>

      {/* Mobile add button */}
      {can('customers', 'add') && (
        <Link to="/customers/new" className="sm:hidden">
          <Button className="mt-4 w-full"><UserPlus className="h-4 w-4" /> Add Customer</Button>
        </Link>
      )}
    </div>
  )
}
