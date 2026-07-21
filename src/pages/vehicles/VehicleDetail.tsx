import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, Gauge, Fuel, Calendar, Plus } from 'lucide-react'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, JOBCARD_STATUS } from '@/components/ui/StatusBadge'
import { useVehicle, useJobCards } from '@/hooks/data'
import { formatNumber } from '@/lib/utils'

export function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: v, isLoading } = useVehicle(id)
  const { data: allJobs = [] } = useJobCards()

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>
  if (!v) return <EmptyState title="Vehicle not found" action={<Link to="/vehicles"><Button>Back</Button></Link>} />
  const jobs = allJobs.filter((j) => j.vehicle_id === v.id)

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title={`${v.brand} ${v.model}`} subtitle={v.reg_number} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex h-28 items-center justify-center rounded-xl bg-surface-muted"><Car className="h-14 w-14 text-slate-300" /></div>
            <p className="mt-3 text-lg font-extrabold text-brand-red">{v.reg_number}</p>
            <p className="text-sm text-slate-500">Owner: {v.customer_name}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-surface-muted py-2"><Calendar className="mx-auto mb-1 h-4 w-4 text-slate-400" />{v.year ?? '—'}</div>
              <div className="rounded-lg bg-surface-muted py-2"><Fuel className="mx-auto mb-1 h-4 w-4 text-slate-400" />{v.fuel_type ?? '—'}</div>
              <div className="rounded-lg bg-surface-muted py-2"><Gauge className="mx-auto mb-1 h-4 w-4 text-slate-400" />{v.odometer ? formatNumber(v.odometer) : '—'}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service History</CardTitle>
            <Link to="/job-cards/new"><Button size="sm" variant="subtle"><Plus className="h-4 w-4" /> New Job Card</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {jobs.map((j) => {
              const s = JOBCARD_STATUS[j.status]
              return (
                <Link key={j.id} to={`/job-cards/${j.id}`} className="flex items-center gap-3 rounded-xl border border-surface-border p-3 hover:bg-surface-muted">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-charcoal">{j.jobcard_no}</p>
                    <p className="text-xs text-slate-400">{new Date(j.received_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                </Link>
              )
            })}
            {jobs.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No service history yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
