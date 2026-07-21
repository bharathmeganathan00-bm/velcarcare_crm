import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, JOBCARD_STATUS } from '@/components/ui/StatusBadge'
import { WhatsAppButton } from '@/components/common/ActionButtons'
import { useJobCard, useUpdateJobCardStatus } from '@/hooks/data'
import { formatCurrency } from '@/lib/utils'
import type { JobCardStatus } from '@/lib/types'

const FLOW: JobCardStatus[] = ['received', 'inspection', 'estimate_pending', 'awaiting_approval', 'in_service', 'waiting_parts', 'quality_check', 'ready', 'delivered']

export function JobCardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: jc, isLoading } = useJobCard(id)
  const updateStatus = useUpdateJobCardStatus()
  const [status, setStatus] = useState<JobCardStatus>('received')

  useEffect(() => { if (jc) setStatus(jc.status) }, [jc])

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>
  if (!jc) return <EmptyState title="Job card not found" action={<Link to="/job-cards"><Button>Back</Button></Link>} />

  const s = JOBCARD_STATUS[status]

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title={jc.jobcard_no} subtitle={`${jc.customer_name} · ${jc.reg_number}`} action={<StatusBadge tone={s.tone} dot>{s.label}</StatusBadge>} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FLOW.map((st) => {
                  const cfg = JOBCARD_STATUS[st]
                  return (
                    <button
                      key={st}
                      onClick={() => {
                        setStatus(st)
                        updateStatus.mutate(
                          { id: jc.id, status: st },
                          { onSuccess: () => toast.success(`Status → ${cfg.label}`), onError: (e) => toast.error(String((e as Error).message)) },
                        )
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${status === st ? 'border-brand-red bg-brand-red text-white' : 'border-surface-border bg-white text-slate-600 hover:bg-surface-muted'}`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Customer" value={jc.customer_name} />
              <Info label="Vehicle" value={jc.vehicle_label} />
              <Info label="Registration" value={jc.reg_number} />
              <Info label="Odometer" value={`${jc.odometer ?? '—'} km`} />
              <Info label="Assigned To" value={jc.assigned_to ?? '—'} />
              <Info label="Received" value={new Date(jc.received_at).toLocaleString('en-IN')} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Charges</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row label="Services" value={jc.services_total} />
            <Row label="Spare Parts" value={jc.parts_total} />
            <Row label="Labour" value={jc.labour_total} />
            <div className="flex items-center justify-between border-t border-dashed border-surface-border pt-2">
              <span className="font-bold text-brand-charcoal">Grand Total</span>
              <span className="text-lg font-extrabold text-brand-red">{formatCurrency(jc.grand_total)}</span>
            </div>
            <div className="space-y-2 pt-2">
              <Button className="w-full" onClick={() => navigate('/invoices/new')}><FileText className="h-4 w-4" /> Generate Invoice</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
                <WhatsAppButton phone="9787549179" label="Update" message={`Dear ${jc.customer_name}, your vehicle ${jc.reg_number} status at VELCARCARE: ${s.label}.`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-brand-charcoal">{value}</p>
    </div>
  )
}
function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-brand-charcoal">{formatCurrency(value)}</span>
    </div>
  )
}
