import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, ClipboardList, Loader2, ReceiptText, Search, Users } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { useDebounced } from '@/hooks/useDebounced'
import * as api from '@/lib/api'

interface Result {
  type: string
  icon: React.ReactNode
  title: string
  subtitle: string
  to: string
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const term = useDebounced(q, 250)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!term.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const [customers, vehicles, jobcards, invoices] = await Promise.all([
          api.listCustomers(term),
          api.listVehicles(term),
          api.listJobCards(term),
          api.listInvoices(term),
        ])
        if (cancelled) return
        const out: Result[] = []
        customers.slice(0, 4).forEach((c) => out.push({ type: 'Customer', icon: <Users className="h-4 w-4" />, title: c.name, subtitle: c.phone, to: `/customers/${c.id}` }))
        vehicles.slice(0, 4).forEach((v) => out.push({ type: 'Vehicle', icon: <Car className="h-4 w-4" />, title: `${v.brand} ${v.model}`, subtitle: v.reg_number, to: `/vehicles/${v.id}` }))
        jobcards.slice(0, 4).forEach((j) => out.push({ type: 'Job Card', icon: <ClipboardList className="h-4 w-4" />, title: j.jobcard_no, subtitle: j.customer_name, to: `/job-cards/${j.id}` }))
        invoices.slice(0, 4).forEach((i) => out.push({ type: 'Invoice', icon: <ReceiptText className="h-4 w-4" />, title: i.invoice_no, subtitle: i.customer_name, to: `/invoices/${i.id}` }))
        setResults(out)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [term])

  function go(to: string) {
    onClose()
    setQ('')
    navigate(to)
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg" className="sm:self-start sm:mt-[10vh]">
      <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers, vehicles, invoices, job cards, parts…"
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {!q.trim() && <p className="px-3 py-8 text-center text-sm text-slate-400">Start typing to search across the whole CRM.</p>}
        {q.trim() && !loading && results.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-slate-400">No matches for “{q}”.</p>
        )}
        {results.map((r, i) => (
          <button key={i} onClick={() => go(r.to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-slate-500">{r.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-brand-charcoal">{r.title}</span>
              <span className="block truncate text-xs text-slate-400">{r.subtitle}</span>
            </span>
            <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-slate-500">{r.type}</span>
          </button>
        ))}
      </div>
    </Dialog>
  )
}
