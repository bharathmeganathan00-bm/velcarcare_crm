import {
  BarChart3,
  Car,
  Download,
  IndianRupee,
  Percent,
  ReceiptText,
  Users,
  Wrench,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { SectionTitle } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/common/StatCard'
import { DASHBOARD, REVENUE_TREND } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

const REPORTS = [
  { label: 'Daily Revenue', icon: IndianRupee },
  { label: 'Monthly Revenue', icon: BarChart3 },
  { label: 'Invoice Report', icon: ReceiptText },
  { label: 'Pending Payments', icon: IndianRupee },
  { label: 'Job Card Report', icon: Wrench },
  { label: 'Customer Report', icon: Users },
  { label: 'Vehicle Report', icon: Car },
  { label: 'GST Report', icon: Percent },
]

export function Reports() {
  return (
    <div>
      <SectionTitle
        title="Reports"
        subtitle="Business performance & exports"
        action={<Button variant="outline"><Download className="h-4 w-4" /> Export All</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={formatCurrency(DASHBOARD.todayRevenue)} icon={IndianRupee} accent="green" delta={DASHBOARD.revenueGrowth} />
        <StatCard label="Monthly Revenue" value={formatCurrency(DASHBOARD.monthRevenue)} icon={BarChart3} accent="charcoal" />
        <StatCard label="Completed Jobs" value={DASHBOARD.completedJobs} icon={Wrench} accent="blue" />
        <StatCard label="Pending Amount" value={formatCurrency(DASHBOARD.pendingPayments)} icon={IndianRupee} accent="red" />
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Weekly Revenue</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={REVENUE_TREND} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F2" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13 }} cursor={{ fill: '#F5F6F8' }} />
                <Bar dataKey="revenue" fill="#E11D2A" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <p className="mb-3 text-sm font-bold text-slate-500">All Reports</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {REPORTS.map((r) => (
          <button key={r.label} className="card flex items-center gap-3 p-4 text-left transition hover:shadow-cardHover">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-brand-charcoal"><r.icon className="h-5 w-5" /></span>
            <span className="text-sm font-bold text-brand-charcoal">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
