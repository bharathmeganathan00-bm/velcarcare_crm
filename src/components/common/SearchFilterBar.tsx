import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export function SearchFilterBar({
  value,
  onChange,
  placeholder = 'Search…',
  filters,
  active,
  onFilter,
  right,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  filters?: { key: string; label: string }[]
  active?: string
  onFilter?: (key: string) => void
  right?: React.ReactNode
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2">
        <Input
          icon={<Search className="h-4 w-4" />}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {right}
      </div>
      {filters && filters.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilter?.(f.key)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                active === f.key
                  ? 'border-brand-red bg-brand-red text-white'
                  : 'border-surface-border bg-white text-slate-600 hover:bg-surface-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
