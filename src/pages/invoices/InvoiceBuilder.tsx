import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, Download, Printer, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { StepProgress } from '@/components/common/StepProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ServiceCard, SparePartCard } from '@/components/catalogue/CatalogueCards'
import { QuantitySelector, WhatsAppButton } from '@/components/common/ActionButtons'
import { useSettings } from '@/context/SettingsContext'
import { useCreateInvoice, useServices, useSpareParts, useVehicles } from '@/hooks/data'
import { createJobCard, saveInspection } from '@/lib/api'
import { downloadInvoicePdf, type InvoiceLine } from '@/lib/pdf'
import { inspectionToArray, type InspectionMap } from '@/lib/inspection'
import { formatCurrency, cn } from '@/lib/utils'

const STEPS = ['Customer & Vehicle', 'Services & Parts', 'Payment & Review']

interface PrefillState {
  jobCardId?: string
  vehicleId?: string
  services?: { id: string; name: string; labour_charge: number }[]
  parts?: { id: string; name: string; qty: number; price: number }[]
  labour?: number
  inspection?: InspectionMap
}

export function InvoiceBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as PrefillState | null) ?? {}
  const { settings } = useSettings()
  const { data: vehicles = [], isLoading: vLoading } = useVehicles()
  const { data: allServices = [] } = useServices()
  const { data: allParts = [] } = useSpareParts()
  const createInvoice = useCreateInvoice()

  const [step, setStep] = useState(0)
  const [vehicleId, setVehicleId] = useState(prefill.vehicleId ?? '')
  // Selections start blank; prefilled only when coming from a job card.
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>(
    () => Object.fromEntries((prefill.services ?? []).map((s) => [s.id, true])),
  )
  const [partQty, setPartQty] = useState<Record<string, number>>(
    () => Object.fromEntries((prefill.parts ?? []).map((p) => [p.id, p.qty])),
  )
  const [labour, setLabour] = useState(prefill.labour ?? 0)
  const [discount, setDiscount] = useState(0)
  const [paid, setPaid] = useState(0)
  const [method, setMethod] = useState('Cash')
  const [partQuery, setPartQuery] = useState('')

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0]

  const chosenServices = allServices.filter((s) => selectedServices[s.id])
  const chosenParts = allParts.filter((p) => (partQty[p.id] ?? 0) > 0)

  const servicesLines: InvoiceLine[] = chosenServices.map((s) => ({ description: s.name, qty: 1, rate: s.labour_charge, amount: s.labour_charge }))
  const partsLines: InvoiceLine[] = chosenParts.map((p) => ({ description: p.name, qty: partQty[p.id], rate: p.selling_price, amount: partQty[p.id] * p.selling_price }))

  const subtotal = [...servicesLines, ...partsLines].reduce((s, l) => s + l.amount, 0) + labour - discount
  const cgst = settings.gst_enabled ? Math.round((subtotal * settings.cgst_percent) / 100) : 0
  const sgst = settings.gst_enabled ? Math.round((subtotal * settings.sgst_percent) / 100) : 0
  const grand = subtotal + cgst + sgst
  const balance = grand - paid

  const filteredParts = useMemo(() => {
    const t = partQuery.trim().toLowerCase()
    return t ? allParts.filter((p) => p.name.toLowerCase().includes(t) || (p.part_number ?? '').toLowerCase().includes(t)) : allParts
  }, [partQuery, allParts])

  if (!vLoading && vehicles.length === 0) {
    return (
      <EmptyState
        icon={<Car className="h-6 w-6" />}
        title="Add a vehicle first"
        description="Create a customer and vehicle before raising an invoice."
        action={<Link to="/customers/new"><Button>Add Customer & Vehicle</Button></Link>}
      />
    )
  }
  if (!vehicle) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>

  const inspectionItems = prefill.inspection ? inspectionToArray(prefill.inspection) : []

  const invoiceData = {
    invoiceNo: 'Draft',
    date: '',
    jobCardNo: prefill.jobCardId ? 'Linked' : undefined,
    customerName: vehicle.customer_name ?? 'Customer',
    customerPhone: '',
    vehicleLabel: `${vehicle.brand} ${vehicle.model} · ${vehicle.year ?? ''}`,
    regNumber: vehicle.reg_number,
    odometer: vehicle.odometer,
    services: servicesLines,
    parts: partsLines,
    labour,
    discount,
    cgst,
    sgst,
    grandTotal: grand,
    paid,
    balance,
    inspection: inspectionItems,
  }

  function toggleService(id: string) {
    setSelectedServices((s) => ({ ...s, [id]: !s[id] }))
  }
  function addPart(id: string) {
    setPartQty((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }))
  }

  async function confirm() {
    if (servicesLines.length === 0 && partsLines.length === 0 && labour === 0) {
      toast.error('Add at least one service, part or labour charge')
      return
    }
    const services = chosenServices.map((s) => ({ id: s.id, name: s.name, labour_charge: s.labour_charge }))
    const parts = chosenParts.map((p) => ({ id: p.id, name: p.name, qty: partQty[p.id], price: p.selling_price }))
    try {
      // Auto-create a backing job card (with the inspection) when the invoice
      // isn't already linked to one — keeps records intact without a separate page.
      let jobCardId = prefill.jobCardId ?? null
      if (!jobCardId) {
        const jc = await createJobCard({ vehicle, complaints: '', services, parts, labour, status: 'delivered' })
        jobCardId = jc.id
        if (inspectionItems.length) {
          try { await saveInspection(jc.id, vehicle.id, inspectionItems) } catch { /* non-fatal */ }
        }
      }

      const res = await createInvoice.mutateAsync({
        vehicle,
        jobCardId,
        isGst: settings.gst_enabled,
        services,
        parts,
        labour,
        discount,
        cgstPercent: settings.cgst_percent,
        sgstPercent: settings.sgst_percent,
        paid,
        method,
      })
      toast.success(`Invoice ${res.invoice_no} confirmed`)
      navigate(`/invoices/${res.id}`)
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  async function download() {
    await downloadInvoicePdf(settings, { ...invoiceData, invoiceNo: 'PREVIEW', date: new Date().toISOString().slice(0, 10) })
    toast.success('Preview PDF downloaded')
  }

  const waMessage = `Dear ${invoiceData.customerName},\nYour vehicle service invoice from VELCARCARE is ready.\n\nVehicle: ${invoiceData.regNumber}\nTotal: ${formatCurrency(grand)}\nPaid: ${formatCurrency(paid)}\nBalance: ${formatCurrency(balance)}\n\nThank you for choosing VELCARCARE.`

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title="Create Invoice" subtitle={STEPS[step]} />
      </div>

      <div className="mb-6"><StepProgress steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} /></div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 0 && (
            <Card>
              <CardHeader><CardTitle>Customer & Vehicle</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <select className="input-base" value={vehicle.id} onChange={(e) => setVehicleId(e.target.value)}>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.reg_number} · {v.customer_name}</option>
                  ))}
                </select>
                <Field label="Customer" value={invoiceData.customerName} />
                <Field label="Vehicle" value={invoiceData.vehicleLabel} />
                <Field label="Registration" value={invoiceData.regNumber} />
                {prefill.jobCardId && <Field label="Linked Job Card" value="Yes — items carried over" />}

                {inspectionItems.length > 0 && (
                  <div className="rounded-xl border border-surface-border p-3">
                    <p className="mb-2 text-sm font-bold text-brand-charcoal">Inspection Report</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {inspectionItems.map((i) => (
                        <div key={i.item} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{i.item}</span>
                          <span className={cn('font-semibold', i.status === 'good' ? 'text-status-success' : 'text-status-danger')}>
                            {i.status === 'good' ? 'Good' : 'Not OK'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader><CardTitle>Add Services & Spare Parts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Services</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {allServices.map((s) => (
                      <ServiceCard key={s.id} service={s} selected={!!selectedServices[s.id]} onToggle={() => toggleService(s.id)} />
                    ))}
                    {allServices.length === 0 && <p className="col-span-full py-4 text-center text-sm text-slate-400">No services in the catalogue.</p>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Spare Parts</p>
                  <Input icon={<Search className="h-4 w-4" />} value={partQuery} onChange={(e) => setPartQuery(e.target.value)} placeholder="Search parts…" className="mb-2" />
                  <div className="space-y-2">
                    {filteredParts.map((p) => (
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
                <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-slate-600">Labour Charges (₹)</span>
                  <input value={labour} onChange={(e) => setLabour(Number(e.target.value) || 0)} className="w-28 rounded-lg border border-surface-border px-2 py-1 text-right text-sm font-bold" inputMode="numeric" />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-700">Payment Method</p>
                  <div className="flex flex-wrap gap-2">
                    {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'].map((m) => (
                      <button key={m} onClick={() => setMethod(m)} className={cn('rounded-xl border px-3.5 py-2 text-sm font-semibold transition', method === m ? 'border-brand-red bg-brand-red text-white' : 'border-surface-border bg-white text-slate-600')}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-slate-700">Discount (₹)</p>
                    <input value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="input-base" inputMode="numeric" />
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-slate-700">Paid Amount (₹)</p>
                    <input value={paid} onChange={(e) => setPaid(Number(e.target.value) || 0)} className="input-base" inputMode="numeric" />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPaid(grand)}>Mark fully paid</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Totals sidebar */}
        <div>
          <Card className="sticky top-20">
            <CardHeader><CardTitle>Invoice Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Total label={`Services (${servicesLines.length})`} value={servicesLines.reduce((s, l) => s + l.amount, 0)} />
              <Total label={`Spare Parts (${partsLines.length})`} value={partsLines.reduce((s, l) => s + l.amount, 0)} />
              <Total label="Labour" value={labour} />
              {discount > 0 && <Total label="Discount" value={-discount} />}
              {settings.gst_enabled && <><Total label={`CGST ${settings.cgst_percent}%`} value={cgst} /><Total label={`SGST ${settings.sgst_percent}%`} value={sgst} /></>}
              <div className="flex items-center justify-between border-t border-dashed border-surface-border pt-2">
                <span className="font-bold text-brand-charcoal">Grand Total</span>
                <span className="text-xl font-extrabold text-brand-red">{formatCurrency(grand)}</span>
              </div>
              <Total label="Paid" value={paid} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Balance</span>
                <span className={`font-bold ${balance > 0 ? 'text-status-danger' : 'text-status-success'}`}>{formatCurrency(balance)}</span>
              </div>

              {step < 2 ? (
                <Button className="mt-3 w-full" onClick={() => setStep((s) => s + 1)}>Continue</Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <Button className="w-full" loading={createInvoice.isPending} onClick={confirm}><Save className="h-4 w-4" /> Confirm Invoice</Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> PDF</Button>
                    <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
                  </div>
                  <WhatsAppButton phone={invoiceData.customerPhone || '9787549179'} message={waMessage} label="Send on WhatsApp" className="w-full" />
                  <p className="text-center text-[11px] text-slate-400">Confirm to save & deduct stock. Download the PDF, then attach it in WhatsApp.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-surface-border px-3.5 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-semibold text-brand-charcoal">{value}</span>
    </div>
  )
}
function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-brand-charcoal">{formatCurrency(value)}</span>
    </div>
  )
}
