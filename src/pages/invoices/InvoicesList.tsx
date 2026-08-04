import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ReceiptText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { QueryState } from '@/components/common/QueryState'
import { StatusBadge, INVOICE_STATUS } from '@/components/ui/StatusBadge'
import { useInvoices, useDeleteInvoice } from '@/hooks/data'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { useDebounced } from '@/hooks/useDebounced'
import { formatCurrency } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'partial', label: 'Partial' },
  { key: 'confirmed', label: 'Unpaid' },
  { key: 'draft', label: 'Draft' },
]

export function InvoicesList() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const { data: rows = [], isLoading, error } = useInvoices(useDebounced(q), filter)
  const deleteInvoice = useDeleteInvoice()

  const totalPending = useMemo(() => rows.reduce((s, i) => s + i.balance, 0), [rows])

  const [delOpen, setDelOpen] = useState(false)
  const [toDelete, setToDelete] = useState<{ id: string; label: string } | null>(null)

  async function onConfirmDelete() {
    if (!toDelete) return
    try {
      await deleteInvoice.mutateAsync(toDelete.id)
      toast.success('Invoice deleted')
      setDelOpen(false)
      setToDelete(null)
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  return (
    <div>
      <SectionTitle
        title="Invoices"
        subtitle={rows.length ? `${formatCurrency(totalPending)} pending across ${rows.filter((i) => i.balance > 0).length} invoices` : 'Billing & invoices'}
        action={<Link to="/invoices/new" className="hidden sm:block"><Button><Plus className="h-4 w-4" /> Create Invoice</Button></Link>}
      />
      <SearchFilterBar value={q} onChange={setQ} placeholder="Search invoice no, customer, reg no…" filters={FILTERS} active={filter} onFilter={setFilter} />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        empty={<EmptyState icon={<ReceiptText className="h-6 w-6" />} title="No invoices" action={<Link to="/invoices/new"><Button><Plus className="h-4 w-4" /> Create Invoice</Button></Link>} />}
      >
        <div className="space-y-3">
          {rows.map((i) => {
            const s = INVOICE_STATUS[i.status]
            return (
              <div key={i.id} onClick={() => navigate(`/invoices/${i.id}`)} className="card cursor-pointer p-4 transition hover:shadow-cardHover">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-charcoal">{i.invoice_no}</p>
                      <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>
                      {i.is_gst && <StatusBadge tone="info">GST</StatusBadge>}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{i.customer_name} · <span className="font-semibold text-brand-red">{i.reg_number}</span></p>
                    <p className="text-xs text-slate-400">{i.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-brand-charcoal">{formatCurrency(i.grand_total)}</p>
                    {i.balance > 0 ? (
                      <p className="text-xs font-semibold text-status-danger">Balance {formatCurrency(i.balance)}</p>
                    ) : (
                      <p className="text-xs font-semibold text-status-success">Fully paid</p>
                    )}
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setToDelete({ id: i.id, label: i.invoice_no })
                          setDelOpen(true)
                        }}
                        className="rounded-lg p-2 hover:bg-surface-muted"
                        aria-label={`Delete ${i.invoice_no}`}
                      >
                        <Trash2 className="h-4 w-4 text-status-danger" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </QueryState>

      <ConfirmDialog
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={onConfirmDelete}
        title={toDelete ? `Delete ${toDelete.label}?` : 'Delete invoice?'}
        description="This will hide the invoice from lists. Records are kept for audit."
        confirmLabel="Delete"
        loading={deleteInvoice.isPending}
      />
    </div>
  )
}
