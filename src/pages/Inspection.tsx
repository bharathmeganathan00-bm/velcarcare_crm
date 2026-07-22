import { useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle } from '@/components/ui/Misc'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { INSPECTION_ITEMS, INSPECTION_ICONS } from '@/lib/inspection'
import { cn } from '@/lib/utils'

/** Single source of truth for items + icons lives in @/lib/inspection. */
const ITEMS = INSPECTION_ITEMS.map((label) => ({ label, icon: INSPECTION_ICONS[label] }))

const STATUSES = [
  { key: 'good', label: 'Good', tone: 'bg-status-successBg text-status-success' },
  { key: 'attention', label: 'Needs Attention', tone: 'bg-status-warningBg text-[#B45309]' },
  { key: 'urgent', label: 'Urgent', tone: 'bg-status-dangerBg text-status-danger' },
  { key: 'na', label: 'N/A', tone: 'bg-slate-100 text-slate-500' },
]

export function Inspection() {
  const [values, setValues] = useState<Record<string, string>>({})

  return (
    <div>
      <SectionTitle
        title="Inspection Checklist"
        subtitle="Record vehicle condition before service"
        action={<Button onClick={() => toast.success('Inspection saved')}><Save className="h-4 w-4" /> Save Inspection</Button>}
      />
      <Card>
        <CardContent className="space-y-2">
          {ITEMS.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col gap-2 rounded-xl border border-surface-border p-3 transition hover:border-slate-300 hover:bg-surface-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-3 font-semibold text-brand-charcoal">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-charcoal">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                {label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setValues((v) => ({ ...v, [label]: s.key }))}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                      values[label] === s.key ? s.tone + ' ring-2 ring-current/20' : 'bg-white text-slate-400 border border-surface-border hover:bg-surface-muted',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
