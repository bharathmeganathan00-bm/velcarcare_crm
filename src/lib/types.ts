/** Domain types for the VELCARCARE CRM. */

export type Role = 'manager' | 'staff'

export type PermissionModule =
  | 'dashboard'
  | 'customers'
  | 'vehicles'
  | 'bookings'
  | 'jobcards'
  | 'inspection'
  | 'services'
  | 'estimates'
  | 'invoices'
  | 'payments'
  | 'inventory'
  | 'purchases'
  | 'reminders'
  | 'reports'

export type PermissionAction =
  | 'view'
  | 'add'
  | 'edit'
  | 'delete'
  | 'print'
  | 'download'
  | 'whatsapp'

export type ModulePermissions = Record<PermissionAction, boolean>
export type PermissionMap = Record<PermissionModule, ModulePermissions>

export interface Profile {
  id: string
  staff_id: string // VCC-STF-001
  name: string
  email: string
  username: string
  mobile: string
  role: Role
  photo_url?: string | null
  joining_date?: string | null
  notes?: string | null
  status: 'active' | 'inactive'
  permissions: PermissionMap
}

export interface Customer {
  id: string
  name: string
  phone: string
  whatsapp?: string | null
  alt_phone?: string | null
  email?: string | null
  address?: string | null
  gst_number?: string | null
  gst_name?: string | null
  account_name?: string | null
  account_number?: string | null
  ifsc?: string | null
  notes?: string | null
  vehicle_count: number
  total_spent: number
  created_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  customer_name?: string
  customer_phone?: string
  reg_number: string
  brand: string
  model: string
  variant?: string | null
  year?: number | null
  fuel_type?: string | null
  transmission?: string | null
  color?: string | null
  chassis_number?: string | null
  engine_number?: string | null
  odometer?: number | null
  insurance_expiry?: string | null
  puc_expiry?: string | null
  last_service_date?: string | null
  next_service_date?: string | null
  image_url?: string | null
  notes?: string | null
}

export type JobCardStatus =
  | 'received'
  | 'inspection'
  | 'estimate_pending'
  | 'awaiting_approval'
  | 'in_service'
  | 'waiting_parts'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface JobCard {
  id: string
  jobcard_no: string
  customer_id: string
  customer_name: string
  vehicle_id: string
  vehicle_label: string
  reg_number: string
  odometer?: number | null
  fuel_level?: string | null
  received_at: string
  expected_delivery?: string | null
  complaints?: string | null
  status: JobCardStatus
  assigned_to?: string | null
  services_total: number
  parts_total: number
  labour_total: number
  grand_total: number
}

export interface CarBrand {
  id: string
  name: string
  logo_url?: string | null
  country?: string
  popular?: boolean
  sort_order: number
}

export interface CarModel {
  id: string
  brand_id: string
  model_name: string
  image_url?: string | null
  body_type?: string
  fuel_types?: string[]
  popular?: boolean
  discontinued?: boolean
  launched_year?: number | null
  discontinued_year?: number | null
}

export interface SparePart {
  id: string
  name: string
  category: string
  part_number?: string | null
  oem_number?: string | null
  image_url?: string | null
  unit: string
  purchase_price: number
  selling_price: number
  gst: number
  current_qty: number
  min_qty: number
  rack_location?: string | null
  warranty?: string | null
  active: boolean
}

export interface ServiceItem {
  id: string
  name: string
  category: string
  description?: string | null
  labour_charge: number
  duration_mins?: number | null
  tax_percent: number
  active: boolean
}

export interface Invoice {
  id: string
  invoice_no: string
  job_card_id?: string | null
  vehicle_id?: string | null
  customer_id?: string | null
  customer_name: string
  customer_phone?: string | null
  customer_whatsapp?: string | null
  customer_address?: string | null
  customer_gst_number?: string | null
  customer_gst_name?: string | null
  customer_account_name?: string | null
  customer_account_number?: string | null
  customer_ifsc?: string | null
  fuel_type?: string | null
  payment_method?: string | null
  vehicle_label: string
  reg_number: string
  date: string
  subtotal: number
  labour_charge?: number
  discount: number
  cgst: number
  sgst: number
  grand_total: number
  paid: number
  balance: number
  status: 'draft' | 'confirmed' | 'paid' | 'partial' | 'cancelled'
  is_gst: boolean
}

export interface CompanySettings {
  name: string
  address: string
  phones: string[]
  whatsapp: string
  email: string
  logo_url: string
  gst_enabled: boolean
  gst_number: string
  cgst_percent: number
  sgst_percent: number
  invoice_prefix: string
  estimate_prefix: string
  jobcard_prefix: string
  upi_id?: string
  terms?: string
}
