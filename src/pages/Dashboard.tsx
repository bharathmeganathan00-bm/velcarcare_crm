import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Car,
  ClipboardList,
  CheckCircle2,
  Wallet,
  Plus,
  ReceiptText,
  UserPlus,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge, JOBCARD_STATUS } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Misc'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useDashboard, useInvoices, useJobCards } from '@/hooks/data'

const QUICK = [
  { label: 'Add Customer', to: '/customers/new', icon: UserPlus, color: 'bg-brand-red' },
  { label: 'New Job Card', to: '/job-cards/new', icon: ClipboardList, color: 'bg-status-info' },
  { label: 'New Invoice', to: '/invoices/new', icon: ReceiptText, color: 'bg-status-success' },
]

const STATUS_COLORS: Record<string, string> = {
  received: '#2563EB', inspection: '#0EA5E9', estimate_pending: '#F59E0B',
  awaiting_approval: '#F59E0B', in_service: '#F59E0B', waiting_parts: '#EF4444',
  quality_check: '#0EA5E9', ready: '#16A34A', delivered: '#16A34A', cancelled: '#94A3B8',
}

export function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboard()
  const { data: jobcards = [] } = useJobCards()
  const { data: invoices = [] } = useInvoices()

  const pendingPayments = invoices.reduce((s, i) => s + i.balance, 0)
  const activeJobs = jobcards.filter((j) => !['delivered', 'cancelled'].includes(j.status))

  // Job-card status distribution from live data
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {}
    activeJobs.forEach((j) => { counts[j.status] = (counts[j.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, value]) => ({
      name: JOBCARD_STATUS[status]?.label ?? status,
      value,
      color: STATUS_COLORS[status] ?? '#94A3B8',
    }))
  }, [activeJobs])
  const totalActive = distribution.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-2xl">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">Here's what's happening at the workshop today.</p>
        </div>
        <Link to="/job-cards/new">
          <Button><Plus className="h-4 w-4" /> New Job Card</Button>
        </Link>
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard label="Total Customers" value={formatNumber(stats?.totalCustomers ?? 0)} icon={Users} accent="red" to="/customers" />
          <StatCard label="Total Vehicles" value={formatNumber(stats?.totalVehicles ?? 0)} icon={Car} accent="blue" to="/vehicles" />
          <StatCard label="Active Job Cards" value={stats?.activeJobCards ?? 0} icon={ClipboardList} accent="orange" hint="in progress" to="/job-cards" />
          <StatCard label="Ready for Delivery" value={stats?.readyForDelivery ?? 0} icon={CheckCircle2} accent="green" hint="waiting pickup" to="/job-cards" />
          <StatCard label="Pending Payments" value={formatCurrency(pendingPayments)} icon={Wallet} accent="red" hint={`${invoices.filter((i) => i.balance > 0).length} invoices`} to="/payments" />
          <StatCard label="Invoices" value={invoices.length} icon={ReceiptText} accent="charcoal" to="/invoices" />
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK.map((a) => (
            <Link key={a.label} to={a.to} className="flex items-center gap-3 rounded-2xl border border-surface-border bg-white p-3 transition hover:shadow-cardHover">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-brand-charcoal">{a.label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Job card status donut */}
        <Card>
          <CardHeader>
            <CardTitle>Job Card Status</CardTitle>
            <Link to="/job-cards" className="text-xs font-semibold text-brand-red hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {totalActive === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No active job cards.</p>
            ) : (
              <>
                <div className="relative mx-auto h-44 w-44">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={distribution} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none">
                        {distribution.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-brand-charcoal">{totalActive}</span>
                    <span className="text-xs text-slate-400">Active</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {distribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="flex-1 text-slate-600">{d.name}</span>
                      <span className="font-bold text-brand-charcoal">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent job cards */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Cards</CardTitle>
            <Link to="/job-cards" className="text-xs font-semibold text-brand-red hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {jobcards.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No job cards yet.</p>}
            {jobcards.slice(0, 5).map((j) => {
              const s = JOBCARD_STATUS[j.status]
              return (
                <Link key={j.id} to={`/job-cards/${j.id}`} className="flex items-center gap-3 rounded-xl border border-surface-border p-3 hover:bg-surface-muted">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-charcoal">{j.jobcard_no} · {j.customer_name}</p>
                    <p className="truncate text-xs text-slate-400">{j.reg_number} · {j.vehicle_label}</p>
                  </div>
                  <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {invoices.length === 0 && jobcards.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Your workshop is ready"
          description="Add your first customer and create a job card to see live activity here."
          action={<Link to="/customers/new"><Button><UserPlus className="h-4 w-4" /> Add Customer</Button></Link>}
        />
      )}
    </div>
  )
}
