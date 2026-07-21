import { cn } from '@/lib/utils'

export type Tone = 'success' | 'warning' | 'info' | 'danger' | 'low' | 'neutral' | 'red'

const toneClasses: Record<Tone, string> = {
  success: 'bg-status-successBg text-status-success',
  warning: 'bg-status-warningBg text-[#B45309]',
  info: 'bg-status-infoBg text-status-info',
  danger: 'bg-status-dangerBg text-status-danger',
  low: 'bg-status-lowBg text-status-low',
  neutral: 'bg-slate-100 text-slate-600',
  red: 'bg-brand-redLight text-brand-red',
}

/** Maps every job-card status to a label + tone. */
export const JOBCARD_STATUS: Record<string, { label: string; tone: Tone }> = {
  received: { label: 'Received', tone: 'info' },
  inspection: { label: 'Inspection', tone: 'info' },
  estimate_pending: { label: 'Estimate Pending', tone: 'warning' },
  awaiting_approval: { label: 'Awaiting Approval', tone: 'warning' },
  in_service: { label: 'In Service', tone: 'info' },
  waiting_parts: { label: 'Waiting for Parts', tone: 'warning' },
  quality_check: { label: 'Quality Check', tone: 'info' },
  ready: { label: 'Ready', tone: 'success' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  partial: { label: 'Partial', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export function StatusBadge({
  tone = 'neutral',
  children,
  className,
  dot,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
