import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Accent = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'charcoal'

const accentMap: Record<Accent, string> = {
  red: 'bg-brand-redLight text-brand-red',
  blue: 'bg-status-infoBg text-status-info',
  green: 'bg-status-successBg text-status-success',
  orange: 'bg-status-warningBg text-[#B45309]',
  purple: 'bg-purple-100 text-purple-600',
  charcoal: 'bg-slate-100 text-brand-charcoal',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'red',
  delta,
  hint,
  to,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: Accent
  delta?: number
  hint?: string
  to?: string
}) {
  const body = (
    <div className="group card p-4 transition hover:shadow-cardHover sm:p-5">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-semibold text-slate-500">{label}</span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accentMap[accent])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-2xl">{value}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {delta !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold',
              delta >= 0 ? 'text-status-success' : 'text-status-danger',
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}
