import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Car, Download, Printer, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, EmptyState } from '@/components/ui/Misc'
import { StepProgress } from '@/components/common/StepProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ServiceCard, SparePartCard } from '@/components/catalogue/CatalogueCards'
import { QuantitySelector } from '@/components/common/ActionButtons'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useCustomer, useUpdateCustomer } from '@/hooks/data'
import { useCreateInvoice, useUpdateInvoice, useInvoice, useInvoiceItems, useServices, useSpareParts, useVehicles } from '@/hooks/data'
import { createJobCard, saveInspection, logInvoiceShare } from '@/lib/api'
import { downloadInvoicePdf, invoicePdfBlob, type InvoiceLine } from '@/lib/pdf'
import { shareInvoiceViaWebShare, type ShareMethod, type ShareStatus } from '@/lib/whatsappShare'
import { inspectionToArray, type InspectionMap } from '@/lib/inspection'
import { formatCurrency, toWhatsAppNumber, cn } from '@/lib/utils'

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
  const { id: editId } = useParams()
  const isEdit = !!editId
  const prefill = (location.state as PrefillState | null) ?? {}
  const { settings } = useSettings()
  const { user, isManager } = useAuth()
  const { data: vehicles = [], isLoading: vLoading } = useVehicles()
  const { data: allServices = [] } = useServices()
  const { data: allParts = [] } = useSpareParts()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  // Edit mode: load the existing invoice + its items to prefill.
  const { data: editInvoice, isSuccess: invLoaded } = useInvoice(editId)
  const { data: editItems = [], isSuccess: itemsLoaded } = useInvoiceItems(editId)
  const [prefilled, setPrefilled] = useState(false)

  const [step, setStep] = useState(0)
  const [vehicleId, setVehicleId] = useState(prefill.vehicleId ?? '')
  // Selections start blank; prefilled only when coming from a job card.
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>(
    () => Object.fromEntries((prefill.services ?? []).map((s) => [s.id, true])),
  )
  const [partQty, setPartQty] = useState<Record<string, number>>(
    () => Object.fromEntries((prefill.parts ?? []).map((p) => [p.id, p.qty])),
  )
  // Money fields are held as strings so decimals type smoothly; parsed non-negative.
  const [labourStr, setLabourStr] = useState(String(prefill.labour ?? 0))
  const [discountStr, setDiscountStr] = useState('0')
  const [paidStr, setPaidStr] = useState('0')
  const [method, setMethod] = useState('Cash')
  const [partQuery, setPartQuery] = useState('')
  const [vehicleQuery, setVehicleQuery] = useState('')
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false)
  // Invoice date — editable at creation, and again later on edit. Defaults to today.
  const [invoiceDateStr, setInvoiceDateStr] = useState(() => new Date().toISOString().slice(0, 10))

  

  // Prefill from the existing invoice once (edit mode only).
  useEffect(() => {
    if (!isEdit || prefilled || !invLoaded || !itemsLoaded || !editInvoice) return
    setVehicleId(editInvoice.vehicle_id ?? '')
    const svc: Record<string, boolean> = {}
    const parts: Record<string, number> = {}
    editItems.forEach((it) => {
      if (it.kind === 'service' && it.ref_id) svc[it.ref_id] = true
      if (it.kind === 'part' && it.ref_id) parts[it.ref_id] = (parts[it.ref_id] ?? 0) + it.qty
    })
    setSelectedServices(svc)
    setPartQty(parts)
    setLabourStr(String(editInvoice.labour_charge ?? 0))
    setDiscountStr(String(editInvoice.discount ?? 0))
    setPaidStr(String(editInvoice.paid ?? 0))
    setMethod(editInvoice.payment_method ?? 'Cash')
    if (editInvoice.date) setInvoiceDateStr(editInvoice.date)
    setPrefilled(true)
  }, [isEdit, prefilled, invLoaded, itemsLoaded, editInvoice, editItems])

  const labour = toAmount(labourStr)
  const discount = toAmount(discountStr)
  const paid = toAmount(paidStr)

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0]

  const updateCustomer = useUpdateCustomer()
  const { data: currentCustomer } = useCustomer(vehicle ? vehicle.customer_id : undefined)
  const [gstNumber, setGstNumber] = useState('')
  const [gstName, setGstName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')

  useEffect(() => {
    if (!currentCustomer) return
    setGstNumber(currentCustomer.gst_number ?? '')
    setGstName(currentCustomer.gst_name ?? '')
    setAccountName(currentCustomer.account_name ?? '')
    setAccountNumber(currentCustomer.account_number ?? '')
    setIfscCode(currentCustomer.ifsc ?? '')
  }, [currentCustomer])

  const chosenServices = allServices.filter((s) => selectedServices[s.id])
  const chosenParts = allParts.filter((p) => (partQty[p.id] ?? 0) > 0)

  const servicesLines: InvoiceLine[] = chosenServices.map((s) => ({ description: s.name, qty: 1, rate: s.labour_charge, amount: s.labour_charge }))
  const partsLines: InvoiceLine[] = chosenParts.map((p) => ({ description: p.name, qty: partQty[p.id], rate: p.selling_price, amount: partQty[p.id] * p.selling_price }))

  // Services + Spare Parts + Labour = pre-discount subtotal (numeric, rounded 2dp).
  const servicesTotal = round2(servicesLines.reduce((s, l) => s + l.amount, 0))
  const partsTotal = round2(partsLines.reduce((s, l) => s + l.amount, 0))
  const subtotal = round2(servicesTotal + partsTotal + labour)
  const taxable = Math.max(0, subtotal - discount)
  const cgst = settings.gst_enabled ? round2((taxable * settings.cgst_percent) / 100) : 0
  const sgst = settings.gst_enabled ? round2((taxable * settings.sgst_percent) / 100) : 0
  const grand = round2(taxable + cgst + sgst)
  const balance = round2(grand - paid)

  const filteredParts = useMemo(() => {
    const t = partQuery.trim().toLowerCase()
    return t ? allParts.filter((p) => p.name.toLowerCase().includes(t) || (p.part_number ?? '').toLowerCase().includes(t)) : allParts
  }, [partQuery, allParts])

  const filteredVehicles = useMemo(() => {
    const t = vehicleQuery.trim().toLowerCase()
    if (!t) return vehicles
    return vehicles.filter((v) =>
      (v.customer_name ?? '').toLowerCase().includes(t) ||
      (v.customer_phone ?? '').toLowerCase().includes(t) ||
      (v.reg_number ?? '').toLowerCase().includes(t) ||
      (v.brand ?? '').toLowerCase().includes(t) ||
      (v.model ?? '').toLowerCase().includes(t),
    )
  }, [vehicleQuery, vehicles])

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
    date: invoiceDateStr,
    jobCardNo: prefill.jobCardId ? 'Linked' : undefined,
    customerName: vehicle.customer_name ?? 'Customer',
    customerPhone: vehicle.customer_phone ?? '',
    customerAddress: undefined,
    customerGstNumber: gstNumber || undefined,
    customerGstName: gstName || undefined,
    customerAccountName: accountName || undefined,
    customerAccountNumber: accountNumber || undefined,
    customerIfsc: ifscCode || undefined,
    vehicleLabel: `${vehicle.brand ?? ''} ${vehicle.model ?? ''} · ${vehicle.year ?? ''}`,
    regNumber: vehicle.reg_number ?? '',
    odometer: vehicle.odometer,
    fuelType: vehicle.fuel_type ?? undefined,
    services: servicesLines,
    parts: partsLines,
    labour,
    discount,
    cgst,
    sgst,
    grandTotal: grand,
    paid,
    balance,
    paymentMode: method,
    paymentStatus: balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending',
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
      // Edit mode: update the existing invoice (recompute totals + reconcile stock).
      if (isEdit && editId) {
        await updateInvoice.mutateAsync({
          id: editId,
          input: {
            isGst: settings.gst_enabled,
            services,
            parts,
            labour,
            discount,
            cgstPercent: settings.cgst_percent,
            sgstPercent: settings.sgst_percent,
            paid,
            method,
            invoiceDate: invoiceDateStr,
          },
        })
        toast.success('Invoice updated · stock adjusted')
        navigate(`/invoices/${editId}`)
        return
      }

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
        invoiceDate: invoiceDateStr,
      })
      toast.success(`Invoice ${res.invoice_no} confirmed`)
      await sharePdfToCustomer(res.id, res.invoice_no)
      navigate(`/invoices/${res.id}`)
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  /**
   * Best-effort: build the real invoice PDF and hand it straight to the
   * customer's WhatsApp — native share sheet with the PDF attached where the
   * browser supports it, else download-then-open-chat. Never blocks/fails the
   * invoice itself; failures are surfaced as a toast only.
   */
  async function sharePdfToCustomer(invoiceId: string, invoiceNo: string) {
    const phone = invoiceData.customerPhone
    if (!phone) {
      toast.message('Invoice saved — no WhatsApp number on file for this customer, so the PDF was not sent.')
      return
    }
    try {
      const blob = await invoicePdfBlob(settings, { ...invoiceData, invoiceNo })
      const file = new File([blob], `${invoiceNo}.pdf`, { type: 'application/pdf' })
      const message = `Dear ${invoiceData.customerName},\nYour vehicle service invoice from VELCARCARE is ready.\n\nVehicle: ${invoiceData.regNumber}\nInvoice: ${invoiceNo}\n${labourLine}Total: ${formatCurrency(grand)}\nPaid: ${formatCurrency(paid)}\nBalance: ${formatCurrency(balance)}\n\nThank you for choosing VELCARCARE.`
      const log = user
        ? (method: ShareMethod, status: ShareStatus, error?: string) =>
            logInvoiceShare({
              invoice_id: invoiceId,
              customer_id: vehicle.customer_id ?? null,
              shared_by: user.id,
              shared_by_name: isManager ? 'Manager' : user.name ?? 'Staff',
              shared_by_role: isManager ? 'manager' : 'staff',
              phone_number: toWhatsAppNumber(phone),
              share_method: method,
              status,
              error_message: error ?? null,
            })
        : () => {}
      const result = await shareInvoiceViaWebShare({ file, message, title: `Invoice ${invoiceNo}`, phone, log })
      if (result.cancelled) return
      toast[result.fallback ? 'message' : 'success'](
        result.fallback
          ? 'Invoice PDF downloaded — attach it in the WhatsApp chat that just opened and tap Send.'
          : 'Invoice PDF shared on WhatsApp',
      )
    } catch (e) {
      toast.error(`Invoice saved, but sending the PDF failed: ${String((e as Error).message)}`)
    }
  }

  async function download() {
    await downloadInvoicePdf(settings, { ...invoiceData, invoiceNo: 'PREVIEW' })
    toast.success('Preview PDF downloaded')
  }

  const labourLine = labour > 0 ? `Labour: ${formatCurrency(labour)}\n` : ''

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title={isEdit ? `Edit Invoice ${editInvoice?.invoice_no ?? ''}`.trim() : 'Create Invoice'} subtitle={STEPS[step]} />
      </div>

      <div className="mb-6"><StepProgress steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} /></div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 0 && (
            <Card>
              <CardHeader><CardTitle>Customer & Vehicle</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Input
                    icon={<Search className="h-4 w-4" />}
                    disabled={isEdit}
                    value={vehiclePickerOpen ? vehicleQuery : `${vehicle.customer_name ?? ''}${vehicle.customer_phone ? ` · ${vehicle.customer_phone}` : ''} · ${vehicle.brand ?? ''} ${vehicle.model ?? ''} · ${vehicle.reg_number ?? ''}`}
                    placeholder="Search by customer name or mobile number…"
                    onFocus={() => { setVehiclePickerOpen(true); setVehicleQuery('') }}
                    onChange={(e) => setVehicleQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setVehiclePickerOpen(false), 150)}
                  />
                  {vehiclePickerOpen && (
                    <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-surface-border bg-white shadow-lg">
                      {filteredVehicles.length === 0 && <p className="px-3.5 py-3 text-sm text-slate-400">No customer or vehicle matches.</p>}
                      {filteredVehicles.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setVehicleId(v.id); setVehicleQuery(''); setVehiclePickerOpen(false) }}
                          className={cn('flex w-full flex-col items-start gap-0.5 border-b border-surface-border px-3.5 py-2.5 text-left last:border-b-0 hover:bg-surface-muted', v.id === vehicle.id && 'bg-surface-muted')}
                        >
                          <span className="text-sm font-semibold text-brand-charcoal">{v.customer_name}{v.customer_phone ? ` · ${v.customer_phone}` : ''}</span>
                          <span className="text-xs text-slate-500">{v.brand ?? ''} {v.model ?? ''} · {v.reg_number ?? ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-slate-700">Invoice Date</p>
                  <input
                    type="date"
                    value={invoiceDateStr}
                    onChange={(e) => setInvoiceDateStr(e.target.value || new Date().toISOString().slice(0, 10))}
                    className="input-base"
                  />
                </div>
                <Field label="Customer" value={invoiceData.customerName} />
                <Field label="Vehicle" value={invoiceData.vehicleLabel} />
                <Field label="Registration" value={invoiceData.regNumber} />
                <div className="rounded-xl border border-surface-border p-3">
                  <p className="mb-2 text-sm font-bold text-brand-charcoal">Customer GST & Bank Details</p>
                  <div className="space-y-2">
                    <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GSTIN (optional)" />
                    <Input value={gstName} onChange={(e) => setGstName(e.target.value)} placeholder="GST Name (optional)" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="A/C Name" />
                      <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="A/C Number" />
                    </div>
                    <Input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="IFSC" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setGstNumber(currentCustomer?.gst_number ?? '')
                        setGstName(currentCustomer?.gst_name ?? '')
                        setAccountName(currentCustomer?.account_name ?? '')
                        setAccountNumber(currentCustomer?.account_number ?? '')
                        setIfscCode(currentCustomer?.ifsc ?? '')
                      }}>Reset</Button>
                      <Button size="sm" onClick={async () => {
                        if (!vehicle || !vehicle.customer_id) return toast.error('No customer selected')
                        try {
                          await updateCustomer.mutateAsync({ id: vehicle.customer_id, patch: {
                            gst_number: gstNumber || null,
                            gst_name: gstName || null,
                            account_name: accountName || null,
                            account_number: accountNumber || null,
                            ifsc: ifscCode || null,
                          } })
                          toast.success('Customer details saved')
                        } catch (e) {
                          toast.error(String((e as Error).message))
                        }
                      }}>Save to Customer</Button>
                    </div>
                  </div>
                </div>
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
                            <QuantitySelector
                              value={partQty[p.id]}
                              onChange={(v) => setPartQty((q) => ({ ...q, [p.id]: v }))}
                              step={p.unit === 'Litre' || p.unit === 'L' ? 0.5 : 1}
                              min={p.unit === 'Litre' || p.unit === 'L' ? 1 : 0}
                              max={p.unit === 'Litre' || p.unit === 'L' ? 9 : 9999}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
                {/* Labour Charge · Discount · Paid Amount — single column on mobile, row on desktop */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <MoneyField label="Labour Charge (₹)" value={labourStr} onChange={setLabourStr} />
                  <MoneyField label="Discount (₹)" value={discountStr} onChange={setDiscountStr} />
                  <MoneyField label="Paid Amount (₹)" value={paidStr} onChange={setPaidStr} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setPaidStr(String(grand))}>Mark fully paid</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Totals sidebar */}
        <div>
          <Card className="lg:sticky lg:top-20">
            <CardHeader><CardTitle>Invoice Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Total label={`Services (${servicesLines.length})`} value={servicesTotal} />
              <Total label={`Spare Parts (${partsLines.length})`} value={partsTotal} />
              <Total label="Labour Charge" value={labour} />
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
                  <Button className="w-full" loading={createInvoice.isPending || updateInvoice.isPending} onClick={confirm}>
                    <Save className="h-4 w-4" /> {isEdit ? 'Update Invoice' : 'Confirm Invoice'}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> PDF</Button>
                    <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
                  </div>
                  <p className="text-center text-[11px] text-slate-400">
                    {isEdit
                      ? 'Update to save & reconcile stock.'
                      : "Confirm to save, deduct stock, and send the PDF straight to the customer's WhatsApp number."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/** Round to 2 decimals, guarding against NaN. */
function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100
}
/** Parse a money input string to a non-negative amount (empty/invalid → 0). */
function toAmount(s: string) {
  const n = parseFloat(s)
  return !isFinite(n) || n < 0 ? 0 : round2(n)
}

/** Full-width ₹ money input: digits + single decimal only, no negatives, empty → 0. */
function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-slate-700">{label}</p>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
        <input
          value={value}
          inputMode="decimal"
          placeholder="0"
          onChange={(e) => {
            let v = e.target.value.replace(/[^0-9.]/g, '')
            const parts = v.split('.')
            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
            onChange(v)
          }}
          onBlur={(e) => { if (e.target.value.trim() === '') onChange('0') }}
          className="input-base w-full pl-7"
        />
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
