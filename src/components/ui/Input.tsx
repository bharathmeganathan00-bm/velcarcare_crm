import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
          <input ref={ref} className={cn('input-base pl-10', className)} {...props} />
        </div>
      )
    }
    return <input ref={ref} className={cn('input-base', className)} {...props} />
  },
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('input-base h-auto min-h-[88px] py-2.5 resize-y', className)}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-sm font-semibold text-slate-700', className)} {...props}>
      {children}
    </label>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      {label && (
        <Label>
          {label}
          {required && <span className="text-brand-red"> *</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-status-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
