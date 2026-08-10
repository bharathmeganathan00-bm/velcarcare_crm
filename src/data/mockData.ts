import type {
  Customer,
  Invoice,
  JobCard,
  ServiceItem,
  SparePart,
  Vehicle,
  CompanySettings,
} from '@/lib/types'

export const COMPANY: CompanySettings = {
  name: 'VELCARCARE',
  address: 'No. 31/4B2, Chinnaiyankulam, Military Road, Kanchipuram – 631 501, Tamil Nadu',
  phones: ['9787549179', '7339477926'],
  whatsapp: '9787549179',
  email: 'velcarcarekpm@gmail.com',
  logo_url: '/logo.svg',
  gst_enabled: false,
  gst_number: '',
  cgst_percent: 9,
  sgst_percent: 9,
  invoice_prefix: 'INV',
  estimate_prefix: 'EST',
  jobcard_prefix: 'JC',
  upi_id: 'velcarcare@upi',
  terms: 'Goods once sold will not be taken back. Warranty as per manufacturer terms.',
}

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Ramesh Kumar', phone: '9787549179', whatsapp: '9787549179', email: 'ramesh@example.com', address: 'Kanchipuram', vehicle_count: 2, total_spent: 24500, created_at: '2026-01-12' },
  { id: 'c2', name: 'Suresh Babu', phone: '9840012345', vehicle_count: 1, total_spent: 8900, created_at: '2026-02-03', whatsapp: null },
  { id: 'c3', name: 'Karthik R', phone: '9600045678', vehicle_count: 1, total_spent: 15600, created_at: '2026-02-20', whatsapp: null },
  { id: 'c4', name: 'Arun Prakash', phone: '9500067890', vehicle_count: 3, total_spent: 41200, created_at: '2026-03-11', whatsapp: null },
  { id: 'c5', name: 'Vijay Anand', phone: '9791023456', vehicle_count: 1, total_spent: 5400, created_at: '2026-04-01', whatsapp: null },
  { id: 'c6', name: 'Lakshmi Narayan', phone: '9445098765', vehicle_count: 1, total_spent: 12300, created_at: '2026-05-19', whatsapp: null },
]

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', customer_id: 'c1', customer_name: 'Ramesh Kumar', reg_number: 'TN 21 AQ 1234', brand: 'Maruti Suzuki', model: 'Swift Dzire', variant: 'VXI', year: 2022, fuel_type: 'Petrol', transmission: 'Manual', color: 'Silver', odometer: 41280, next_service_date: '2026-08-15' },
  { id: 'v2', customer_id: 'c2', customer_name: 'Suresh Babu', reg_number: 'TN 07 BR 6789', brand: 'Maruti Suzuki', model: 'Swift', variant: 'ZXI', year: 2019, fuel_type: 'Petrol', odometer: 68200, next_service_date: '2026-07-28' },
  { id: 'v3', customer_id: 'c3', customer_name: 'Karthik R', reg_number: 'TN 11 AJ 4567', brand: 'Hyundai', model: 'Creta', variant: 'SX', year: 2021, fuel_type: 'Diesel', odometer: 52100, next_service_date: '2026-07-20' },
  { id: 'v4', customer_id: 'c4', customer_name: 'Arun Prakash', reg_number: 'TN 09 CC 8899', brand: 'Hyundai', model: 'i20', variant: 'Asta', year: 2020, fuel_type: 'Petrol', odometer: 33400 },
  { id: 'v5', customer_id: 'c1', customer_name: 'Ramesh Kumar', reg_number: 'TN 21 BG 9021', brand: 'Toyota', model: 'Innova Crysta', variant: 'GX', year: 2018, fuel_type: 'Diesel', odometer: 98700 },
]

export const MOCK_JOBCARDS: JobCard[] = [
  { id: 'j1', jobcard_no: 'JC-000125', customer_id: 'c1', customer_name: 'Ramesh Kumar', vehicle_id: 'v1', vehicle_label: 'Swift Dzire · 2022', reg_number: 'TN 21 AQ 1234', odometer: 41280, received_at: '2026-07-16T10:00:00', status: 'in_service', assigned_to: 'Mani', services_total: 1000, parts_total: 880, labour_total: 400, grand_total: 2280 },
  { id: 'j2', jobcard_no: 'JC-000124', customer_id: 'c3', customer_name: 'Karthik R', vehicle_id: 'v3', vehicle_label: 'Creta · 2021', reg_number: 'TN 11 AJ 4567', odometer: 52100, received_at: '2026-07-16T09:15:00', status: 'inspection', assigned_to: 'Ravi', services_total: 0, parts_total: 0, labour_total: 0, grand_total: 0 },
  { id: 'j3', jobcard_no: 'JC-000123', customer_id: 'c2', customer_name: 'Suresh Babu', vehicle_id: 'v2', vehicle_label: 'Swift · 2019', reg_number: 'TN 07 BR 6789', odometer: 68200, received_at: '2026-07-15T14:30:00', status: 'ready', assigned_to: 'Mani', services_total: 600, parts_total: 450, labour_total: 300, grand_total: 1350 },
  { id: 'j4', jobcard_no: 'JC-000122', customer_id: 'c4', customer_name: 'Arun Prakash', vehicle_id: 'v4', vehicle_label: 'i20 · 2020', reg_number: 'TN 09 CC 8899', odometer: 33400, received_at: '2026-07-15T11:00:00', status: 'awaiting_approval', assigned_to: 'Ravi', services_total: 1800, parts_total: 2400, labour_total: 600, grand_total: 4800 },
  { id: 'j5', jobcard_no: 'JC-000121', customer_id: 'c5', customer_name: 'Vijay Anand', vehicle_id: 'v5', vehicle_label: 'Innova Crysta · 2018', reg_number: 'TN 21 BG 9021', odometer: 98700, received_at: '2026-07-14T16:00:00', status: 'delivered', assigned_to: 'Mani', services_total: 2200, parts_total: 3200, labour_total: 800, grand_total: 6200 },
]

export const MOCK_SPARE_PARTS: SparePart[] = [
  { id: 'p1', name: 'Engine Oil 1L', category: 'Fluids', part_number: 'EO-1L', unit: 'Litre', purchase_price: 320, selling_price: 450, gst: 18, current_qty: 2, min_qty: 6, rack_location: 'A1', warranty: '—', active: true },
  { id: 'p1a', name: 'Engine Oil 1.5L', category: 'Fluids', part_number: 'EO-1.5L', unit: 'Litre', purchase_price: 470, selling_price: 650, gst: 18, current_qty: 1, min_qty: 4, rack_location: 'A1', warranty: '—', active: true },
  { id: 'p2', name: 'Coolant 1L', category: 'Fluids', part_number: 'CL-1L', unit: 'Litre', purchase_price: 140, selling_price: 210, gst: 18, current_qty: 9, min_qty: 6, rack_location: 'A2', warranty: '—', active: true },
  { id: 'p2a', name: 'Coolant 1.5L', category: 'Fluids', part_number: 'CL-1.5L', unit: 'Litre', purchase_price: 210, selling_price: 310, gst: 18, current_qty: 5, min_qty: 4, rack_location: 'A2', warranty: '—', active: true },
  { id: 'p3', name: 'Oil Filter', category: 'Filters', part_number: 'OF-1042', unit: 'Piece', purchase_price: 120, selling_price: 180, gst: 18, current_qty: 3, min_qty: 8, rack_location: 'B2', warranty: '—', active: true },
  { id: 'p4', name: 'Air Filter', category: 'Filters', part_number: 'AF-2210', unit: 'Piece', purchase_price: 170, selling_price: 250, gst: 18, current_qty: 4, min_qty: 8, rack_location: 'B3', warranty: '—', active: true },
  { id: 'p5', name: 'Brake Pad Front', category: 'Brake', part_number: 'BP-F-556', unit: 'Set', purchase_price: 620, selling_price: 950, gst: 18, current_qty: 1, min_qty: 5, rack_location: 'C1', warranty: '6 months', active: true },
  { id: 'p6', name: 'Battery SSAH', category: 'Battery', part_number: 'BAT-35AH', unit: 'Piece', purchase_price: 3800, selling_price: 4600, gst: 18, current_qty: 2, min_qty: 4, rack_location: 'D1', warranty: '24 months', active: true },
  { id: 'p6', name: 'Spark Plug', category: 'Electrical', part_number: 'SP-778', unit: 'Piece', purchase_price: 85, selling_price: 120, gst: 18, current_qty: 6, min_qty: 12, rack_location: 'E2', warranty: '—', active: true },
  { id: 'p7', name: 'Wiper Blade', category: 'Body', part_number: 'WB-18', unit: 'Piece', purchase_price: 180, selling_price: 280, gst: 18, current_qty: 14, min_qty: 6, rack_location: 'F1', warranty: '—', active: true },
  { id: 'p8', name: 'Coolant 1L', category: 'Fluids', part_number: 'CL-1L', unit: 'Litre', purchase_price: 140, selling_price: 210, gst: 18, current_qty: 9, min_qty: 6, rack_location: 'A2', warranty: '—', active: true },
]

export const MOCK_SERVICES: ServiceItem[] = [
  { id: 's1', name: 'General Service', category: 'General Service', labour_charge: 800, duration_mins: 90, tax_percent: 18, active: true },
  { id: 's2', name: 'Wheel Alignment', category: 'Wheel Alignment', labour_charge: 600, duration_mins: 45, tax_percent: 18, active: true },
  { id: 's3', name: 'AC Service', category: 'AC', labour_charge: 1200, duration_mins: 60, tax_percent: 18, active: true },
  { id: 's4', name: 'Oil Change', category: 'Oil and Filters', labour_charge: 300, duration_mins: 30, tax_percent: 18, active: true },
  { id: 's5', name: 'Brake Service', category: 'Brake', labour_charge: 700, duration_mins: 60, tax_percent: 18, active: true },
  { id: 's6', name: 'Full Body Wash', category: 'Washing', labour_charge: 350, duration_mins: 40, tax_percent: 18, active: true },
]

export const MOCK_INVOICES: Invoice[] = [
  { id: 'i1', invoice_no: 'INV-000125', customer_name: 'Ramesh Kumar', vehicle_label: 'Swift Dzire · 2022', reg_number: 'TN 21 AQ 1234', date: '2026-07-16', subtotal: 2280, discount: 0, cgst: 0, sgst: 0, grand_total: 2280, paid: 2280, balance: 0, status: 'paid', is_gst: false },
  { id: 'i2', invoice_no: 'INV-000124', customer_name: 'Suresh Babu', vehicle_label: 'Swift · 2019', reg_number: 'TN 07 BR 6789', date: '2026-07-15', subtotal: 1350, discount: 0, cgst: 0, sgst: 0, grand_total: 1350, paid: 500, balance: 850, status: 'partial', is_gst: false },
  { id: 'i3', invoice_no: 'INV-000123', customer_name: 'Arun Prakash', vehicle_label: 'i20 · 2020', reg_number: 'TN 09 CC 8899', date: '2026-07-14', subtotal: 4800, discount: 200, cgst: 0, sgst: 0, grand_total: 4600, paid: 0, balance: 4600, status: 'confirmed', is_gst: false },
]

/** Aggregated dashboard metrics. */
export const DASHBOARD = {
  totalCustomers: 1248,
  totalVehicles: 1682,
  activeJobCards: 28,
  readyForDelivery: 4,
  todayRevenue: 45680,
  monthRevenue: 842300,
  pendingPayments: 32450,
  pendingInvoices: 12,
  lowStockItems: 14,
  todayBookings: 6,
  completedJobs: 9,
  customerGrowth: 12.5,
  vehicleGrowth: 15.3,
  revenueGrowth: 8.2,
}

/** Job-card status distribution for the donut. */
export const JOBCARD_DISTRIBUTION = [
  { name: 'Received', value: 5, color: '#2563EB' },
  { name: 'Inspection', value: 6, color: '#0EA5E9' },
  { name: 'In Service', value: 10, color: '#F59E0B' },
  { name: 'Waiting Parts', value: 3, color: '#EF4444' },
  { name: 'Ready', value: 4, color: '#16A34A' },
]

/** 7-day revenue trend. */
export const REVENUE_TREND = [
  { day: 'Mon', revenue: 38200 },
  { day: 'Tue', revenue: 42100 },
  { day: 'Wed', revenue: 51600 },
  { day: 'Thu', revenue: 39800 },
  { day: 'Fri', revenue: 47300 },
  { day: 'Sat', revenue: 62400 },
  { day: 'Sun', revenue: 45680 },
]

export const TODAY_APPOINTMENTS = [
  { time: '10:00 AM', customer: 'Ramesh Kumar', vehicle: 'Innova Crysta', reg: 'TN 21 AQ 1234', service: 'General Service' },
  { time: '11:30 AM', customer: 'Suresh Babu', vehicle: 'Swift Dzire', reg: 'TN 07 BR 6789', service: 'Oil Change' },
  { time: '01:00 PM', customer: 'Karthik R', vehicle: 'Creta', reg: 'TN 11 AJ 4567', service: 'AC Service' },
  { time: '03:00 PM', customer: 'Arun Prakash', vehicle: 'i20', reg: 'TN 09 CC 8899', service: 'Wheel Alignment' },
]
