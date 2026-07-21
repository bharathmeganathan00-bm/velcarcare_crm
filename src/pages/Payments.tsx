import { AlertCircle, CheckCircle2, IndianRupee, Wallet } from 'lucide-react'
import { SectionTitle } from '@/components/ui/Misc'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge, INVOICE_STATUS } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { WhatsAppButton } from '@/components/common/ActionButtons'
import { useInvoices } from '@/hooks/data'
import { formatCurrency } from '@/lib/utils'

export function Payments() {
  const { data: invoices = [] } = useInvoices()
  const collected = invoices.reduce((s, i) => s + i.paid, 0)
  const pending = invoices.reduce((s, i) => s + i.balance, 0)
  const pendingList = invoices.filter((i) => i.balance > 0)

  return (
    <div>
      <SectionTitle title="Payments" subtitle="Collections & pending balances" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Collected" value={formatCurrency(collected)} icon={CheckCircle2} accent="green" />
        <StatCard label="Pending" value={formatCurrency(pending)} icon={AlertCircle} accent="red" />
        <StatCard label="Invoices" value={invoices.length} icon={Wallet} accent="blue" />
        <StatCard label="Unpaid" value={pendingList.length} icon={IndianRupee} accent="orange" />
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Payments</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          {pendingList.length === 0 && <p className="py-8 text-center text-sm text-slate-400">All invoices are fully paid 🎉</p>}
          {pendingList.map((i) => {
            const s = INVOICE_STATUS[i.status]
            return (
              <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-brand-charcoal">{i.invoice_no}</p>
                    <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                  </div>
                  <p className="text-sm text-slate-500">{i.customer_name} · {i.reg_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-status-danger">{formatCurrency(i.balance)}</p>
                  <p className="text-xs text-slate-400">of {formatCurrency(i.grand_total)}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button size="sm" variant="outline" className="flex-1">Record Payment</Button>
                  <WhatsAppButton
                    phone="9787549179"
                    message={`Dear ${i.customer_name}, this is a friendly reminder from VELCARCARE. Invoice ${i.invoice_no} has a pending balance of ${formatCurrency(i.balance)}. Kindly arrange payment. Thank you.`}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
