import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge, JOBCARD_STATUS } from '@/components/ui/StatusBadge'
import { useJobCards, useDeleteJobCard } from '@/hooks/data'
import { useDebounced } from '@/hooks/useDebounced'
import { formatCurrency } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'received', label: 'Received' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'in_service', label: 'In Service' },
  { key: 'awaiting_approval', label: 'Awaiting Approval' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
]

export function JobCardsList() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const navigate = useNavigate()
  const { data: rows = [], isLoading, error } = useJobCards(useDebounced(q), filter)
  const deleteJob = useDeleteJobCard()

  return (
    <div>
      <SectionTitle
        title="Job Cards"
        subtitle={rows.length ? `${rows.length} shown` : 'Service job cards'}
        action={<Link to="/job-cards/new" className="hidden sm:block"><Button><Plus className="h-4 w-4" /> New Job Card</Button></Link>}
      />
      <SearchFilterBar
        value={q}
        onChange={setQ}
        placeholder="Search by job card no, customer, reg no…"
        filters={FILTERS}
        active={filter}
        onFilter={setFilter}
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        empty={<EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No job cards" description="Create a job card to start a service." action={<Link to="/job-cards/new"><Button><Plus className="h-4 w-4" /> New Job Card</Button></Link>} />}
      >
        <div className="space-y-3">
          {rows.map((j) => {
            const s = JOBCARD_STATUS[j.status]
            return (
              <div key={j.id} className="card p-4 transition hover:shadow-cardHover">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => navigate(`/job-cards/${j.id}`)} className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-charcoal">{j.jobcard_no}</p>
                      <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{j.customer_name} · <span className="font-semibold text-brand-red">{j.reg_number}</span></p>
                    <p className="text-xs text-slate-400">{j.vehicle_label}</p>
                  </button>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-extrabold text-brand-charcoal">{formatCurrency(j.grand_total)}</p>
                      {j.assigned_to && <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-400"><User className="h-3 w-3" /> {j.assigned_to}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(j.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-white text-status-danger transition hover:bg-surface-muted"
                      aria-label="Delete job card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </QueryState>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteJob.mutateAsync(deleteTarget)
            toast.success('Job card deleted')
          } catch (error) {
            toast.error(String((error as Error).message))
          } finally {
            setDeleteTarget(null)
          }
        }}
        title="Delete job card?"
        description="This will remove the job card from the list but preserve historic invoice data."
        confirmLabel="Delete"
        loading={deleteJob.isPending}
      />
    </div>
  )
}
