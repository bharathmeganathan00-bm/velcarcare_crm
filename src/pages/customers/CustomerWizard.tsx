import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Car, Check, Phone, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { StepProgress } from '@/components/common/StepProgress'
import { CarBrandCard, CarModelCard } from '@/components/catalogue/CatalogueCards'
import { Button } from '@/components/ui/Button'
import { Input, Field, Textarea } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CAR_BRANDS, modelsForBrand } from '@/data/carCatalogue'
import { DEFAULT_BRAND_LOGO, logoUrlForBrandName } from '@/data/carBrands'
import { useCreateCustomer, useCreateVehicle, useCustomers } from '@/hooks/data'
import { INSPECTION_ITEMS, INSPECTION_ICONS, defaultInspection, type InspectionMap } from '@/lib/inspection'
import type { CarBrand, CarModel } from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS = ['Customer', 'Brand', 'Model', 'Variant & Year', 'Vehicle', 'Inspection', 'Confirm']
const VARIANTS = ['Base / LXI', 'VXI', 'ZXI', 'ZXI+', 'Alpha', 'Sigma', 'Delta', 'Zeta', 'SX', 'SX(O)', 'Asta', 'Other']
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
const currentYear = 2026
const YEARS = Array.from({ length: 26 }, (_, i) => currentYear - i)

export function CustomerWizard() {
  const navigate = useNavigate()
  const createCustomer = useCreateCustomer()
  const createVehicle = useCreateVehicle()
  const { data: existingCustomers = [] } = useCustomers()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)

  // Step 1 — customer
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  // Step 2-5 — vehicle
  const [brand, setBrand] = useState<CarBrand | null>(null)
  const [brandQuery, setBrandQuery] = useState('')
  const [model, setModel] = useState<CarModel | null>(null)
  const [modelQuery, setModelQuery] = useState('')
  const [variant, setVariant] = useState('')
  const [year, setYear] = useState<number | null>(null)
  const [fuel, setFuel] = useState('')
  const [reg, setReg] = useState('')
  const [odometer, setOdometer] = useState('')

  // Step 6 — inspection (Good / Not OK per item)
  const [inspection, setInspection] = useState<InspectionMap>(defaultInspection)
  const notOkCount = INSPECTION_ITEMS.filter((i) => inspection[i] === 'not').length

  // Duplicate detection
  const duplicate = useMemo(
    () => (phone.length >= 10 ? existingCustomers.find((c) => c.phone === phone.replace(/\D/g, '')) : undefined),
    [phone, existingCustomers],
  )

  const brands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase()
    const list = q ? CAR_BRANDS.filter((b) => b.name.toLowerCase().includes(q)) : CAR_BRANDS
    return list
  }, [brandQuery])

  const models = useMemo(() => {
    if (!brand) return []
    const q = modelQuery.trim().toLowerCase()
    const list = modelsForBrand(brand.id)
    return q ? list.filter((m) => m.model_name.toLowerCase().includes(q)) : list
  }, [brand, modelQuery])

  const canNext = [
    name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10,
    !!brand,
    !!model,
    !!variant && !!year,
    reg.trim().length >= 4 && !!fuel,
    true, // inspection
    true, // confirm
  ][step]

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else finish()
  }
  function back() {
    if (step > 0) setStep((s) => s - 1)
    else navigate(-1)
  }

  async function finish() {
    setSaving(true)
    try {
      const customer = await createCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        whatsapp: phone.replace(/\D/g, ''),
        email: email || undefined,
        address: address || undefined,
      })
      const vehicle = await createVehicle.mutateAsync({
        customer_id: customer.id,
        reg_number: reg.trim().toUpperCase(),
        brand: brand?.name,
        model: model?.model_name,
        variant: variant || undefined,
        year: year ?? undefined,
        fuel_type: fuel || undefined,
        odometer: odometer ? Number(odometer) : undefined,
      })
      toast.success(`${name} & ${brand?.name} ${model?.model_name} saved`)
      // Skip the separate job-card page — go straight to billing. A job card is
      // still created automatically when the invoice is confirmed.
      navigate('/invoices/new', { state: { vehicleId: vehicle.id, inspection } })
    } catch (e) {
      toast.error(String((e as Error).message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={back}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold text-brand-charcoal">New Customer & Vehicle</h1>
          <p className="text-sm text-slate-500">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
      </div>

      <div className="mb-6">
        <StepProgress steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} />
      </div>

      <Card>
        <CardContent className="min-h-[340px]">
          {/* STEP 1 — CUSTOMER */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-status-successBg/60 px-3.5 py-2.5 text-xs font-medium text-status-success">
                Only name &amp; phone number are required to get started.
              </div>
              <Field label="Customer Name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ramesh Kumar" autoFocus />
              </Field>
              <Field label="Mobile Number" required hint="Used for calls and WhatsApp">
                <Input
                  icon={<Phone className="h-4 w-4" />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9787549179"
                  inputMode="numeric"
                />
              </Field>

              {duplicate && (
                <div className="flex items-center gap-3 rounded-xl border border-status-warning/30 bg-status-warningBg/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#B45309]">Customer already exists</p>
                    <p className="truncate text-xs text-[#B45309]/80">{duplicate.name} · {duplicate.phone} · {duplicate.vehicle_count} vehicle(s)</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/customers/${duplicate.id}`)}>
                    Use existing
                  </Button>
                </div>
              )}

              <details className="group rounded-xl border border-surface-border">
                <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm font-semibold text-slate-600">
                  + Add optional details (email, address)
                </summary>
                <div className="space-y-4 border-t border-surface-border p-3.5">
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                  </Field>
                  <Field label="Address">
                    <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Door no, street, city" />
                  </Field>
                </div>
              </details>
            </div>
          )}

          {/* STEP 2 — BRAND */}
          {step === 1 && (
            <div>
              <Input
                icon={<Search className="h-4 w-4" />}
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Search brand…"
                className="mb-4"
              />
              {!brandQuery && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Popular</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {brands.map((b) => (
                  <CarBrandCard key={b.id} brand={b} selected={brand?.id === b.id} onClick={() => { setBrand(b); setModel(null); setStep(2) }} />
                ))}
                {brands.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-400">No brands match "{brandQuery}".</p>}
              </div>
            </div>
          )}

          {/* STEP 3 — MODEL */}
          {step === 2 && brand && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-surface-border">
                    <img
                      src={logoUrlForBrandName(brand.name) ?? DEFAULT_BRAND_LOGO}
                      alt={brand.name}
                      className="h-full w-full object-contain p-1"
                      onError={(e) => { if (!e.currentTarget.src.endsWith(DEFAULT_BRAND_LOGO)) e.currentTarget.src = DEFAULT_BRAND_LOGO }}
                    />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-brand-charcoal">Choose Car Model</p>
                    <p className="text-xs text-slate-400">{brand.name} · {models.length} model{models.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-brand-red hover:underline">Change brand</button>
              </div>
              <Input
                icon={<Search className="h-4 w-4" />}
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder="Search car model…"
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {models.map((m) => (
                  <CarModelCard key={m.id} model={m} make={brand.name} selected={model?.id === m.id} onClick={() => { setModel(m); setStep(3) }} />
                ))}
                {models.length === 0 && (
                  <div className="col-span-full py-10 text-center">
                    <p className="text-sm text-slate-500">No car models found for this brand.</p>
                    <button
                      onClick={() => { setModel({ id: 'other', brand_id: brand.id, model_name: modelQuery || 'Other Model' }); setStep(3) }}
                      className="mt-2 text-sm font-semibold text-brand-red hover:underline"
                    >
                      + Add Model Manually
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 — VARIANT & YEAR */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">Variant</p>
                <div className="flex flex-wrap gap-2">
                  {VARIANTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVariant(v)}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${variant === v ? 'border-brand-red bg-brand-red text-white' : 'border-surface-border bg-white text-slate-600 hover:bg-surface-muted'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">Manufacture Year</p>
                <div className="no-scrollbar flex flex-wrap gap-2">
                  {YEARS.slice(0, 16).map((y) => (
                    <button
                      key={y}
                      onClick={() => setYear(y)}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${year === y ? 'border-brand-red bg-brand-red text-white' : 'border-surface-border bg-white text-slate-600 hover:bg-surface-muted'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — VEHICLE DETAILS */}
          {step === 4 && (
            <div className="space-y-4">
              <Field label="Registration Number" required>
                <Input value={reg} onChange={(e) => setReg(e.target.value.toUpperCase())} placeholder="TN 21 AQ 1234" className="uppercase" autoFocus />
              </Field>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-700">Fuel Type <span className="text-brand-red">*</span></p>
                <div className="flex flex-wrap gap-2">
                  {FUEL_TYPES.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFuel(f)}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${fuel === f ? 'border-brand-red bg-brand-red text-white' : 'border-surface-border bg-white text-slate-600 hover:bg-surface-muted'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Odometer (km)">
                <Input value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="41280" inputMode="numeric" />
              </Field>
            </div>
          )}

          {/* STEP 6 — INSPECTION (Good / Not OK) */}
          {step === 5 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Quick vehicle inspection</p>
                <div className="flex gap-2">
                  <button onClick={() => setInspection(Object.fromEntries(INSPECTION_ITEMS.map((i) => [i, 'good'])) as InspectionMap)} className="rounded-lg bg-status-successBg px-2.5 py-1 text-xs font-bold text-status-success">All Good</button>
                </div>
              </div>
              <div className="space-y-2">
                {INSPECTION_ITEMS.map((item) => {
                  const Icon = INSPECTION_ICONS[item]
                  return (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-surface-border px-3.5 py-2.5">
                    <span className="flex items-center gap-3 text-sm font-semibold text-brand-charcoal">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-charcoal">
                        {Icon && <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                      </span>
                      {item}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setInspection((s) => ({ ...s, [item]: 'good' }))}
                        className={cn('rounded-lg px-3 py-1.5 text-xs font-bold transition', inspection[item] === 'good' ? 'bg-status-success text-white' : 'bg-white text-slate-400 border border-surface-border hover:bg-surface-muted')}
                      >
                        Good
                      </button>
                      <button
                        onClick={() => setInspection((s) => ({ ...s, [item]: 'not' }))}
                        className={cn('rounded-lg px-3 py-1.5 text-xs font-bold transition', inspection[item] === 'not' ? 'bg-status-danger text-white' : 'bg-white text-slate-400 border border-surface-border hover:bg-surface-muted')}
                      >
                        Not OK
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 7 — CONFIRM */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-surface-border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-redLight text-brand-red">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-brand-charcoal">{name}</p>
                    <p className="text-sm text-slate-500">{phone}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-surface-border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-infoBg text-status-info">
                    <Car className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-brand-charcoal">{brand?.name} {model?.model_name}</p>
                    <p className="text-sm text-slate-500">{variant} · {year} · {fuel} · {reg}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-surface-border p-4">
                <p className="text-sm font-bold text-brand-charcoal">Inspection</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {notOkCount === 0 ? 'All 16 items marked Good ✅' : `${notOkCount} item(s) need attention: `}
                  {notOkCount > 0 && <span className="font-semibold text-status-danger">{INSPECTION_ITEMS.filter((i) => inspection[i] === 'not').join(', ')}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-status-successBg/60 px-3.5 py-3 text-sm font-medium text-status-success">
                <Check className="h-4 w-4" /> Ready. Next you'll add services, parts & labour and bill this vehicle.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky action bar */}
      <div className="sticky-action-bar">
        <Button variant="outline" className="shrink-0 px-4 sm:px-8" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button className="min-w-0 flex-1" disabled={!canNext} loading={saving} onClick={next}>
          <span className="truncate">
            {step === STEPS.length - 1 ? (
              <>
                <span className="sm:hidden">Save &amp; Bill</span>
                <span className="hidden sm:inline">Save &amp; Continue to Billing</span>
              </>
            ) : (
              'Continue'
            )}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </div>
  )
}
