import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle } from '@/components/ui/Misc'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Field, Textarea } from '@/components/ui/Input'
import { CAR_BRANDS } from '@/data/carCatalogue'
import { useCreateVehicle, useCustomers } from '@/hooks/data'

export function VehicleForm() {
  const navigate = useNavigate()
  const createVehicle = useCreateVehicle()
  const { data: customers = [] } = useCustomers()
  const [customerId, setCustomerId] = useState('')
  const [f, setF] = useState({ reg: '', brand: '', model: '', variant: '', year: '', fuel: 'Petrol', odometer: '', color: '', chassis: '', engine: '', insurance: '', puc: '', notes: '' })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  async function save() {
    if (!customerId) return toast.error('Select the vehicle owner')
    if (!f.reg.trim()) return toast.error('Registration number is required')
    try {
      await createVehicle.mutateAsync({
        customer_id: customerId,
        reg_number: f.reg.trim().toUpperCase(),
        brand: f.brand || undefined,
        model: f.model || undefined,
        variant: f.variant || undefined,
        year: f.year ? Number(f.year) : undefined,
        fuel_type: f.fuel,
        color: f.color || undefined,
        chassis_number: f.chassis || undefined,
        engine_number: f.engine || undefined,
        odometer: f.odometer ? Number(f.odometer) : undefined,
        insurance_expiry: f.insurance || undefined,
        puc_expiry: f.puc || undefined,
        notes: f.notes || undefined,
      })
      toast.success('Vehicle saved')
      navigate('/vehicles')
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <SectionTitle title="Add Vehicle" />
      </div>
      <Card>
        <CardContent className="space-y-4">
          <Field label="Owner (Customer)" required>
            <select className="input-base" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </select>
          </Field>
          <Field label="Registration Number" required><Input value={f.reg} onChange={(e) => set('reg', e.target.value.toUpperCase())} placeholder="TN 21 AQ 1234" className="uppercase" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand">
              <select className="input-base" value={f.brand} onChange={(e) => set('brand', e.target.value)}>
                <option value="">Select brand</option>
                {CAR_BRANDS.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Model"><Input value={f.model} onChange={(e) => set('model', e.target.value)} placeholder="Swift Dzire" /></Field>
            <Field label="Variant"><Input value={f.variant} onChange={(e) => set('variant', e.target.value)} placeholder="VXI" /></Field>
            <Field label="Year"><Input value={f.year} onChange={(e) => set('year', e.target.value)} placeholder="2022" inputMode="numeric" /></Field>
            <Field label="Fuel Type">
              <select className="input-base" value={f.fuel} onChange={(e) => set('fuel', e.target.value)}>
                {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Odometer (km)"><Input value={f.odometer} onChange={(e) => set('odometer', e.target.value)} inputMode="numeric" /></Field>
            <Field label="Color"><Input value={f.color} onChange={(e) => set('color', e.target.value)} /></Field>
            <Field label="Chassis No"><Input value={f.chassis} onChange={(e) => set('chassis', e.target.value)} /></Field>
            <Field label="Insurance Expiry"><Input type="date" value={f.insurance} onChange={(e) => set('insurance', e.target.value)} /></Field>
            <Field label="PUC Expiry"><Input type="date" value={f.puc} onChange={(e) => set('puc', e.target.value)} /></Field>
          </div>
          <Field label="Notes"><Textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          <Button className="w-full" onClick={save} loading={createVehicle.isPending}><Save className="h-4 w-4" /> Save Vehicle</Button>
        </CardContent>
      </Card>
    </div>
  )
}
