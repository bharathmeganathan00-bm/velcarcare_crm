import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, INVOICE_STATUS } from '@/components/ui/StatusBadge'
import { WhatsAppButton } from '@/components/common/ActionButtons'
import { useSettings } from '@/context/SettingsContext'
import { useInvoice, useInvoiceItems, useInspection } from '@/hooks/data'
import { downloadInvoicePdf } from '@/lib/pdf'
import { formatCurrency, cn } from '@/lib/utils'

export function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { data: inv, isLoading } = useInvoice(id)
  const { data: items = [] } = useInvoiceItems(id)
  const { data: inspection = [] } = useInspection(inv?.job_card_id)

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>
  if (!inv) return <EmptyState title="Invoice not found" action={<Link to="/invoices"><Button>Back</Button></Link>} />

  const s = INVOICE_STATUS[inv.status]
  const serviceItems = items.filter((i) => i.kind === 'service')
  const partItems = items.filter((i) => i.kind === 'part')
  const labourItem = items.find((i) => i.kind === 'labour')

  async function download() {
    await downloadInvoicePdf(settings, {
      invoiceNo: inv!.invoice_no,
      date: inv!.date,
      customerName: inv!.customer_name,
      vehicleLabel: inv!.vehicle_label,
      regNumber: inv!.reg_number,
      services: serviceItems.map((i) => ({ description: i.name, qty: i.qty, rate: i.price, amount: i.amount })),
      parts: partItems.map((i) => ({ description: i.name, qty: i.qty, rate: i.price, amount: i.amount })),
      labour: labourItem?.amount ?? 0,
      discount: inv!.discount,
      cgst: inv!.cgst,
      sgst: inv!.sgst,
      grandTotal: inv!.grand_total,
      paid: inv!.paid,
      balance: inv!.balance,
      inspection,
    })
    toast.success('PDF downloaded')
  }

  const waMessage = `Dear ${inv.customer_name},\nYour vehicle service invoice from VELCARCARE is ready.\n\nVehicle: ${inv.reg_number}\nInvoice: ${inv.invoice_no}\nTotal: ${formatCurrency(inv.grand_total)}\nPaid: ${formatCurrency(inv.paid)}\nBalance: ${formatCurrency(inv.balance)}\n\nThank you for choosing VELCARCARE.`

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title={inv.invoice_no} subtitle={inv.date} action={<StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>} />
      </div>

      <Card>
        <CardHeader><CardTitle>{inv.customer_name}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Vehicle</span><span className="font-semibold text-brand-charcoal">{inv.vehicle_label}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Registration</span><span className="font-semibold text-brand-red">{inv.reg_number}</span></div>

          {/* Itemised services & spare parts */}
          {serviceItems.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Services</p>
              <div className="divide-y divide-surface-border rounded-xl border border-surface-border">
                {serviceItems.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-brand-charcoal">{it.name}</span>
                    <span className="font-semibold text-brand-charcoal">{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {partItems.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Spare Parts</p>
              <div className="divide-y divide-surface-border rounded-xl border border-surface-border">
                {partItems.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-brand-charcoal">
                      {it.name} <span className="text-slate-400">{it.qty} × {formatCurrency(it.price)}</span>
                    </span>
                    <span className="font-semibold text-brand-charcoal">{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {labourItem && (
            <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-sm">
              <span className="font-semibold text-slate-600">Labour Charges</span>
              <span className="font-bold text-brand-charcoal">{formatCurrency(labourItem.amount)}</span>
            </div>
          )}

          <div className="my-2 border-t border-dashed border-surface-border" />
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Sub Total</span><span className="font-semibold">{formatCurrency(inv.subtotal)}</span></div>
          {inv.discount > 0 && <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Discount</span><span>- {formatCurrency(inv.discount)}</span></div>}
          {inv.is_gst && <><div className="flex items-center justify-between text-sm"><span className="text-slate-500">CGST</span><span>{formatCurrency(inv.cgst)}</span></div><div className="flex items-center justify-between text-sm"><span className="text-slate-500">SGST</span><span>{formatCurrency(inv.sgst)}</span></div></>}
          <div className="flex items-center justify-between border-t border-surface-border pt-2"><span className="font-bold text-brand-charcoal">Grand Total</span><span className="text-xl font-extrabold text-brand-red">{formatCurrency(inv.grand_total)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Paid</span><span className="font-semibold text-status-success">{formatCurrency(inv.paid)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Balance</span><span className="font-semibold text-status-danger">{formatCurrency(inv.balance)}</span></div>
        </CardContent>
      </Card>

      {inspection.length > 0 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Inspection Report</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {inspection.map((i) => (
              <div key={i.item} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{i.item}</span>
                <span className={cn('font-semibold', i.status === 'good' ? 'text-status-success' : 'text-status-danger')}>
                  {i.status === 'good' ? 'Good' : 'Not OK'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> Download PDF</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
        <WhatsAppButton phone="9787549179" label="Share on WhatsApp" message={waMessage} className="w-full" />
      </div>
    </div>
  )
}
