import { useMemo, useState } from 'react'
import { Boxes, Plus, Trash2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Field } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { QueryState } from '@/components/common/QueryState'
import {
  useServices,
  useSpareParts,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useCreateSparePart,
  useUpdateSparePart,
  useDeleteSparePart,
} from '@/hooks/data'
import { formatCurrency, cn } from '@/lib/utils'
import type { ServiceItem, SparePart } from '@/lib/types'

const SERVICE_CATEGORIES = ['General Service', 'Engine', 'Oil and Filters', 'Brake', 'Suspension', 'Steering', 'Clutch', 'Transmission', 'AC', 'Electrical', 'Battery', 'Tyres', 'Wheel Alignment', 'Washing', 'Detailing', 'Denting', 'Painting', 'Diagnostics', 'Body Repair']
const PART_CATEGORIES = ['Engine', 'Filters', 'Brake', 'Suspension', 'Steering', 'Clutch and Transmission', 'Electrical', 'Battery', 'AC', 'Fuel', 'Body', 'Tyres and Wheels', 'Fluids', 'Consumables']

export function Services() {
  const [tab, setTab] = useState<'services' | 'parts'>('services')

  return (
    <div>
      <SectionTitle title="Catalogue" subtitle="Manage services and spare parts — names & prices are editable" />

      <div className="mb-4 flex gap-2">
        <TabBtn active={tab === 'services'} onClick={() => setTab('services')} icon={<Wrench className="h-4 w-4" />} label="Services" />
        <TabBtn active={tab === 'parts'} onClick={() => setTab('parts')} icon={<Boxes className="h-4 w-4" />} label="Spare Parts" />
      </div>

      {tab === 'services' ? <ServicesTab /> : <PartsTab />}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition', active ? 'bg-brand-charcoal text-white' : 'border border-surface-border bg-white text-slate-600 hover:bg-surface-muted')}
    >
      {icon} {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Services tab
// ---------------------------------------------------------------------------
const BLANK_SERVICE = { name: '', category: 'General Service', labour_charge: 0, duration_mins: 0, tax_percent: 18, active: true }

function ServicesTab() {
  const [q, setQ] = useState('')
  const { data: all = [], isLoading, error } = useServices()
  const createSvc = useCreateService()
  const updateSvc = useUpdateService()
  const deleteSvc = useDeleteService()

  const [editing, setEditing] = useState<ServiceItem | null>(null)
  const [adding, setAdding] = useState(false)

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? all.filter((s) => s.name.toLowerCase().includes(t) || s.category.toLowerCase().includes(t)) : all
  }, [q, all])

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Service</Button>
      </div>
      <SearchFilterBar value={q} onChange={setQ} placeholder="Search services…" />
      <QueryState isLoading={isLoading} error={error} isEmpty={rows.length === 0} empty={<EmptyState icon={<Wrench className="h-6 w-6" />} title="No services" action={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Service</Button>} />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <button key={s.id} onClick={() => setEditing(s)} className="card p-4 text-left transition hover:shadow-cardHover">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-redLight text-brand-red"><Wrench className="h-5 w-5" /></span>
                <StatusBadge tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</StatusBadge>
              </div>
              <p className="mt-3 font-bold text-brand-charcoal">{s.name}</p>
              <p className="text-xs text-slate-400">{s.category}{s.duration_mins ? ` · ${s.duration_mins} min` : ''}</p>
              <p className="mt-2 text-lg font-extrabold text-brand-charcoal">{formatCurrency(s.labour_charge)} <span className="text-xs font-medium text-slate-400">labour</span></p>
            </button>
          ))}
        </div>
      </QueryState>

      {(adding || editing) && (
        <ServiceDialog
          initial={editing ?? BLANK_SERVICE}
          isEdit={!!editing}
          saving={createSvc.isPending || updateSvc.isPending}
          deleting={deleteSvc.isPending}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSave={async (form) => {
            try {
              if (editing) await updateSvc.mutateAsync({ id: editing.id, patch: form })
              else await createSvc.mutateAsync(form)
              toast.success(editing ? 'Service updated' : 'Service added')
              setAdding(false); setEditing(null)
            } catch (e) { toast.error(String((e as Error).message)) }
          }}
          onDelete={editing ? async () => {
            try { await deleteSvc.mutateAsync(editing.id); toast.success('Service deleted'); setEditing(null) }
            catch (e) { toast.error(String((e as Error).message)) }
          } : undefined}
        />
      )}
    </div>
  )
}

function ServiceDialog({ initial, isEdit, saving, deleting, onClose, onSave, onDelete }: {
  initial: Partial<ServiceItem>
  isEdit: boolean
  saving: boolean
  deleting?: boolean
  onClose: () => void
  onSave: (form: Record<string, unknown>) => void
  onDelete?: () => void
}) {
  const [f, setF] = useState({
    name: initial.name ?? '',
    category: initial.category ?? 'General Service',
    labour_charge: initial.labour_charge ?? 0,
    duration_mins: initial.duration_mins ?? 0,
    tax_percent: initial.tax_percent ?? 18,
    active: initial.active ?? true,
  })
  const [confirmDel, setConfirmDel] = useState(false)
  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  return (
    <>
      <Dialog open onClose={onClose} title={isEdit ? 'Edit Service' : 'Add Service'}>
        <div className="space-y-4 p-5">
          <Field label="Service Name" required><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. General Service" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select className="input-base" value={f.category} onChange={(e) => set('category', e.target.value)}>
                {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Labour Amount (₹)"><Input value={f.labour_charge} onChange={(e) => set('labour_charge', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Duration (min)"><Input value={f.duration_mins} onChange={(e) => set('duration_mins', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Tax %"><Input value={f.tax_percent} onChange={(e) => set('tax_percent', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-brand-red" /> Active
          </label>
          <div className="flex gap-3 pt-2">
            {onDelete && <Button variant="ghost" size="icon" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4 text-status-danger" /></Button>}
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={() => { if (!f.name.trim()) return toast.error('Name is required'); onSave(f) }}>Save</Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={() => { setConfirmDel(false); onDelete?.() }} title="Delete service?" description="This removes the service from the catalogue." confirmLabel="Delete" loading={deleting} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Spare parts tab
// ---------------------------------------------------------------------------
const BLANK_PART = { name: '', category: 'Engine', part_number: '', unit: 'Piece', purchase_price: 0, selling_price: 0, gst: 18, current_qty: 0, min_qty: 0, rack_location: '' }

function PartsTab() {
  const [q, setQ] = useState('')
  const { data: all = [], isLoading, error } = useSpareParts()
  const createPart = useCreateSparePart()
  const updatePart = useUpdateSparePart()
  const deletePart = useDeleteSparePart()

  const [editing, setEditing] = useState<SparePart | null>(null)
  const [adding, setAdding] = useState(false)

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? all.filter((p) => p.name.toLowerCase().includes(t) || (p.part_number ?? '').toLowerCase().includes(t)) : all
  }, [q, all])

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Spare Part</Button>
      </div>
      <SearchFilterBar value={q} onChange={setQ} placeholder="Search spare parts…" />
      <QueryState isLoading={isLoading} error={error} isEmpty={rows.length === 0} empty={<EmptyState icon={<Boxes className="h-6 w-6" />} title="No spare parts" action={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Spare Part</Button>} />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const low = p.current_qty <= p.min_qty
            return (
              <button key={p.id} onClick={() => setEditing(p)} className="card p-4 text-left transition hover:shadow-cardHover">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-infoBg text-status-info"><Boxes className="h-5 w-5" /></span>
                  <StatusBadge tone={low ? 'low' : 'success'}>Stock: {p.current_qty}</StatusBadge>
                </div>
                <p className="mt-3 font-bold text-brand-charcoal">{p.name}</p>
                <p className="text-xs text-slate-400">{p.category}{p.part_number ? ` · ${p.part_number}` : ''}</p>
                <p className="mt-2 text-lg font-extrabold text-brand-red">{formatCurrency(p.selling_price)} <span className="text-xs font-medium text-slate-400">/ {p.unit}</span></p>
              </button>
            )
          })}
        </div>
      </QueryState>

      {(adding || editing) && (
        <PartDialog
          initial={editing ?? BLANK_PART}
          isEdit={!!editing}
          saving={createPart.isPending || updatePart.isPending}
          deleting={deletePart.isPending}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSave={async (form) => {
            try {
              if (editing) await updatePart.mutateAsync({ id: editing.id, patch: form })
              else await createPart.mutateAsync({ ...form, active: true, opening_qty: form.current_qty })
              toast.success(editing ? 'Spare part updated' : 'Spare part added')
              setAdding(false); setEditing(null)
            } catch (e) { toast.error(String((e as Error).message)) }
          }}
          onDelete={editing ? async () => {
            try { await deletePart.mutateAsync(editing.id); toast.success('Spare part deleted'); setEditing(null) }
            catch (e) { toast.error(String((e as Error).message)) }
          } : undefined}
        />
      )}
    </div>
  )
}

function PartDialog({ initial, isEdit, saving, deleting, onClose, onSave, onDelete }: {
  initial: Partial<SparePart>
  isEdit: boolean
  saving: boolean
  deleting?: boolean
  onClose: () => void
  onSave: (form: Record<string, any>) => void
  onDelete?: () => void
}) {
  const [f, setF] = useState({
    name: initial.name ?? '',
    category: initial.category ?? 'Engine',
    part_number: initial.part_number ?? '',
    unit: initial.unit ?? 'Piece',
    purchase_price: initial.purchase_price ?? 0,
    selling_price: initial.selling_price ?? 0,
    gst: initial.gst ?? 18,
    current_qty: initial.current_qty ?? 0,
    min_qty: initial.min_qty ?? 0,
    rack_location: initial.rack_location ?? '',
  })
  const [confirmDel, setConfirmDel] = useState(false)
  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  return (
    <>
      <Dialog open onClose={onClose} title={isEdit ? 'Edit Spare Part' : 'Add Spare Part'}>
        <div className="max-h-[70vh] overflow-y-auto space-y-4 p-5">
          <Field label="Part Name" required><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Oil Filter" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select className="input-base" value={f.category} onChange={(e) => set('category', e.target.value)}>
                {PART_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Part Number"><Input value={f.part_number} onChange={(e) => set('part_number', e.target.value)} /></Field>
            <Field label="Purchase Price (₹)"><Input value={f.purchase_price} onChange={(e) => set('purchase_price', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Selling Amount (₹)"><Input value={f.selling_price} onChange={(e) => set('selling_price', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Unit">
              <select className="input-base" value={f.unit} onChange={(e) => set('unit', e.target.value)}>
                <option>Piece</option>
                <option>Set</option>
                <option>Litre</option>
                <option>Bottle</option>
                <option>Box</option>
              </select>
            </Field>
            <Field label="GST %"><Input value={f.gst} onChange={(e) => set('gst', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Current Stock"><Input value={f.current_qty} onChange={(e) => set('current_qty', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Min Stock"><Input value={f.min_qty} onChange={(e) => set('min_qty', Number(e.target.value) || 0)} inputMode="numeric" /></Field>
            <Field label="Rack Location"><Input value={f.rack_location} onChange={(e) => set('rack_location', e.target.value)} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            {onDelete && <Button variant="ghost" size="icon" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4 text-status-danger" /></Button>}
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={() => { if (!f.name.trim()) return toast.error('Name is required'); onSave(f) }}>Save</Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={() => { setConfirmDel(false); onDelete?.() }} title="Delete spare part?" description="It will no longer appear in the catalogue or job cards." confirmLabel="Delete" loading={deleting} />
    </>
  )
}
