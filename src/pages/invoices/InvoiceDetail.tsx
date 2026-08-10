import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ClipboardCopy, Download, History, Lock, Pencil, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, INVOICE_STATUS } from '@/components/ui/StatusBadge'
import { WhatsAppIcon } from '@/components/common/ActionButtons'
import { ShareInvoiceSheet } from '@/components/invoices/ShareInvoiceSheet'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useInvoice, useInvoiceItems, useInspection, useInvoiceShareLogs } from '@/hooks/data'
import { downloadInvoicePdf, invoicePdfBlob, type InvoicePdfData } from '@/lib/pdf'
import { logInvoiceShare } from '@/lib/api'
import { shareInvoiceViaFallback, shareInvoiceViaWebShare, type ShareMethod, type ShareStatus } from '@/lib/whatsappShare'
import { formatCurrency, toWhatsAppNumber, cn } from '@/lib/utils'

export function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, isManager, can } = useAuth()
  const { settings } = useSettings()
  const { data: inv, isLoading } = useInvoice(id)
  const { data: items = [] } = useInvoiceItems(id)
  const { data: inspection = [] } = useInspection(inv?.job_card_id)

  // invoice_whatsapp_share = the Invoices → WhatsApp permission cell (managers always).
  const canShare = isManager || can('invoices', 'whatsapp')
  const canDownload = isManager || can('invoices', 'download')
  const canEdit = isManager || can('invoices', 'edit')
  const canViewHistory = canShare
  const { data: shareLogs = [] } = useInvoiceShareLogs(id, canViewHistory)

  const [shareOpen, setShareOpen] = useState(false)

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>
  if (!inv) return <EmptyState title="Invoice not found" action={<Link to="/invoices"><Button>Back</Button></Link>} />

  const s = INVOICE_STATUS[inv.status]
  const serviceItems = items.filter((i) => i.kind === 'service')
  const partItems = items.filter((i) => i.kind === 'part')
  const labourItem = items.find((i) => i.kind === 'labour')

  const customerPhone = inv.customer_whatsapp ?? inv.customer_phone ?? ''
  const sharerName = isManager ? 'Manager' : user?.name ?? 'Staff'
  const labourAmount = (inv.labour_charge ?? 0) > 0 ? inv.labour_charge! : labourItem?.amount ?? 0
  const labourLine = labourAmount > 0 ? `Labour: ${formatCurrency(labourAmount)}\n` : ''
  const waMessage = `Dear ${inv.customer_name},\nYour vehicle service invoice from VELCARCARE is ready.\n\nVehicle: ${inv.reg_number}\nInvoice: ${inv.invoice_no}\n${labourLine}Total: ${formatCurrency(inv.grand_total)}\nPaid: ${formatCurrency(inv.paid)}\nBalance: ${formatCurrency(inv.balance)}\n\nThank you for choosing VELCARCARE.`

  function pdfData(): InvoicePdfData {
    return {
      invoiceNo: inv!.invoice_no,
      date: inv!.date,
      customerName: inv!.customer_name,
      customerPhone: customerPhone,
      customerAddress: inv!.customer_address ?? undefined,
      customerGstNumber: (inv as any).customer_gst_number ?? undefined,
      customerGstName: (inv as any).customer_gst_name ?? undefined,
      customerAccountName: (inv as any).customer_account_name ?? undefined,
      customerAccountNumber: (inv as any).customer_account_number ?? undefined,
      customerIfsc: (inv as any).customer_ifsc ?? undefined,
      vehicleLabel: inv!.vehicle_label,
      regNumber: inv!.reg_number,
      fuelType: inv!.fuel_type ?? undefined,
      serviceDate: inv!.date,
      services: serviceItems.map((i) => ({ description: i.name, qty: i.qty, rate: i.price, amount: i.amount })),
      parts: partItems.map((i) => ({ description: i.name, qty: i.qty, rate: i.price, amount: i.amount })),
      labour: labourAmount,
      discount: inv!.discount,
      cgst: inv!.cgst,
      sgst: inv!.sgst,
      grandTotal: inv!.grand_total,
      paid: inv!.paid,
      balance: inv!.balance,
      paymentMode: inv!.payment_method ?? undefined,
      paymentStatus: inv!.balance <= 0 ? 'Paid' : inv!.paid > 0 ? 'Partial' : 'Pending',
      inspection,
    }
  }

  async function download() {
    await downloadInvoicePdf(settings, pdfData())
    toast.success('PDF downloaded')
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(waMessage)
      toast.success('Message copied')
    } catch {
      toast.error('Could not copy message')
    }
  }

  async function handleShare(mode: 'web' | 'fallback') {
    if (!canShare || !user) return
    const blob = await invoicePdfBlob(settings, pdfData())
    const file = new File([blob], `${inv!.invoice_no}.pdf`, { type: 'application/pdf' })
    const log = (method: ShareMethod, status: ShareStatus, error?: string) =>
      logInvoiceShare({
        invoice_id: inv!.id,
        customer_id: inv!.customer_id ?? null,
        shared_by: user.id,
        shared_by_name: sharerName,
        shared_by_role: isManager ? 'manager' : 'staff',
        phone_number: toWhatsAppNumber(customerPhone),
        share_method: method,
        status,
        error_message: error ?? null,
      })

    const result =
      mode === 'web'
        ? await shareInvoiceViaWebShare({ file, message: waMessage, title: `Invoice ${inv!.invoice_no}`, phone: customerPhone, log })
        : await shareInvoiceViaFallback({ file, message: waMessage, phone: customerPhone, log })

    // Refresh sharing history.
    qc.invalidateQueries({ queryKey: ['invoice-share-logs', inv!.id] })

    if (result.cancelled) return
    setShareOpen(false)
    toast.success(`Invoice sharing started by ${sharerName}.`)
    if (result.fallback) {
      toast.message('Invoice PDF downloaded. Please attach the downloaded PDF before sending.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle
          title={inv.invoice_no}
          subtitle={inv.date}
          action={
            <div className="flex items-center gap-2">
              <StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Company header (printed on invoice) */}
      <div className="mb-3">
        <p className="text-sm font-bold text-brand-charcoal">{settings.name}</p>
        <p className="text-xs text-slate-500">{settings.address}</p>
        <p className="text-xs text-slate-500">{settings.phones.filter(Boolean).join(' · ')}{settings.email ? ` · ${settings.email}` : ''}</p>
        {settings.gst_enabled && settings.gst_number && (
          <p className="mt-1 text-xs font-semibold text-brand-charcoal">GSTIN: {settings.gst_number}</p>
        )}
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

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {canDownload && (
          <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> <span className="truncate">Download</span></Button>
        )}
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
        <Button variant="outline" onClick={copyMessage}><ClipboardCopy className="h-4 w-4" /> <span className="truncate">Copy</span></Button>
        {canShare ? (
          <Button
            className="col-span-2 bg-[#25D366] text-white hover:brightness-95 sm:col-span-1"
            onClick={() => setShareOpen(true)}
          >
            <WhatsAppIcon className="h-4 w-4" /> <span className="truncate">Share on WhatsApp</span>
          </Button>
        ) : (
          <Button variant="outline" disabled className="col-span-2 opacity-70 sm:col-span-1">
            <Lock className="h-4 w-4" /> Share
          </Button>
        )}
      </div>
      {!canShare && (
        <p className="mt-2 text-center text-xs font-medium text-slate-400">
          You do not have permission to share invoices. Ask your Manager to enable it.
        </p>
      )}

      {/* Sharing history */}
      {canViewHistory && shareLogs.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /> Sharing History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {shareLogs.map((lg) => (
              <div key={lg.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-surface-border p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-charcoal">
                    {lg.shared_by_name} <span className="text-xs font-normal capitalize text-slate-400">· {lg.shared_by_role}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(lg.created_at).toLocaleString('en-IN')} · {formatMethod(lg.share_method)}
                  </p>
                </div>
                <StatusBadge tone={statusTone(lg.status)}>{formatStatus(lg.status)}</StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ShareInvoiceSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        customerName={inv.customer_name}
        phone={customerPhone}
        invoiceNo={inv.invoice_no}
        onShare={handleShare}
      />
    </div>
  )
}

function formatMethod(m: string) {
  return { web_share: 'Mobile Web Share', whatsapp_link: 'WhatsApp Link', pdf_download: 'PDF Download' }[m] ?? m
}
function formatStatus(s: string) {
  return (
    {
      share_started: 'Share Started',
      share_sheet_opened: 'Share Sheet Opened',
      whatsapp_opened: 'WhatsApp Opened',
      completed: 'Completed',
      failed: 'Failed',
    }[s] ?? s
  )
}
function statusTone(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (s === 'completed') return 'success'
  if (s === 'failed') return 'danger'
  if (s === 'whatsapp_opened' || s === 'share_sheet_opened') return 'info'
  return 'neutral'
}
