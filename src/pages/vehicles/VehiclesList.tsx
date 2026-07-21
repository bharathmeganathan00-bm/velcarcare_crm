import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, Fuel, Gauge, Plus } from 'lucide-react'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useVehicles } from '@/hooks/data'
import { useDebounced } from '@/hooks/useDebounced'
import { formatNumber } from '@/lib/utils'

export function VehiclesList() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { data: rows = [], isLoading, error } = useVehicles(useDebounced(q))

  return (
    <div>
      <SectionTitle
        title="Vehicles"
        subtitle={rows.length ? `${rows.length} shown` : 'Registered vehicles'}
        action={<Link to="/vehicles/new" className="hidden sm:block"><Button><Plus className="h-4 w-4" /> Add Vehicle</Button></Link>}
      />
      <SearchFilterBar value={q} onChange={setQ} placeholder="Search by reg no, brand, model, owner…" />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        empty={<EmptyState icon={<Car className="h-6 w-6" />} title="No vehicles found" action={<Link to="/vehicles/new"><Button><Plus className="h-4 w-4" /> Add Vehicle</Button></Link>} />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((v) => (
            <div key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)} className="card cursor-pointer p-4 transition hover:shadow-cardHover">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted">
                  <Car className="h-6 w-6 text-slate-400" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-brand-charcoal">{v.brand} {v.model}</p>
                  <p className="text-sm font-semibold text-brand-red">{v.reg_number}</p>
                </div>
                {v.year && <StatusBadge tone="neutral">{v.year}</StatusBadge>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{v.customer_name}</span>
                {v.fuel_type && <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> {v.fuel_type}</span>}
                {v.odometer != null && <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {formatNumber(v.odometer)} km</span>}
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  )
}
