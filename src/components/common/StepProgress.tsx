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
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition',
                  done && 'bg-status-success text-white',
                  active && 'bg-brand-red text-white ring-4 ring-brand-red/15',
                  !done && !active && 'bg-surface-muted text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
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
              <div className={cn('mx-2 h-0.5 flex-1 rounded-full', done ? 'bg-status-success' : 'bg-surface-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
