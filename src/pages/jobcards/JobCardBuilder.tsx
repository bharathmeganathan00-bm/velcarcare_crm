import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, ClipboardList, FileText, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { ServiceCard, SparePartCard } from '@/components/catalogue/CatalogueCards'
import { QuantitySelector } from '@/components/common/ActionButtons'
import { useCreateJobCard, useServices, useSpareParts, useVehicles } from '@/hooks/data'
import { saveInspection } from '@/lib/api'
import { inspectionToArray, type InspectionMap } from '@/lib/inspection'
import { formatCurrency, cn } from '@/lib/utils'

const PART_TABS = ['Recommended', 'Engine', 'Filters', 'Brake', 'Electrical', 'Battery', 'Body', 'Fluids', 'All Parts']

export function JobCardBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  const navState = (location.state as { vehicleId?: string; inspection?: InspectionMap } | null) ?? {}
  const prefillVehicleId = navState.vehicleId
  const inspection = navState.inspection
  const { data: vehicles = [], isLoading: vLoading } = useVehicles()
  const { data: services = [] } = useServices()
  const { data: allParts = [] } = useSpareParts()
  const createJobCard = useCreateJobCard()

  const [vehicleId, setVehicleId] = useState(prefillVehicleId ?? '')
  const [tab, setTab] = useState<'services' | 'parts'>('services')
  const [partTab, setPartTab] = useState('Recommended')
  const [partQuery, setPartQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({})
  const [partQty, setPartQty] = useState<Record<string, number>>({})
  const [labour, setLabour] = useState(0)
  const [complaints, setComplaints] = useState('')

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0]

  const parts = useMemo(() => {
    const q = partQuery.trim().toLowerCase()
    let list = allParts
    if (partTab !== 'Recommended' && partTab !== 'All Parts') list = list.filter((p) => p.category === partTab)
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.part_number ?? '').toLowerCase().includes(q))
    return list
  }, [partTab, partQuery, allParts])

  const servicesTotal = services.filter((s) => selectedServices[s.id]).reduce((sum, s) => sum + s.labour_charge, 0)
  const partsTotal = allParts.reduce((sum, p) => sum + (partQty[p.id] ?? 0) * p.selling_price, 0)

  if (!vLoading && vehicles.length === 0) {
    return (
      <EmptyState
        icon={<Car className="h-6 w-6" />}
        title="Add a vehicle first"
        description="Create a customer and vehicle before starting a job card."
        action={<Link to="/customers/new"><Button>Add Customer & Vehicle</Button></Link>}
      />
    )
  }
  if (!vehicle) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>
  const grand = servicesTotal + partsTotal + labour
  const selectedCount = Object.values(selectedServices).filter(Boolean).length
  const partCount = Object.values(partQty).filter((n) => n > 0).length

  function toggleService(id: string) {
    setSelectedServices((s) => ({ ...s, [id]: !s[id] }))
  }
  function addPart(id: string) {
    setPartQty((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }))
  }

  // Build the selected line items for saving / handing to the invoice.
  function collect() {
    const selServices = services
      .filter((s) => selectedServices[s.id])
      .map((s) => ({ id: s.id, name: s.name, labour_charge: s.labour_charge }))
    const selParts = allParts
      .filter((p) => (partQty[p.id] ?? 0) > 0)
      .map((p) => ({ id: p.id, name: p.name, qty: partQty[p.id], price: p.selling_price }))
    return { selServices, selParts }
  }

  async function saveJobCard(status: string) {
    const { selServices, selParts } = collect()
    if (selServices.length === 0 && selParts.length === 0 && labour === 0) {
      toast.error('Add at least one service, part or labour charge')
      return null
    }
    const res = await createJobCard.mutateAsync({
      vehicle,
      complaints,
      services: selServices,
      parts: selParts,
      labour,
      status,
    })
    // Persist the wizard inspection against this job card (best-effort).
    if (inspection && res?.id) {
      try {
        await saveInspection(res.id, vehicle.id, inspectionToArray(inspection))
      } catch {
        /* non-fatal */
      }
    }
    return res
  }

  async function onSave() {
    const res = await saveJobCard('received')
    if (res) {
      toast.success(`Job card ${res.jobcard_no} saved`)
      navigate(`/job-cards/${res.id}`)
    }
  }

  async function onGenerateInvoice() {
    const { selServices, selParts } = collect()
    const res = await saveJobCard('in_service')
    if (!res) return
    toast.success(`Job card ${res.jobcard_no} created`)
    navigate('/invoices/new', {
      state: { jobCardId: res.id, vehicleId: vehicle.id, services: selServices, parts: selParts, labour, complaints, inspection },
    })
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title="New Job Card" subtitle={`${vehicle.brand} ${vehicle.model} · ${vehicle.reg_number}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <CardHeader><CardTitle>Vehicle & Complaints</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select className="input-base" value={vehicle.id} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.reg_number} · {v.customer_name}</option>
                ))}
              </select>
              <Textarea value={complaints} onChange={(e) => setComplaints(e.target.value)} placeholder="e.g. AC not cooling, noise from front left wheel…" />
            </CardContent>
          </Card>

          <Card>
            <div className="flex gap-1 border-b border-surface-border p-2">
              <button onClick={() => setTab('services')} className={cn('flex-1 rounded-xl py-2 text-sm font-bold transition', tab === 'services' ? 'bg-brand-red text-white' : 'text-slate-500 hover:bg-surface-muted')}>
                Services ({selectedCount})
              </button>
              <button onClick={() => setTab('parts')} className={cn('flex-1 rounded-xl py-2 text-sm font-bold transition', tab === 'parts' ? 'bg-brand-red text-white' : 'text-slate-500 hover:bg-surface-muted')}>
                Spare Parts ({partCount})
              </button>
            </div>
            <CardContent>
              {tab === 'services' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <ServiceCard key={s.id} service={s} selected={!!selectedServices[s.id]} onToggle={() => toggleService(s.id)} />
                  ))}
                  {services.length === 0 && <p className="col-span-full py-6 text-center text-sm text-slate-400">No services in the catalogue yet.</p>}
                </div>
              ) : (
                <div>
                  <div className="mb-3 rounded-xl bg-status-infoBg/50 px-3 py-2 text-xs font-medium text-status-info">
                    Showing parts compatible with {vehicle.brand} {vehicle.model} {vehicle.year} first.
                  </div>
                  <Input icon={<Search className="h-4 w-4" />} value={partQuery} onChange={(e) => setPartQuery(e.target.value)} placeholder="Search parts…" className="mb-3" />
                  <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                    {PART_TABS.map((t) => (
                      <button key={t} onClick={() => setPartTab(t)} className={cn('shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition', partTab === t ? 'bg-brand-charcoal text-white' : 'bg-surface-muted text-slate-500')}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {parts.map((p) => (
                      <div key={p.id}>
                        <SparePartCard part={p} qty={partQty[p.id] ?? 0} onAdd={() => addPart(p.id)} />
                        {(partQty[p.id] ?? 0) > 0 && (
                          <div className="mt-1 flex items-center justify-end gap-2 pr-1">
                            <span className="text-xs text-slate-400">Qty</span>
                            <QuantitySelector value={partQty[p.id]} onChange={(v) => setPartQty((q) => ({ ...q, [p.id]: v }))} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-brand-red" /> Job Card Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label={`Services (${selectedCount})`} value={servicesTotal} />
              <Row label={`Spare Parts (${partCount})`} value={partsTotal} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Labour Charges</span>
                <input
                  value={labour}
                  onChange={(e) => setLabour(Number(e.target.value) || 0)}
                  className="w-24 rounded-lg border border-surface-border px-2 py-1 text-right text-sm font-bold"
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-surface-border pt-3">
                <span className="font-bold text-brand-charcoal">Grand Total (Est.)</span>
                <span className="text-xl font-extrabold text-brand-red">{formatCurrency(grand)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" loading={createJobCard.isPending} onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
                <Button loading={createJobCard.isPending} onClick={onGenerateInvoice}><FileText className="h-4 w-4" /> Invoice</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-brand-charcoal">{formatCurrency(value)}</span>
    </div>
  )
}
