import { Minus, Phone, Plus } from 'lucide-react'
import { telLink, whatsAppLink } from '@/lib/utils'
import { cn } from '@/lib/utils'

/** Standalone WhatsApp glyph (inherits currentColor). */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('fill-current', className)} aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2-1 2.1s.1 2.1 1.6 4.1c2.1 2.9 3.7 3.5 4.7 3.9 1.5.5 2.3.4 2.7.3.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.1-.6-.2z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
    </svg>
  )
}

/** Inline WhatsApp icon (brand green). */
export function WhatsAppButton({
  phone,
  message,
  className,
  label,
}: {
  phone?: string | null
  message?: string
  className?: string
  label?: string
}) {
  return (
    <a
      href={whatsAppLink(phone, message)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-semibold text-white transition hover:brightness-95 active:scale-95',
        label ? 'h-10' : 'h-10 w-10',
        className,
      )}
      aria-label="WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2-1 2.1s.1 2.1 1.6 4.1c2.1 2.9 3.7 3.5 4.7 3.9 1.5.5 2.3.4 2.7.3.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.1-.6-.2z" />
        <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
      </svg>
      {label}
    </a>
  )
}

export function CallButton({ phone, className }: { phone?: string | null; className?: string }) {
  return (
    <a
      href={telLink(phone)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-status-successBg text-status-success transition hover:brightness-95 active:scale-95',
        className,
      )}
      aria-label="Call"
    >
      <Phone className="h-5 w-5" />
    </a>
  )
}

export function QuantitySelector({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  const decimals = (() => {
    const s = String(step)
    if (s.includes('.')) return s.split('.')[1].length
    return 0
  })()

  function decFormat(n: number) {
    return decimals > 0 ? Number(n.toFixed(decimals)) : n
  }

  return (
    <div className="inline-flex items-center rounded-xl border border-surface-border">
      <button
        type="button"
        onClick={() => onChange(decFormat(Math.max(min, +(value - step))))}
        className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-500 hover:bg-surface-muted disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-12 text-center text-sm font-bold text-brand-charcoal">{decimals > 0 ? value.toFixed(decimals) : String(value)}</span>
      <button
        type="button"
        onClick={() => onChange(decFormat(Math.min(max, +(value + step))))}
        className="flex h-9 w-9 items-center justify-center rounded-r-xl text-slate-500 hover:bg-surface-muted disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
