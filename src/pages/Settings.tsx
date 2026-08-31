import { useEffect, useState } from 'react'
import { Building2, Percent, ReceiptText, Save, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle } from '@/components/ui/Misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Field, Textarea, Label } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { useSettings } from '@/context/SettingsContext'
import type { CompanySettings } from '@/lib/types'

const TABS = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'billing', label: 'Billing & GST', icon: ReceiptText },
  { key: 'payments', label: 'Payments', icon: Wallet },
]

export function Settings() {
  const { settings, save: persist } = useSettings()
  const [tab, setTab] = useState('company')
  const [draft, setDraft] = useState<CompanySettings>(settings)
  const [saving, setSaving] = useState(false)
  const [gstToggling, setGstToggling] = useState(false)

  // Keep the draft in sync once the live settings row loads.
  useEffect(() => { setDraft(settings) }, [settings])

  async function save() {
    setSaving(true)
    try {
      await persist(draft)
      toast.success('Settings saved')
    } catch (e) {
      toast.error(String((e as Error).message))
    } finally {
      setSaving(false)
    }
  }
  function set<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <div>
      <SectionTitle title="Settings" subtitle="Company, billing, GST and payment configuration" />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-brand-charcoal text-white' : 'bg-white text-slate-600 border border-surface-border hover:bg-surface-muted'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tab === 'company' && (
            <Card>
              <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Company Name"><Input value={draft.name} onChange={(e) => set('name', e.target.value)} /></Field>
                <Field label="Address"><Textarea value={draft.address} onChange={(e) => set('address', e.target.value)} /></Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Phone 1"><Input value={draft.phones[0] ?? ''} onChange={(e) => set('phones', [e.target.value, draft.phones[1] ?? ''])} /></Field>
                  <Field label="Phone 2"><Input value={draft.phones[1] ?? ''} onChange={(e) => set('phones', [draft.phones[0] ?? '', e.target.value])} /></Field>
                  <Field label="WhatsApp Number"><Input value={draft.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
                  <Field label="Email"><Input value={draft.email} onChange={(e) => set('email', e.target.value)} /></Field>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'billing' && (
            <Card>
              <CardHeader><CardTitle>Billing & GST</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-surface-border p-4">
                  <div>
                    <p className="font-bold text-brand-charcoal">Enable GST</p>
                    <p className="text-sm text-slate-500">Show CGST/SGST and GST number on invoices.</p>
                  </div>
                  <button
                    disabled={gstToggling}
                    onClick={async () => {
                      const next = { ...draft, gst_enabled: !draft.gst_enabled }
                      setDraft(next)
                      setGstToggling(true)
                      try {
                        await persist(next)
                        toast.success(next.gst_enabled ? 'GST enabled' : 'GST disabled')
                      } catch (e) {
                        setDraft(draft)
                        toast.error(String((e as Error).message))
                      } finally {
                        setGstToggling(false)
                      }
                    }}
                    className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${draft.gst_enabled ? 'bg-status-success' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${draft.gst_enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <Field label="GST Number" hint="Enter, edit or leave blank to disable. Not hardcoded.">
                  <Input value={draft.gst_number} onChange={(e) => set('gst_number', e.target.value.toUpperCase())} placeholder="33XXXXXXXXXXZ1" disabled={!draft.gst_enabled} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="CGST %"><Input type="number" value={draft.cgst_percent} onChange={(e) => set('cgst_percent', Number(e.target.value))} icon={<Percent className="h-4 w-4" />} disabled={!draft.gst_enabled} /></Field>
                  <Field label="SGST %"><Input type="number" value={draft.sgst_percent} onChange={(e) => set('sgst_percent', Number(e.target.value))} icon={<Percent className="h-4 w-4" />} disabled={!draft.gst_enabled} /></Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Invoice Prefix"><Input value={draft.invoice_prefix} onChange={(e) => set('invoice_prefix', e.target.value)} /></Field>
                  <Field label="Estimate Prefix"><Input value={draft.estimate_prefix} onChange={(e) => set('estimate_prefix', e.target.value)} /></Field>
                  <Field label="Job Card Prefix"><Input value={draft.jobcard_prefix} onChange={(e) => set('jobcard_prefix', e.target.value)} /></Field>
                </div>
                <Field label="Terms & Warranty Notes"><Textarea value={draft.terms ?? ''} onChange={(e) => set('terms', e.target.value)} /></Field>
              </CardContent>
            </Card>
          )}

          {tab === 'payments' && (
            <Card>
              <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="UPI ID"><Input value={draft.upi_id ?? ''} onChange={(e) => set('upi_id', e.target.value)} placeholder="velcarcare@upi" /></Field>
                <p className="text-sm text-slate-400">Bank account and UPI QR upload appear on invoices when configured.</p>
              </CardContent>
            </Card>
          )}

          <Button className="mt-4 w-full sm:w-auto" onClick={save} loading={saving}><Save className="h-4 w-4" /> Save Changes</Button>
        </div>

        {/* Live preview */}
        <Card className="h-fit">
          <CardHeader><CardTitle>Invoice Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-xl border border-surface-border p-4">
              <Logo className="h-9" />
              <p className="mt-2 text-sm font-bold text-brand-charcoal">{draft.name}</p>
              <p className="text-xs text-slate-500">{draft.address}</p>
              <p className="mt-1 text-xs text-slate-500">{draft.phones.filter(Boolean).join(' · ')}</p>
              <p className="text-xs text-slate-500">{draft.email}</p>
              {draft.gst_enabled && draft.gst_number && (
                <p className="mt-1 text-xs font-semibold text-brand-charcoal">GSTIN: {draft.gst_number}</p>
              )}
              <div className="mt-3 border-t border-dashed border-surface-border pt-3">
                <div className="flex justify-between text-xs"><Label className="mb-0">Sub Total</Label><span>₹2,280</span></div>
                {draft.gst_enabled && (
                  <>
                    <div className="flex justify-between text-xs text-slate-500"><span>CGST {draft.cgst_percent}%</span><span>₹205</span></div>
                    <div className="flex justify-between text-xs text-slate-500"><span>SGST {draft.sgst_percent}%</span><span>₹205</span></div>
                  </>
                )}
                <div className="mt-1 flex justify-between border-t border-surface-border pt-1 text-sm font-extrabold text-brand-charcoal">
                  <span>Grand Total</span><span>{draft.gst_enabled ? '₹2,690' : '₹2,280'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
