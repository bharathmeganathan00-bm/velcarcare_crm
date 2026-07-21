import { BellRing, CalendarClock, ShieldCheck, Wallet } from 'lucide-react'
import { SectionTitle } from '@/components/ui/Misc'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge, type Tone } from '@/components/ui/StatusBadge'
import { WhatsAppButton } from '@/components/common/ActionButtons'
import { useInvoices, useVehicles } from '@/hooks/data'
import type { Invoice, Vehicle } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface Reminder {
  type: string
  icon: typeof BellRing
  customer: string
  detail: string
  due: string
  tone: Tone
  message: string
}

function buildReminders(vehicles: Vehicle[], invoices: Invoice[]): Reminder[] {
  const out: Reminder[] = []
  vehicles.filter((v) => v.next_service_date).forEach((v) =>
    out.push({
      type: 'Next Service',
      icon: CalendarClock,
      customer: v.customer_name ?? '',
      detail: `${v.brand} ${v.model} · ${v.reg_number}`,
      due: v.next_service_date!,
      tone: 'info',
      message: `Dear ${v.customer_name}, your ${v.brand} ${v.model} (${v.reg_number}) is due for service on ${v.next_service_date}. Book your slot with VELCARCARE — 9787549179.`,
    }),
  )
  invoices.filter((i) => i.balance > 0).forEach((i) =>
    out.push({
      type: 'Pending Payment',
      icon: Wallet,
      customer: i.customer_name,
      detail: `${i.invoice_no} · ${i.reg_number}`,
      due: 'Overdue',
      tone: 'danger',
      message: `Dear ${i.customer_name}, invoice ${i.invoice_no} has a pending balance of ${formatCurrency(i.balance)}. Kindly arrange payment. — VELCARCARE`,
    }),
  )
  return out
}

export function Reminders() {
  const { data: vehicles = [] } = useVehicles()
  const { data: invoices = [] } = useInvoices()
  const reminders = buildReminders(vehicles, invoices)
  return (
    <div>
      <SectionTitle title="Reminders" subtitle={`${reminders.length} active reminders`} />
      <div className="space-y-3">
        {reminders.map((r, i) => (
          <Card key={i}>
            <CardContent className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-brand-charcoal">
                <r.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-brand-charcoal">{r.customer}</p>
                  <StatusBadge tone={r.tone}>{r.type}</StatusBadge>
                </div>
                <p className="truncate text-sm text-slate-500">{r.detail}</p>
              </div>
              <div className="text-right text-xs text-slate-400">Due<br /><span className="font-semibold text-brand-charcoal">{r.due}</span></div>
              <WhatsAppButton phone="9787549179" message={r.message} />
            </CardContent>
          </Card>
        ))}
        {reminders.length === 0 && (
          <div className="card p-10 text-center text-slate-400"><ShieldCheck className="mx-auto mb-2 h-8 w-8" />Nothing due right now.</div>
        )}
      </div>
    </div>
  )
}
