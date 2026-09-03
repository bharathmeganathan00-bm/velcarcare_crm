import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

/**
 * Confirmation bottom sheet before sharing an invoice on WhatsApp.
 * Shows the customer + invoice, then lets the user pick the native share sheet
 * (PDF attached) or the download + open-chat fallback. The CRM cannot auto-send.
 */
export function ShareInvoiceSheet({
  open,
  onClose,
  customerName,
  phone,
  invoiceNo,
  onShare,
}: {
  open: boolean
  onClose: () => void
  customerName: string
  phone: string
  invoiceNo: string
  onShare: (mode: 'web' | 'fallback') => Promise<void>
}) {
  const [busy, setBusy] = useState<'web' | 'fallback' | null>(null)

  async function run(mode: 'web' | 'fallback') {
    setBusy(mode)
    try {
      await onShare(mode)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share Invoice on WhatsApp" size="sm">
      <div className="space-y-4 p-5">
        <div className="rounded-2xl border border-surface-border bg-surface-muted/50 p-4 text-sm">
          <Row label="Customer" value={customerName} />
          <Row label="WhatsApp" value={phone || '—'} />
          <Row label="Invoice" value={invoiceNo} />
        </div>

        <div className="space-y-2">
          <Button
            className="w-full bg-[#25D366] text-white hover:brightness-95"
            loading={!!busy}
            disabled={!!busy || !phone}
            onClick={() => run('web')}
          >
            <Share2 className="h-4 w-4" /> Share PDF &amp; Open WhatsApp
          </Button>
          <Button variant="ghost" className="w-full" disabled={!!busy} onClick={onClose}>
            Cancel
          </Button>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-slate-400">
          The invoice PDF is generated on your device. WhatsApp opens with the message pre-filled —
          attach the PDF (if not already attached) and tap Send. Sending is not automatic.
        </p>

        {!phone && (
          <p className="text-center text-xs font-medium text-status-danger">
            This customer has no WhatsApp number saved. Add one on the customer page first.
          </p>
        )}
      </div>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-brand-charcoal">{value}</span>
    </div>
  )
}
