import { useState } from 'react'
import { SearchCheck, Save } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle } from '@/components/ui/Misc'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const ITEMS = [
  'Engine Oil', 'Coolant', 'Battery', 'Tyres', 'Brakes', 'Lights', 'Horn', 'AC',
  'Suspension', 'Steering', 'Clutch', 'Gearbox', 'Wipers', 'Fluid Leakage', 'Body Damage', 'Interior Condition',
]
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
          {ITEMS.map((item) => (
            <div key={item} className="flex flex-col gap-2 rounded-xl border border-surface-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 font-semibold text-brand-charcoal">
                <SearchCheck className="h-4 w-4 text-slate-400" /> {item}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setValues((v) => ({ ...v, [item]: s.key }))}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                      values[item] === s.key ? s.tone + ' ring-2 ring-current/20' : 'bg-white text-slate-400 border border-surface-border hover:bg-surface-muted',
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
