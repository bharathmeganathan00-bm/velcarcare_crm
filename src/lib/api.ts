import { supabase } from './supabase'
import type {
  CarBrand,
  CarModel,
  CompanySettings,
  Customer,
  Invoice,
  JobCard,
  Profile,
  ServiceItem,
  SparePart,
  Vehicle,
} from './types'

/**
 * Data-access layer. Every function talks to live Supabase and maps rows to the
 * app's domain types. Thrown Postgrest errors bubble up to TanStack Query.
 */

function check<T>(data: T, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export async function listCustomers(search = ''): Promise<Customer[]> {
  let q = supabase
    .from('customers')
    .select('*, vehicles(count)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (search.trim()) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  const { data, error } = await q
  return check(data, error)!.map(mapCustomer)
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('*, vehicles(count)').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapCustomer(data) : null
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  const { error } = await supabase
    .from('customers')
    .update({
      name: patch.name,
      phone: patch.phone,
      whatsapp: patch.whatsapp || patch.phone,
      alt_phone: patch.alt_phone,
      email: patch.email,
      address: patch.address,
      notes: patch.notes,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCustomer(id: string) {
  const now = new Date().toISOString()
  const { error } = await supabase.from('customers').update({ deleted_at: now }).eq('id', id)
  if (error) throw new Error(error.message)
  // Hide the customer's vehicles too so the lists stay clean.
  await supabase.from('vehicles').update({ deleted_at: now }).eq('customer_id', id)
}

export async function createCustomer(payload: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: payload.name,
      phone: payload.phone,
      whatsapp: payload.whatsapp || payload.phone,
      alt_phone: payload.alt_phone,
      email: payload.email,
      address: payload.address,
      notes: payload.notes,
    })
    .select('*, vehicles(count)')
    .single()
  return mapCustomer(check(data, error))
}

function mapCustomer(r: any): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    alt_phone: r.alt_phone,
    email: r.email,
    address: r.address,
    notes: r.notes,
    vehicle_count: r.vehicles?.[0]?.count ?? 0,
    total_spent: r.total_spent ?? 0,
    created_at: r.created_at,
  }
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------
export async function listVehicles(search = ''): Promise<Vehicle[]> {
  let q = supabase
    .from('vehicles')
    .select('*, customers(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (search.trim()) q = q.or(`reg_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
  const { data, error } = await q
  return check(data, error)!.map(mapVehicle)
}

export async function listVehiclesForCustomer(customerId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*, customers(name)').eq('customer_id', customerId).is('deleted_at', null)
  return check(data, error)!.map(mapVehicle)
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase.from('vehicles').select('*, customers(name)').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapVehicle(data) : null
}

export async function createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      customer_id: payload.customer_id,
      reg_number: payload.reg_number,
      brand: payload.brand,
      model: payload.model,
      variant: payload.variant,
      year: payload.year,
      fuel_type: payload.fuel_type,
      transmission: payload.transmission,
      color: payload.color,
      chassis_number: payload.chassis_number,
      engine_number: payload.engine_number,
      odometer: payload.odometer,
      insurance_expiry: payload.insurance_expiry || null,
      puc_expiry: payload.puc_expiry || null,
      notes: payload.notes,
    })
    .select('*, customers(name)')
    .single()
  return mapVehicle(check(data, error))
}

function mapVehicle(r: any): Vehicle {
  return {
    id: r.id,
    customer_id: r.customer_id,
    customer_name: r.customers?.name,
    reg_number: r.reg_number,
    brand: r.brand,
    model: r.model,
    variant: r.variant,
    year: r.year,
    fuel_type: r.fuel_type,
    transmission: r.transmission,
    color: r.color,
    chassis_number: r.chassis_number,
    engine_number: r.engine_number,
    odometer: r.odometer,
    insurance_expiry: r.insurance_expiry,
    puc_expiry: r.puc_expiry,
    last_service_date: r.last_service_date,
    next_service_date: r.next_service_date,
    image_url: r.image_url,
    notes: r.notes,
  }
}

// ---------------------------------------------------------------------------
// Job cards
// ---------------------------------------------------------------------------
const JC_SELECT = '*, customers(name), vehicles(reg_number, brand, model, year)'

export async function listJobCards(search = '', status = 'all'): Promise<JobCard[]> {
  let q = supabase.from('job_cards').select(JC_SELECT).is('deleted_at', null).order('received_at', { ascending: false })
  if (status !== 'all') q = q.eq('status', status)
  if (search.trim()) q = q.or(`jobcard_no.ilike.%${search}%`)
  const { data, error } = await q
  return check(data, error)!.map(mapJobCard)
}

export async function getJobCard(id: string): Promise<JobCard | null> {
  const { data, error } = await supabase.from('job_cards').select(JC_SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapJobCard(data) : null
}

export async function updateJobCardStatus(id: string, status: string) {
  const { error } = await supabase.from('job_cards').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  await supabase.from('job_card_status_history').insert({ job_card_id: id, status })
}

export async function nextSequence(prefix: 'JC' | 'INV' | 'EST' | 'PO'): Promise<string> {
  // Simple client-side sequence: count existing rows. For production, prefer a DB sequence/RPC.
  const table = prefix === 'JC' ? 'job_cards' : prefix === 'INV' ? 'invoices' : prefix === 'EST' ? 'estimates' : 'purchases'
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return `${prefix}-${String((count ?? 0) + 1).padStart(6, '0')}`
}

function mapJobCard(r: any): JobCard {
  const v = r.vehicles
  return {
    id: r.id,
    jobcard_no: r.jobcard_no,
    customer_id: r.customer_id,
    customer_name: r.customers?.name ?? '',
    vehicle_id: r.vehicle_id,
    vehicle_label: v ? `${v.brand ?? ''} ${v.model ?? ''}${v.year ? ` · ${v.year}` : ''}`.trim() : '',
    reg_number: v?.reg_number ?? '',
    odometer: r.odometer,
    fuel_level: r.fuel_level,
    received_at: r.received_at,
    expected_delivery: r.expected_delivery,
    complaints: r.complaints,
    status: r.status,
    assigned_to: r.assigned_to,
    services_total: Number(r.services_total ?? 0),
    parts_total: Number(r.parts_total ?? 0),
    labour_total: Number(r.labour_total ?? 0),
    grand_total: Number(r.grand_total ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
const INV_SELECT = '*, customers(name, phone, whatsapp, address), vehicles(reg_number, brand, model, year, fuel_type)'

export async function listInvoices(search = '', status = 'all'): Promise<Invoice[]> {
  let q = supabase.from('invoices').select(INV_SELECT).is('deleted_at', null).order('created_at', { ascending: false })
  if (status !== 'all') q = q.eq('status', status)
  if (search.trim()) q = q.or(`invoice_no.ilike.%${search}%`)
  const { data, error } = await q
  return check(data, error)!.map(mapInvoice)
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase.from('invoices').select(INV_SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapInvoice(data) : null
}

// ---------------------------------------------------------------------------
// Invoice WhatsApp share logs
// ---------------------------------------------------------------------------
export interface ShareLogInput {
  invoice_id: string
  customer_id?: string | null
  shared_by: string
  shared_by_name: string
  shared_by_role: string
  phone_number?: string | null
  share_method: string
  status: string
  error_message?: string | null
}

export async function logInvoiceShare(input: ShareLogInput) {
  // Best-effort: a logging failure must never block the actual share.
  try {
    await supabase.from('invoice_share_logs').insert(input)
  } catch {
    /* ignore */
  }
}

export interface ShareLogRow {
  id: string
  shared_by_name: string
  shared_by_role: string
  phone_number: string | null
  share_method: string
  status: string
  created_at: string
}

export async function getInvoiceShareLogs(invoiceId: string): Promise<ShareLogRow[]> {
  const { data, error } = await supabase
    .from('invoice_share_logs')
    .select('id, shared_by_name, shared_by_role, phone_number, share_method, status, created_at')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as unknown as ShareLogRow[]
}

export interface InvoiceItemRow {
  kind: 'service' | 'part' | 'labour'
  ref_id: string | null
  name: string
  qty: number
  price: number
  amount: number
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItemRow[]> {
  const { data, error } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({
    kind: r.kind,
    ref_id: r.ref_id ?? null,
    name: r.name,
    qty: r.qty ?? 1,
    price: Number(r.price ?? 0),
    amount: Number(r.amount ?? 0),
  }))
}

function mapInvoice(r: any): Invoice {
  const v = r.vehicles
  return {
    id: r.id,
    invoice_no: r.invoice_no,
    job_card_id: r.job_card_id ?? null,
    vehicle_id: r.vehicle_id ?? null,
    customer_id: r.customer_id ?? null,
    customer_name: r.customers?.name ?? '',
    customer_phone: r.customers?.phone ?? null,
    customer_whatsapp: r.customers?.whatsapp ?? r.customers?.phone ?? null,
    customer_address: r.customers?.address ?? null,
    fuel_type: r.vehicles?.fuel_type ?? null,
    payment_method: r.payment_method ?? null,
    vehicle_label: v ? `${v.brand ?? ''} ${v.model ?? ''}${v.year ? ` · ${v.year}` : ''}`.trim() : '',
    reg_number: v?.reg_number ?? '',
    date: (r.created_at ?? '').slice(0, 10),
    subtotal: Number(r.subtotal ?? 0),
    labour_charge: Number(r.labour_charge ?? 0),
    discount: Number(r.discount ?? 0),
    cgst: Number(r.cgst ?? 0),
    sgst: Number(r.sgst ?? 0),
    grand_total: Number(r.grand_total ?? 0),
    paid: Number(r.paid ?? 0),
    balance: Number(r.balance ?? 0),
    status: r.status,
    is_gst: r.is_gst,
  }
}

// ---------------------------------------------------------------------------
// Spare parts / services
// ---------------------------------------------------------------------------
export async function listSpareParts(search = ''): Promise<SparePart[]> {
  let q = supabase.from('spare_parts').select('*').is('deleted_at', null).order('name')
  if (search.trim()) q = q.or(`name.ilike.%${search}%,part_number.ilike.%${search}%`)
  const { data, error } = await q
  return check(data, error)!.map(mapPart)
}

export async function createSparePart(p: Record<string, unknown>) {
  const { error } = await supabase.from('spare_parts').insert(p)
  if (error) throw new Error(error.message)
}

export async function updateSparePart(id: string, p: Record<string, unknown>) {
  const { error } = await supabase.from('spare_parts').update(p).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSparePart(id: string) {
  // Soft-delete so historic invoice/job-card references stay intact.
  const { error } = await supabase.from('spare_parts').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id)
  if (error) throw new Error(error.message)
}

function mapPart(r: any): SparePart {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    part_number: r.part_number,
    oem_number: r.oem_number,
    image_url: r.image_url,
    unit: r.unit,
    purchase_price: Number(r.purchase_price ?? 0),
    selling_price: Number(r.selling_price ?? 0),
    gst: Number(r.gst ?? 18),
    current_qty: r.current_qty ?? 0,
    min_qty: r.min_qty ?? 0,
    rack_location: r.rack_location,
    warranty: r.warranty,
    active: r.active,
  }
}

export async function listServices(): Promise<ServiceItem[]> {
  const { data, error } = await supabase.from('service_master').select('*').order('name')
  return check(data, error)!.map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    labour_charge: Number(r.labour_charge ?? 0),
    duration_mins: r.duration_mins,
    tax_percent: Number(r.tax_percent ?? 18),
    active: r.active,
  }))
}

export async function createService(p: Record<string, unknown>) {
  const { error } = await supabase.from('service_master').insert(p)
  if (error) throw new Error(error.message)
}

export async function updateService(id: string, p: Record<string, unknown>) {
  const { error } = await supabase.from('service_master').update(p).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('service_master').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Car catalogue (brands + models from DB, fall back handled in hook)
// ---------------------------------------------------------------------------
export async function listBrands(): Promise<CarBrand[]> {
  const { data, error } = await supabase.from('car_brands').select('*').eq('active', true).order('sort_order')
  return check(data, error)!.map((r: any) => ({
    id: r.id,
    name: r.name,
    logo_url: r.logo_url,
    country: r.country,
    sort_order: r.sort_order,
  }))
}

export async function listModels(brandId: string): Promise<CarModel[]> {
  const { data, error } = await supabase.from('car_models').select('*').eq('brand_id', brandId).eq('active', true).order('model_name')
  return check(data, error)!.map((r: any) => ({
    id: r.id,
    brand_id: r.brand_id,
    model_name: r.model_name,
    image_url: r.image_url,
    body_type: r.body_type,
    discontinued: r.discontinued,
  }))
}

// ---------------------------------------------------------------------------
// Company settings
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const r = data as any
  return {
    name: r.name,
    address: r.address ?? '',
    phones: r.phones ?? [],
    whatsapp: r.whatsapp ?? '',
    email: r.email ?? '',
    logo_url: r.logo_url ?? '/logo.svg',
    gst_enabled: r.gst_enabled,
    gst_number: r.gst_number ?? '',
    cgst_percent: Number(r.cgst_percent ?? 9),
    sgst_percent: Number(r.sgst_percent ?? 9),
    invoice_prefix: r.invoice_prefix ?? 'INV',
    estimate_prefix: r.estimate_prefix ?? 'EST',
    jobcard_prefix: r.jobcard_prefix ?? 'JC',
    upi_id: r.upi_id ?? '',
    terms: r.terms ?? '',
  }
}

export async function saveSettings(s: CompanySettings) {
  const { error } = await supabase.from('company_settings').upsert({
    id: 1,
    name: s.name,
    address: s.address,
    phones: s.phones,
    whatsapp: s.whatsapp,
    email: s.email,
    logo_url: s.logo_url,
    gst_enabled: s.gst_enabled,
    gst_number: s.gst_number,
    cgst_percent: s.cgst_percent,
    sgst_percent: s.sgst_percent,
    invoice_prefix: s.invoice_prefix,
    estimate_prefix: s.estimate_prefix,
    jobcard_prefix: s.jobcard_prefix,
    upi_id: s.upi_id,
    terms: s.terms,
  })
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
export async function listStaff(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('staff_id')
  return check(data, error) as unknown as Profile[]
}

export async function setStaffStatus(id: string, status: 'active' | 'inactive') {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateStaffPermissions(id: string, permissions: unknown) {
  const { error } = await supabase.from('profiles').update({ permissions }).eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Provisions a staff auth user + profile via the secure `create_staff` RPC
 * (SECURITY DEFINER, Manager-only). No Edge Function / CORS needed — see
 * supabase/migrations/0005_create_staff_rpc.sql.
 */
export async function createStaffAccount(payload: {
  name: string
  username: string
  email: string
  mobile: string
  password: string
  staff_id: string
  permissions: unknown
}) {
  const { data, error } = await supabase.rpc('create_staff', {
    p_name: payload.name,
    p_username: payload.username,
    p_email: payload.email,
    p_mobile: payload.mobile,
    p_password: payload.password,
    p_staff_id: payload.staff_id,
    p_permissions: payload.permissions,
  })
  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Job card creation (persists services + parts)
// ---------------------------------------------------------------------------
export interface LineService { id: string; name: string; labour_charge: number }
export interface LinePart { id: string; name: string; qty: number; price: number }

export async function createJobCard(input: {
  vehicle: Vehicle
  complaints?: string
  services: LineService[]
  parts: LinePart[]
  labour: number
  status?: string
}) {
  const jobcard_no = await nextSequence('JC')
  const services_total = input.services.reduce((s, x) => s + x.labour_charge, 0)
  const parts_total = input.parts.reduce((s, x) => s + x.qty * x.price, 0)
  const grand_total = services_total + parts_total + input.labour

  const { data, error } = await supabase
    .from('job_cards')
    .insert({
      jobcard_no,
      customer_id: input.vehicle.customer_id,
      vehicle_id: input.vehicle.id,
      odometer: input.vehicle.odometer ?? null,
      complaints: input.complaints ?? null,
      status: input.status ?? 'received',
      services_total,
      parts_total,
      labour_total: input.labour,
      grand_total,
    })
    .select('id, jobcard_no')
    .single()
  if (error) throw new Error(error.message)
  const jobCardId = (data as { id: string }).id

  if (input.services.length) {
    const { error: e } = await supabase.from('job_card_services').insert(
      input.services.map((s) => ({ job_card_id: jobCardId, service_id: s.id, name: s.name, labour_charge: s.labour_charge })),
    )
    if (e) throw new Error(e.message)
  }
  if (input.parts.length) {
    const { error: e } = await supabase.from('job_card_parts').insert(
      input.parts.map((p) => ({ job_card_id: jobCardId, part_id: p.id, name: p.name, qty: p.qty, price: p.price })),
    )
    if (e) throw new Error(e.message)
  }
  return { id: jobCardId, jobcard_no }
}

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------
export async function saveInspection(
  jobCardId: string,
  vehicleId: string,
  items: { item: string; status: string }[],
) {
  if (!items.length) return
  const { data, error } = await supabase
    .from('inspections')
    .insert({ job_card_id: jobCardId, vehicle_id: vehicleId })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const inspId = (data as { id: string }).id
  const { error: e } = await supabase
    .from('inspection_items')
    .insert(items.map((i) => ({ inspection_id: inspId, item: i.item, status: i.status })))
  if (e) throw new Error(e.message)
}

export async function getInspectionByJobCard(jobCardId: string): Promise<{ item: string; status: string }[]> {
  const { data } = await supabase
    .from('inspections')
    .select('id, created_at, inspection_items(item, status)')
    .eq('job_card_id', jobCardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return []
  return ((data as { inspection_items?: { item: string; status: string }[] }).inspection_items) ?? []
}

// ---------------------------------------------------------------------------
// Invoice creation (persists items; deducts stock for parts)
// ---------------------------------------------------------------------------
export async function createInvoice(input: {
  vehicle: Vehicle
  jobCardId?: string | null
  isGst: boolean
  services: LineService[]
  parts: LinePart[]
  labour: number
  discount: number
  cgstPercent: number
  sgstPercent: number
  paid: number
  method: string
  status?: string
}) {
  const invoice_no = await nextSequence('INV')
  const servicesTotal = input.services.reduce((s, x) => s + x.labour_charge, 0)
  const partsTotal = input.parts.reduce((s, x) => s + x.qty * x.price, 0)
  const subtotal = servicesTotal + partsTotal + input.labour - input.discount
  const cgst = input.isGst ? Math.round((subtotal * input.cgstPercent) / 100) : 0
  const sgst = input.isGst ? Math.round((subtotal * input.sgstPercent) / 100) : 0
  const grand_total = subtotal + cgst + sgst
  const balance = grand_total - input.paid
  const status = input.status ?? (input.paid >= grand_total ? 'paid' : input.paid > 0 ? 'partial' : 'confirmed')

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_no,
      customer_id: input.vehicle.customer_id,
      vehicle_id: input.vehicle.id,
      job_card_id: input.jobCardId ?? null,
      is_gst: input.isGst,
      subtotal,
      labour_charge: input.labour,
      discount: input.discount,
      cgst,
      sgst,
      grand_total,
      paid: input.paid,
      balance,
      payment_method: input.method,
      status,
    })
    .select('id, invoice_no')
    .single()
  if (error) throw new Error(error.message)
  const invoiceId = (data as { id: string }).id

  const items = [
    ...input.services.map((s) => ({ invoice_id: invoiceId, kind: 'service', ref_id: s.id, name: s.name, qty: 1, price: s.labour_charge, amount: s.labour_charge })),
    ...input.parts.map((p) => ({ invoice_id: invoiceId, kind: 'part', ref_id: p.id, name: p.name, qty: p.qty, price: p.price, amount: p.qty * p.price })),
  ]
  if (input.labour > 0) items.push({ invoice_id: invoiceId, kind: 'labour', ref_id: null as unknown as string, name: 'Labour Charges', qty: 1, price: input.labour, amount: input.labour })
  if (items.length) {
    const { error: e } = await supabase.from('invoice_items').insert(items)
    if (e) throw new Error(e.message)
  }

  // Deduct stock for each part sold + record a stock movement.
  for (const p of input.parts) {
    const { data: partRow } = await supabase.from('spare_parts').select('current_qty').eq('id', p.id).maybeSingle()
    if (partRow) {
      const prev = (partRow as { current_qty: number }).current_qty
      const next = prev - p.qty
      await supabase.from('spare_parts').update({ current_qty: next }).eq('id', p.id)
      await supabase.from('stock_movements').insert({
        part_id: p.id, movement_type: 'invoice_sale', qty: -p.qty, prev_qty: prev, new_qty: next,
        ref_type: 'invoice', ref_id: invoiceId, note: invoice_no,
      })
    }
  }

  return { id: invoiceId, invoice_no, grand_total, balance }
}

/**
 * Edit an existing invoice (add/remove/fix services, spare parts, labour).
 * Recomputes totals, replaces the line items, and RECONCILES stock — returns
 * stock for removed/reduced parts and deducts for added/increased parts.
 */
export async function updateInvoice(
  id: string,
  input: {
    isGst: boolean
    services: LineService[]
    parts: LinePart[]
    labour: number
    discount: number
    cgstPercent: number
    sgstPercent: number
    paid: number
    method: string
  },
) {
  // 1) Existing part quantities (to reconcile stock).
  const { data: oldItems } = await supabase.from('invoice_items').select('kind, ref_id, qty').eq('invoice_id', id)
  const oldParts = new Map<string, number>()
  ;(oldItems ?? []).forEach((it: any) => {
    if (it.kind === 'part' && it.ref_id) oldParts.set(it.ref_id, (oldParts.get(it.ref_id) ?? 0) + (it.qty ?? 0))
  })

  // 2) Recompute totals (identical formula to createInvoice).
  const servicesTotal = input.services.reduce((s, x) => s + x.labour_charge, 0)
  const partsTotal = input.parts.reduce((s, x) => s + x.qty * x.price, 0)
  const subtotal = servicesTotal + partsTotal + input.labour - input.discount
  const cgst = input.isGst ? Math.round((subtotal * input.cgstPercent) / 100) : 0
  const sgst = input.isGst ? Math.round((subtotal * input.sgstPercent) / 100) : 0
  const grand_total = subtotal + cgst + sgst
  const balance = grand_total - input.paid
  const status = input.paid >= grand_total ? 'paid' : input.paid > 0 ? 'partial' : 'confirmed'

  const { error: upErr } = await supabase
    .from('invoices')
    .update({
      is_gst: input.isGst,
      subtotal,
      labour_charge: input.labour,
      discount: input.discount,
      cgst,
      sgst,
      grand_total,
      paid: input.paid,
      balance,
      payment_method: input.method,
      status,
    })
    .eq('id', id)
  if (upErr) throw new Error(upErr.message)

  // 3) Replace the line items.
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const items = [
    ...input.services.map((s) => ({ invoice_id: id, kind: 'service', ref_id: s.id, name: s.name, qty: 1, price: s.labour_charge, amount: s.labour_charge })),
    ...input.parts.map((p) => ({ invoice_id: id, kind: 'part', ref_id: p.id, name: p.name, qty: p.qty, price: p.price, amount: p.qty * p.price })),
  ]
  if (input.labour > 0) items.push({ invoice_id: id, kind: 'labour', ref_id: null as unknown as string, name: 'Labour Charges', qty: 1, price: input.labour, amount: input.labour })
  if (items.length) {
    const { error: e } = await supabase.from('invoice_items').insert(items)
    if (e) throw new Error(e.message)
  }

  // 4) Reconcile stock by delta = oldQty - newQty (positive returns stock).
  const newParts = new Map<string, number>()
  input.parts.forEach((p) => newParts.set(p.id, (newParts.get(p.id) ?? 0) + p.qty))
  const partIds = new Set<string>([...oldParts.keys(), ...newParts.keys()])
  for (const pid of partIds) {
    const delta = (oldParts.get(pid) ?? 0) - (newParts.get(pid) ?? 0)
    if (delta === 0) continue
    const { data: row } = await supabase.from('spare_parts').select('current_qty').eq('id', pid).maybeSingle()
    if (row) {
      const prev = (row as { current_qty: number }).current_qty
      const next = prev + delta
      await supabase.from('spare_parts').update({ current_qty: next }).eq('id', pid)
      await supabase.from('stock_movements').insert({
        part_id: pid, movement_type: 'adjustment', qty: delta, prev_qty: prev, new_qty: next,
        ref_type: 'invoice_edit', ref_id: id, note: 'Invoice corrected',
      })
    }
  }

  return { id, grand_total, balance }
}

// ---------------------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------------------
export async function createPurchase(
  header: {
    vendor_name: string
    vendor_mobile?: string
    vendor_gst?: string
    bill_number?: string
    total: number
  },
  items: { name: string; qty: number; price: number }[],
) {
  const purchase_no = await nextSequence('PO')
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      purchase_no,
      vendor_name: header.vendor_name,
      vendor_mobile: header.vendor_mobile,
      vendor_gst: header.vendor_gst,
      bill_number: header.bill_number,
      subtotal: header.total,
      total: header.total,
      balance: header.total,
      payment_status: 'unpaid',
      confirmed: true,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const purchaseId = (data as { id: string }).id
  if (items.length) {
    const { error: itemsErr } = await supabase
      .from('purchase_items')
      .insert(items.map((it) => ({ purchase_id: purchaseId, name: it.name, qty: it.qty, price: it.price })))
    if (itemsErr) throw new Error(itemsErr.message)
  }
  return { purchase_no }
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------
export async function getDashboard() {
  const count = (table: string, mod?: (q: any) => any) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (mod) q = mod(q)
    return q
  }
  const [customers, vehicles, activeJobs, ready, lowStockRows] = await Promise.all([
    count('customers', (q) => q.is('deleted_at', null)),
    count('vehicles', (q) => q.is('deleted_at', null)),
    count('job_cards', (q) => q.not('status', 'in', '("delivered","cancelled")')),
    count('job_cards', (q) => q.eq('status', 'ready')),
    supabase.from('spare_parts').select('current_qty, min_qty').is('deleted_at', null),
  ])
  const low = (lowStockRows.data ?? []).filter((p: any) => p.current_qty <= p.min_qty).length
  return {
    totalCustomers: customers.count ?? 0,
    totalVehicles: vehicles.count ?? 0,
    activeJobCards: activeJobs.count ?? 0,
    readyForDelivery: ready.count ?? 0,
    lowStockItems: low,
  }
}
