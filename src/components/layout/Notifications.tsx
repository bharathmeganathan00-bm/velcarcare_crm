import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ReceiptText } from 'lucide-react'
import { useInvoices } from '@/hooks/data'
import { formatCurrency } from '@/lib/utils'

/**
 * Live bill notifications — reflects invoices that still have a balance due.
 * The badge count and list update automatically as invoices are paid/created.
 */
export function Notifications() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: invoices = [] } = useInvoices()

  const pending = invoices
    .filter((i) => i.balance > 0 && i.status !== 'cancelled')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const count = pending.length
  const totalDue = pending.reduce((s, i) => s + i.balance, 0)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-surface-muted"
        aria-label="Bill notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-1.5rem)] animate-fade-in overflow-hidden rounded-xl border border-surface-border bg-white shadow-float">
            <div className="flex items-center justify-between gap-2 border-b border-surface-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand-charcoal">Bill Notifications</p>
                <p className="truncate text-xs text-slate-400">
                  {count === 0 ? 'All bills settled' : `${count} pending · ${formatCurrency(totalDue)} due`}
                </p>
              </div>
              <Bell className="h-4 w-4 shrink-0 text-slate-300" />
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-1.5">
              {count === 0 && (
                <p className="px-3 py-8 text-center text-sm text-slate-400">No pending bills 🎉</p>
              )}
              {pending.map((i) => (
                <button
                  key={i.id}
                  onClick={() => { setOpen(false); navigate(`/invoices/${i.id}`) }}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-muted"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-redLight text-brand-red">
                    <ReceiptText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-charcoal">
                      {i.customer_name} · {i.invoice_no}
                    </span>
                    <span className="block truncate text-xs text-slate-400">{i.reg_number} · {i.date}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-status-danger">{formatCurrency(i.balance)}</span>
                </button>
              ))}
            </div>

            {count > 0 && (
              <button
                onClick={() => { setOpen(false); navigate('/payments') }}
                className="w-full border-t border-surface-border px-4 py-2.5 text-center text-sm font-semibold text-brand-red hover:bg-surface-muted"
              >
                View all pending payments
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
