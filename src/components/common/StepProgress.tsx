import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepProgress({
  steps,
  current,
  onStepClick,
}: {
  steps: string[]
  current: number
  onStepClick?: (i: number) => void
}) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={i > current}
              onClick={() => onStepClick?.(i)}
              className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition sm:h-9 sm:w-9 sm:text-sm',
                  done && 'bg-status-success text-white',
                  active && 'bg-brand-red text-white ring-2 ring-brand-red/15 sm:ring-4',
                  !done && !active && 'bg-surface-muted text-slate-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[11px] font-semibold sm:block',
                  active ? 'text-brand-charcoal' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn('mx-1 h-0.5 flex-1 rounded-full sm:mx-2', done ? 'bg-status-success' : 'bg-surface-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
