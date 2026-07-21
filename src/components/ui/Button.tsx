import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-red text-white hover:bg-brand-redDark focus-visible:ring-brand-red/25 shadow-sm',
        charcoal: 'bg-brand-charcoal text-white hover:bg-brand-charcoalLight focus-visible:ring-brand-charcoal/25',
        success: 'bg-status-success text-white hover:brightness-95 focus-visible:ring-status-success/25',
        info: 'bg-status-info text-white hover:brightness-95 focus-visible:ring-status-info/25',
        outline: 'border border-surface-border bg-white text-brand-ink hover:bg-surface-muted focus-visible:ring-slate-200',
        ghost: 'text-brand-ink hover:bg-surface-muted focus-visible:ring-slate-200',
        subtle: 'bg-brand-redLight text-brand-red hover:bg-brand-red/15 focus-visible:ring-brand-red/20',
        danger: 'bg-status-danger text-white hover:brightness-95 focus-visible:ring-status-danger/25',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-[15px]',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
        iconSm: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
