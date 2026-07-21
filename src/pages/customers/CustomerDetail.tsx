import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, Mail, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, Avatar, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Field, Textarea } from '@/components/ui/Input'
import { StatCard } from '@/components/common/StatCard'
import { CallButton, WhatsAppButton } from '@/components/common/ActionButtons'
import { StatusBadge, JOBCARD_STATUS } from '@/components/ui/StatusBadge'
import { useCustomer, useCustomerVehicles, useJobCards, useUpdateCustomer, useDeleteCustomer } from '@/hooks/data'
import { formatCurrency } from '@/lib/utils'
import { Car as CarIcon, ReceiptText, Wrench } from 'lucide-react'
import type { Customer } from '@/lib/types'

export function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: customer, isLoading } = useCustomer(id)
  const { data: vehicles = [] } = useCustomerVehicles(id)
  const { data: allJobs = [] } = useJobCards()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>
  if (!customer) return <EmptyState title="Customer not found" action={<Link to="/customers"><Button>Back to list</Button></Link>} />

  const jobcards = allJobs.filter((j) => j.customer_id === customer.id)

  async function onDelete() {
    try {
      await deleteCustomer.mutateAsync(customer!.id)
      toast.success('Customer deleted')
      navigate('/customers')
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle
          title={customer.name}
          subtitle={customer.phone}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
              <Button variant="ghost" size="iconSm" onClick={() => setDelOpen(true)}><Trash2 className="h-4 w-4 text-status-danger" /></Button>
            </div>
          }
        />
      </div>

      {editOpen && (
        <EditCustomerDialog
          customer={customer}
          saving={updateCustomer.isPending}
          onClose={() => setEditOpen(false)}
          onSave={async (patch) => {
            try {
              await updateCustomer.mutateAsync({ id: customer.id, patch })
              toast.success('Customer updated')
              setEditOpen(false)
            } catch (e) {
              toast.error(String((e as Error).message))
            }
          }}
        />
      )}
      <ConfirmDialog
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={onDelete}
        title={`Delete ${customer.name}?`}
        description="This removes the customer and hides their vehicles. Job cards and invoices are kept for records. This can't be undone."
        confirmLabel="Delete"
        loading={deleteCustomer.isPending}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar name={customer.name} size={56} />
              <div>
                <p className="font-bold text-brand-charcoal">{customer.name}</p>
                <p className="text-sm text-slate-500">{customer.phone}</p>
              </div>
            </div>
            {customer.email && <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" /> {customer.email}</p>}
            {customer.address && <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {customer.address}</p>}
            <div className="mt-4 flex gap-2">
              <CallButton phone={customer.phone} />
              <WhatsAppButton phone={customer.whatsapp ?? customer.phone} label="WhatsApp" className="flex-1" message={`Dear ${customer.name}, greetings from VELCARCARE.`} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatCard label="Vehicles" value={vehicles.length} icon={CarIcon} accent="blue" />
          <StatCard label="Job Cards" value={jobcards.length} icon={Wrench} accent="orange" />
          <StatCard label="Lifetime Value" value={formatCurrency(customer.total_spent)} icon={ReceiptText} accent="green" />
          <StatCard label="Since" value={customer.created_at.slice(0, 7)} icon={CarIcon} accent="charcoal" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicles</CardTitle>
            <Link to="/vehicles/new"><Button size="sm" variant="subtle"><Plus className="h-4 w-4" /> Add</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {vehicles.map((v) => (
              <Link key={v.id} to={`/vehicles/${v.id}`} className="flex items-center gap-3 rounded-xl border border-surface-border p-3 hover:bg-surface-muted">
                <Car className="h-5 w-5 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-brand-charcoal">{v.brand} {v.model}</p>
                  <p className="text-xs text-brand-red">{v.reg_number}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Job Cards</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {jobcards.map((j) => {
              const s = JOBCARD_STATUS[j.status]
              return (
                <Link key={j.id} to={`/job-cards/${j.id}`} className="flex items-center gap-3 rounded-xl border border-surface-border p-3 hover:bg-surface-muted">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-charcoal">{j.jobcard_no}</p>
                    <p className="text-xs text-slate-400">{j.vehicle_label}</p>
                  </div>
                  <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                </Link>
              )
            })}
            {jobcards.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No job cards yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EditCustomerDialog({
  customer,
  saving,
  onClose,
  onSave,
}: {
  customer: Customer
  saving: boolean
  onClose: () => void
  onSave: (patch: Record<string, unknown>) => void
}) {
  const [f, setF] = useState({
    name: customer.name,
    phone: customer.phone,
    whatsapp: customer.whatsapp ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
  })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  return (
    <Dialog open onClose={onClose} title="Edit Customer">
      <div className="space-y-4 p-5">
        <Field label="Customer Name" required><Input value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" required><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="numeric" /></Field>
          <Field label="WhatsApp"><Input value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Same as phone" inputMode="numeric" /></Field>
        </div>
        <Field label="Email"><Input value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Address"><Textarea value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Notes"><Textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={saving}
            onClick={() => {
              if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 10) return toast.error('Valid name and phone are required')
              onSave(f)
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
