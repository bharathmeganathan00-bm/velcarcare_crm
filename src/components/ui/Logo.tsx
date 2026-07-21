import { cn } from '@/lib/utils'

/**
 * VELCARCARE logo. Uses the SVG in /public/logo.svg.
 * Replace public/logo.svg (or public/logo.png) with the official artwork and
 * this component picks it up everywhere: login, sidebar, invoices, PDFs.
 */
export function Logo({
  className,
  variant = 'full',
}: {
  className?: string
  variant?: 'full' | 'mark'
}) {
  return (
    <img
      src="/logo.svg"
      alt="VELCARCARE"
      className={cn(variant === 'mark' ? 'h-9 w-auto' : 'h-10 w-auto', className)}
    />
  )
}

/** Text-only lockup for tight/dark contexts. */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-extrabold tracking-tight', className)}>
      <span className="text-[#5b64ff]">VEL</span>
      <span className="text-brand-red">CARCARE</span>
    </span>
  )
}
