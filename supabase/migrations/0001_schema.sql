-- ============================================================================
-- VELCARCARE CRM — Schema
-- Run in Supabase SQL editor (or `supabase db push`). Order: 0001 → 0002 → seed.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Reusable audit columns are added inline per table.

-- ---------------------------------------------------------------------------
-- Profiles & permissions
-- ---------------------------------------------------------------------------
create type user_role as enum ('manager', 'staff');
create type user_status as enum ('active', 'inactive');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  staff_id text unique not null,
  name text not null,
  username text unique not null,
  email text unique not null,
  mobile text,
  role user_role not null default 'staff',
  status user_status not null default 'active',
  photo_url text,
  joining_date date,
  notes text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Company settings (single row)
-- ---------------------------------------------------------------------------
create table company_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'VELCARCARE',
  address text,
  phones text[] default '{}',
  whatsapp text,
  email text,
  logo_url text,
  gst_enabled boolean not null default false,
  gst_number text,
  cgst_percent numeric(5,2) default 9,
  sgst_percent numeric(5,2) default 9,
  invoice_prefix text default 'INV',
  estimate_prefix text default 'EST',
  jobcard_prefix text default 'JC',
  upi_id text,
  bank_details text,
  terms text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Car catalogue
-- ---------------------------------------------------------------------------
create table car_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  country text,
  active boolean default true,
  sort_order int default 100,
  created_at timestamptz default now()
);

create table car_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references car_brands(id) on delete cascade,
  model_name text not null,
  image_url text,
  body_type text,
  fuel_types text[] default '{}',
  active boolean default true,
  discontinued boolean default false,
  launched_year int,
  discontinued_year int,
  created_at timestamptz default now(),
  unique (brand_id, model_name)
);

create table car_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references car_models(id) on delete cascade,
  variant_name text not null,
  fuel_type text,
  transmission text,
  engine text,
  start_year int,
  end_year int,
  active boolean default true
);

-- ---------------------------------------------------------------------------
-- Customers & vehicles
-- ---------------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  whatsapp text,
  alt_phone text,
  email text,
  address text,
  notes text,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_customers_phone on customers(phone);
create index idx_customers_name on customers using gin (to_tsvector('simple', name));

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  reg_number text not null,
  brand text,
  model text,
  variant text,
  year int,
  fuel_type text,
  transmission text,
  color text,
  chassis_number text,
  engine_number text,
  odometer int,
  insurance_expiry date,
  puc_expiry date,
  last_service_date date,
  next_service_date date,
  image_url text,
  notes text,
  created_by uuid references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_vehicles_reg on vehicles(reg_number);
create index idx_vehicles_customer on vehicles(customer_id);

-- ---------------------------------------------------------------------------
-- Services & spare parts
-- ---------------------------------------------------------------------------
create table service_master (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  labour_charge numeric(12,2) default 0,
  duration_mins int,
  tax_percent numeric(5,2) default 18,
  icon text,
  active boolean default true,
  created_at timestamptz default now()
);

create table spare_part_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int default 100
);

create table spare_parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  part_number text,
  oem_number text,
  barcode text,
  image_url text,
  unit text default 'Piece',
  purchase_price numeric(12,2) default 0,
  selling_price numeric(12,2) default 0,
  gst numeric(5,2) default 18,
  opening_qty int default 0,
  current_qty int default 0,
  min_qty int default 0,
  rack_location text,
  warranty text,
  notes text,
  active boolean default true,
  created_by uuid references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_parts_name on spare_parts(name);
create index idx_parts_number on spare_parts(part_number);

create table spare_part_compatibility (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references spare_parts(id) on delete cascade,
  brand text,
  model text,
  variant text,
  year_from int,
  year_to int
);
create index idx_compat_part on spare_part_compatibility(part_id);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  booking_at timestamptz not null,
  service_hint text,
  status text default 'scheduled',
  assigned_to uuid references profiles(id),
  notes text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Job cards
-- ---------------------------------------------------------------------------
create type jobcard_status as enum (
  'received','inspection','estimate_pending','awaiting_approval','in_service',
  'waiting_parts','quality_check','ready','delivered','cancelled'
);

create table job_cards (
  id uuid primary key default gen_random_uuid(),
  jobcard_no text unique not null,
  customer_id uuid not null references customers(id),
  vehicle_id uuid not null references vehicles(id),
  odometer int,
  fuel_level text,
  received_at timestamptz not null default now(),
  expected_delivery timestamptz,
  complaints text,
  status jobcard_status not null default 'received',
  assigned_to uuid references profiles(id),
  services_total numeric(12,2) default 0,
  parts_total numeric(12,2) default 0,
  labour_total numeric(12,2) default 0,
  grand_total numeric(12,2) default 0,
  notes text,
  created_by uuid references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_jobcards_status on job_cards(status);
create index idx_jobcards_customer on job_cards(customer_id);

create table job_card_services (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid not null references job_cards(id) on delete cascade,
  service_id uuid references service_master(id),
  name text,
  labour_charge numeric(12,2) default 0,
  tax_percent numeric(5,2) default 18
);

create table job_card_parts (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid not null references job_cards(id) on delete cascade,
  part_id uuid references spare_parts(id),
  name text,
  qty int default 1,
  price numeric(12,2) default 0,
  gst numeric(5,2) default 18,
  used boolean default false  -- stock deducted only when true / invoice confirmed
);

create table job_card_status_history (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid not null references job_cards(id) on delete cascade,
  status jobcard_status not null,
  changed_by uuid references profiles(id),
  changed_at timestamptz default now(),
  note text
);

-- ---------------------------------------------------------------------------
-- Inspections
-- ---------------------------------------------------------------------------
create table inspections (
  id uuid primary key default gen_random_uuid(),
  job_card_id uuid references job_cards(id) on delete cascade,
  vehicle_id uuid references vehicles(id),
  performed_by uuid references profiles(id),
  notes text,
  created_at timestamptz default now()
);

create table inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  item text not null,
  status text,               -- good | attention | urgent | repaired | replaced | na
  note text,
  before_photo_url text,
  after_photo_url text
);

-- ---------------------------------------------------------------------------
-- Estimates
-- ---------------------------------------------------------------------------
create table estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_no text unique not null,
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  job_card_id uuid references job_cards(id),
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  cgst numeric(12,2) default 0,
  sgst numeric(12,2) default 0,
  grand_total numeric(12,2) default 0,
  validity_date date,
  notes text,
  status text default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  kind text,                 -- service | part | labour
  ref_id uuid,
  name text,
  qty int default 1,
  price numeric(12,2) default 0,
  gst numeric(5,2) default 18
);

-- ---------------------------------------------------------------------------
-- Invoices & payments
-- ---------------------------------------------------------------------------
create type invoice_status as enum ('draft','confirmed','paid','partial','cancelled');

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  job_card_id uuid references job_cards(id),
  is_gst boolean default false,
  gst_number text,
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  cgst numeric(12,2) default 0,
  sgst numeric(12,2) default 0,
  round_off numeric(12,2) default 0,
  grand_total numeric(12,2) default 0,
  paid numeric(12,2) default 0,
  balance numeric(12,2) default 0,
  payment_method text,
  status invoice_status not null default 'draft',
  next_service_date date,
  warranty_notes text,
  stock_deducted boolean default false,  -- guards against double deduction
  created_by uuid references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_invoices_status on invoices(status);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  kind text,                 -- service | part | labour
  ref_id uuid,
  name text,
  qty int default 1,
  price numeric(12,2) default 0,
  gst numeric(5,2) default 18,
  amount numeric(12,2) default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  customer_id uuid references customers(id),
  amount numeric(12,2) not null,
  method text,
  reference text,
  paid_at timestamptz default now(),
  notes text,
  created_by uuid references profiles(id)
);

-- ---------------------------------------------------------------------------
-- Purchases (vendor details inline, no supplier module)
-- ---------------------------------------------------------------------------
create table purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_no text unique not null,
  purchase_date date not null default current_date,
  vendor_name text,
  vendor_mobile text,
  vendor_gst text,
  bill_number text,
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  gst numeric(12,2) default 0,
  total numeric(12,2) default 0,
  paid numeric(12,2) default 0,
  balance numeric(12,2) default 0,
  payment_status text default 'unpaid',
  bill_url text,
  notes text,
  confirmed boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  part_id uuid references spare_parts(id),
  name text,
  qty int default 1,
  price numeric(12,2) default 0,
  gst numeric(5,2) default 18
);

-- ---------------------------------------------------------------------------
-- Stock movements (audit of every quantity change)
-- ---------------------------------------------------------------------------
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references spare_parts(id) on delete cascade,
  movement_type text not null, -- opening | purchase | jobcard_usage | invoice_sale | adjustment | damaged | returned | reversal
  qty int not null,            -- signed: +in / -out
  prev_qty int,
  new_qty int,
  ref_type text,
  ref_id uuid,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_stock_part on stock_movements(part_id);

-- ---------------------------------------------------------------------------
-- Reminders, documents, activity logs
-- ---------------------------------------------------------------------------
create table reminders (
  id uuid primary key default gen_random_uuid(),
  type text not null,        -- next_service | pending_payment | insurance | puc | estimate_followup | delivery
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  due_date date,
  status text default 'upcoming', -- upcoming | due_today | overdue | completed | cancelled
  assigned_to uuid references profiles(id),
  note text,
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_type text,           -- customer | vehicle | jobcard | invoice | purchase
  owner_id uuid,
  name text,
  url text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id),
  action text,
  entity_type text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index idx_activity_actor on activity_logs(actor);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['profiles','customers','vehicles','spare_parts','job_cards','invoices']
  loop
    execute format('create trigger trg_%s_updated before update on %s for each row execute function set_updated_at();', t, t);
  end loop;
end $$;
