import { cn, initials } from '@/lib/utils'

/** Circular avatar with initials fallback. */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-charcoal font-bold text-white',
        className,
      )}
    >
      {initials(name)}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-brand-charcoal">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
