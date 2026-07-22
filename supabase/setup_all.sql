-- ============================================================================
-- VELCARCARE CRM — FULL SETUP (run once on a fresh Supabase project)
-- Paste this whole file into the Supabase SQL editor and Run.
-- Order: schema -> RLS -> manager login -> staff RPC -> share logs -> seed.
-- Manager login after this: velcarcarekpm@gmail.com / velcarcare  (or user: manager)
-- ============================================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: 0001_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: 0002_rls.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- VELCARCARE CRM — Row Level Security
-- Manager: full access. Staff: gated by their permissions JSON per module/action.
-- ============================================================================

-- Helper: is the current user a manager?
create or replace function is_manager() returns boolean as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'manager' and p.status = 'active'
  );
$$ language sql stable security definer;

-- Helper: does the current user have module.action permission (managers always true)?
create or replace function has_perm(module text, action text) returns boolean as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'manager'
        or coalesce((p.permissions -> module ->> action)::boolean, false)
      )
  );
$$ language sql stable security definer;

-- Enable RLS on all tables
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','company_settings','car_brands','car_models','car_variants',
    'customers','vehicles','service_master','spare_part_categories','spare_parts',
    'spare_part_compatibility','bookings','job_cards','job_card_services','job_card_parts',
    'job_card_status_history','inspections','inspection_items','estimates','estimate_items',
    'invoices','invoice_items','payments','purchases','purchase_items','stock_movements',
    'reminders','documents','activity_logs'
  ]
  loop
    execute format('alter table %s enable row level security;', t);
  end loop;
end $$;

-- Profiles: everyone authenticated can read; only managers write; users can read self.
create policy profiles_read on profiles for select using (auth.uid() is not null);
create policy profiles_self_update on profiles for update using (id = auth.uid());
create policy profiles_manager_all on profiles for all using (is_manager()) with check (is_manager());

-- Company settings & catalogue: all authenticated read; managers write.
create policy settings_read on company_settings for select using (auth.uid() is not null);
create policy settings_write on company_settings for all using (is_manager()) with check (is_manager());

create policy brands_read on car_brands for select using (auth.uid() is not null);
create policy brands_write on car_brands for all using (is_manager()) with check (is_manager());
create policy models_read on car_models for select using (auth.uid() is not null);
create policy models_write on car_models for all using (is_manager()) with check (is_manager());
create policy variants_read on car_variants for select using (auth.uid() is not null);
create policy variants_write on car_variants for all using (is_manager()) with check (is_manager());

-- Permission-gated modules. Pattern: read on view, write on add/edit/delete.
-- customers
create policy customers_view on customers for select using (has_perm('customers','view'));
create policy customers_add on customers for insert with check (has_perm('customers','add'));
create policy customers_edit on customers for update using (has_perm('customers','edit'));
create policy customers_del on customers for delete using (has_perm('customers','delete'));

-- vehicles
create policy vehicles_view on vehicles for select using (has_perm('vehicles','view'));
create policy vehicles_add on vehicles for insert with check (has_perm('vehicles','add'));
create policy vehicles_edit on vehicles for update using (has_perm('vehicles','edit'));
create policy vehicles_del on vehicles for delete using (has_perm('vehicles','delete'));

-- services
create policy services_view on service_master for select using (has_perm('services','view'));
create policy services_write on service_master for all using (has_perm('services','edit')) with check (has_perm('services','add'));

-- spare parts / inventory
create policy parts_view on spare_parts for select using (has_perm('inventory','view'));
create policy parts_add on spare_parts for insert with check (has_perm('inventory','add'));
create policy parts_edit on spare_parts for update using (has_perm('inventory','edit'));
create policy parts_del on spare_parts for delete using (has_perm('inventory','delete'));
create policy compat_view on spare_part_compatibility for select using (has_perm('inventory','view'));
create policy compat_write on spare_part_compatibility for all using (has_perm('inventory','edit')) with check (has_perm('inventory','add'));
create policy partcat_view on spare_part_categories for select using (auth.uid() is not null);
create policy partcat_write on spare_part_categories for all using (is_manager()) with check (is_manager());
create policy stock_view on stock_movements for select using (has_perm('inventory','view'));
create policy stock_add on stock_movements for insert with check (has_perm('inventory','add'));

-- bookings
create policy bookings_view on bookings for select using (has_perm('bookings','view'));
create policy bookings_write on bookings for all using (has_perm('bookings','edit')) with check (has_perm('bookings','add'));

-- job cards + children
create policy jobcards_view on job_cards for select using (has_perm('jobcards','view'));
create policy jobcards_add on job_cards for insert with check (has_perm('jobcards','add'));
create policy jobcards_edit on job_cards for update using (has_perm('jobcards','edit'));
create policy jobcards_del on job_cards for delete using (has_perm('jobcards','delete'));
create policy jcs_all on job_card_services for all using (has_perm('jobcards','view')) with check (has_perm('jobcards','add'));
create policy jcp_all on job_card_parts for all using (has_perm('jobcards','view')) with check (has_perm('jobcards','add'));
create policy jch_all on job_card_status_history for all using (has_perm('jobcards','view')) with check (has_perm('jobcards','edit'));

-- inspection
create policy insp_view on inspections for select using (has_perm('inspection','view'));
create policy insp_write on inspections for all using (has_perm('inspection','edit')) with check (has_perm('inspection','add'));
create policy inspitems_all on inspection_items for all using (has_perm('inspection','view')) with check (has_perm('inspection','add'));

-- estimates
create policy est_view on estimates for select using (has_perm('estimates','view'));
create policy est_write on estimates for all using (has_perm('estimates','edit')) with check (has_perm('estimates','add'));
create policy estitems_all on estimate_items for all using (has_perm('estimates','view')) with check (has_perm('estimates','add'));

-- invoices
create policy inv_view on invoices for select using (has_perm('invoices','view'));
create policy inv_add on invoices for insert with check (has_perm('invoices','add'));
create policy inv_edit on invoices for update using (has_perm('invoices','edit'));
create policy inv_del on invoices for delete using (has_perm('invoices','delete'));
create policy invitems_all on invoice_items for all using (has_perm('invoices','view')) with check (has_perm('invoices','add'));

-- payments
create policy pay_view on payments for select using (has_perm('payments','view'));
create policy pay_write on payments for all using (has_perm('payments','edit')) with check (has_perm('payments','add'));

-- purchases
create policy pur_view on purchases for select using (has_perm('purchases','view'));
create policy pur_write on purchases for all using (has_perm('purchases','edit')) with check (has_perm('purchases','add'));
create policy puritems_all on purchase_items for all using (has_perm('purchases','view')) with check (has_perm('purchases','add'));

-- reminders
create policy rem_view on reminders for select using (has_perm('reminders','view'));
create policy rem_write on reminders for all using (has_perm('reminders','edit')) with check (has_perm('reminders','add'));

-- documents: any authenticated user with related module view (kept simple)
create policy docs_view on documents for select using (auth.uid() is not null);
create policy docs_write on documents for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- activity logs: managers read all; anyone can insert their own action
create policy logs_read on activity_logs for select using (is_manager() or actor = auth.uid());
create policy logs_insert on activity_logs for insert with check (actor = auth.uid());

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: 0004_create_manager_user.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- VELCARCARE CRM — Create the Manager login in one step
--
-- Creates (or updates) the Supabase Auth user AND links the Manager profile.
-- Run this whole block in the Supabase SQL editor.
--
--   Email:    velcarcarekpm@gmail.com
--   Password: velcarcare
--
-- After running, sign in at the app with that email + password (or username
-- "manager"). Change the password later from Supabase → Authentication → Users.
-- ============================================================================

create extension if not exists "pgcrypto";

do $$
declare
  uid uuid;
  v_email text := 'velcarcarekpm@gmail.com';
  v_pass  text := 'velcarcare';
begin
  select id into uid from auth.users where email = v_email;

  if uid is null then
    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      v_email, crypt(v_pass, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Manager"}'::jsonb,
      '', '', '', ''
    );

    -- identity row (required by GoTrue for email/password sign-in)
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      json_build_object('sub', uid::text, 'email', v_email)::jsonb, 'email',
      now(), now(), now()
    );
  else
    -- user already exists → just (re)set the password and confirm the email
    update auth.users
      set encrypted_password = crypt(v_pass, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          updated_at = now()
      where id = uid;
  end if;

  -- link / upsert the Manager profile
  insert into profiles (id, staff_id, name, username, email, mobile, role, status, permissions)
  values (uid, 'VCC-MGR-001', 'Manager', 'manager', v_email, '9787549179', 'manager', 'active', '{}'::jsonb)
  on conflict (id) do update
    set role = 'manager', status = 'active', username = 'manager', email = excluded.email;

  raise notice 'Manager ready: % (%). Sign in with % / %', 'VCC-MGR-001', uid, v_email, v_pass;
end $$;

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: 0005_create_staff_rpc.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- VELCARCARE CRM — Secure staff creation via RPC (no Edge Function / CORS needed)
--
-- Run this whole block in the Supabase SQL editor. Afterwards the "Add Staff"
-- button in the app works immediately — it calls this function with the
-- Manager's session. Only an active Manager can create staff (checked inside).
-- ============================================================================

create extension if not exists "pgcrypto";

create or replace function public.create_staff(
  p_name        text,
  p_username    text,
  p_email       text,
  p_mobile      text,
  p_password    text,
  p_staff_id    text,
  p_permissions jsonb
) returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_uid uuid;
begin
  -- Only an active Manager may create staff.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager' and status = 'active'
  ) then
    raise exception 'Only an active Manager can create staff';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'A user with this email already exists';
  end if;

  if exists (select 1 from public.profiles where username = p_username) then
    raise exception 'That username is already taken';
  end if;

  new_uid := gen_random_uuid();

  -- Create the auth user (email pre-confirmed).
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated',
    lower(p_email), crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('name', p_name)::jsonb,
    '', '', '', ''
  );

  -- Identity row (required by GoTrue for email/password sign-in).
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), new_uid, new_uid::text,
    json_build_object('sub', new_uid::text, 'email', lower(p_email))::jsonb, 'email',
    now(), now(), now()
  );

  -- Linked staff profile with the chosen permissions.
  insert into public.profiles (id, staff_id, name, username, email, mobile, role, status, permissions)
  values (new_uid, p_staff_id, p_name, p_username, lower(p_email), p_mobile, 'staff', 'active', coalesce(p_permissions, '{}'::jsonb));

  return json_build_object('ok', true, 'user_id', new_uid, 'staff_id', p_staff_id);
end;
$$;

grant execute on function public.create_staff(text, text, text, text, text, text, jsonb) to authenticated;

-- Optional: reset any staff/manager password by email (Manager only).
create or replace function public.reset_user_password(p_email text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'manager' and status = 'active') then
    raise exception 'Only an active Manager can reset passwords';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
    where email = lower(p_email);
  if not found then raise exception 'No user with that email'; end if;
  return json_build_object('ok', true);
end;
$$;

grant execute on function public.reset_user_password(text, text) to authenticated;

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: 0007_invoice_share_logs.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- VELCARCARE CRM — Invoice WhatsApp share logs
--
-- Records who shared an invoice, how, and the outcome. Run in the SQL editor.
-- The "invoice_whatsapp_share" permission is the existing Invoices → WhatsApp
-- cell in the staff permission matrix (permissions -> 'invoices' ->> 'whatsapp');
-- Managers always allowed via is_manager().
-- ============================================================================

create table if not exists invoice_share_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  customer_id uuid references customers(id),
  shared_by uuid references profiles(id),
  shared_by_name text,
  shared_by_role text,               -- manager | staff
  phone_number text,
  share_method text,                 -- web_share | whatsapp_link | pdf_download
  status text,                       -- share_started | share_sheet_opened | whatsapp_opened | completed | failed
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_share_logs_invoice on invoice_share_logs(invoice_id);
create index if not exists idx_share_logs_shared_by on invoice_share_logs(shared_by);

alter table invoice_share_logs enable row level security;

-- Insert: the caller must be allowed to share invoices (manager or the
-- invoices.whatsapp permission) and must log under their own id.
drop policy if exists share_logs_insert on invoice_share_logs;
create policy share_logs_insert on invoice_share_logs
  for insert
  with check (shared_by = auth.uid() and has_perm('invoices', 'whatsapp'));

-- Read history: managers see all; staff with invoices.view see it too.
drop policy if exists share_logs_read on invoice_share_logs;
create policy share_logs_read on invoice_share_logs
  for select
  using (is_manager() or has_perm('invoices', 'view'));

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: seed.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================================
-- VELCARCARE CRM — Seed data
-- Run AFTER 0001_schema.sql and 0002_rls.sql.
-- NOTE: create the Manager auth user first (see README), then run 0003 to link
-- the profile. This file seeds settings + catalogue + services + parts.
-- ============================================================================

-- Company settings ----------------------------------------------------------
insert into company_settings (id, name, address, phones, whatsapp, email, logo_url,
  gst_enabled, gst_number, cgst_percent, sgst_percent, invoice_prefix, estimate_prefix, jobcard_prefix, upi_id, terms)
values (1, 'VELCARCARE',
  'No. 31/4B2, Chinnaiyankulam, Military Road, Kanchipuram – 631 501, Tamil Nadu',
  array['9787549179','7339477926'], '9787549179', 'velcarcarekpm@gmail.com', '/logo.svg',
  false, null, 9, 9, 'INV', 'EST', 'JC', 'velcarcare@upi',
  'Goods once sold will not be taken back. Warranty as per manufacturer terms.')
on conflict (id) do nothing;

-- Car brands -----------------------------------------------------------------
insert into car_brands (name, country, sort_order) values
  ('Maruti Suzuki','India',1),('Hyundai','South Korea',2),('Tata','India',3),
  ('Mahindra','India',4),('Toyota','Japan',5),('Honda','Japan',6),('Kia','South Korea',7),
  ('Renault','France',8),('Nissan','Japan',9),('Ford','USA',10),('Volkswagen','Germany',11),
  ('Skoda','Czech Republic',12),('MG','UK',13),('Chevrolet','USA',14),('Fiat','Italy',15),
  ('Datsun','Japan',16),('Jeep','USA',17),('Citroen','France',18),('Isuzu','Japan',19),
  ('Force Motors','India',20),('Mitsubishi','Japan',21),('Mercedes-Benz','Germany',22),
  ('BMW','Germany',23),('Audi','Germany',24),('Volvo','Sweden',25),('Land Rover','UK',26),
  ('Mini','UK',27),('Other','',99)
on conflict (name) do nothing;

-- Car models (subset of the built-in catalogue; app ships full list in src/data) --
insert into car_models (brand_id, model_name, discontinued)
select b.id, m.name, m.disc from car_brands b join (values
  ('Maruti Suzuki','Alto',false),('Maruti Suzuki','Alto K10',false),('Maruti Suzuki','Wagon R',false),
  ('Maruti Suzuki','Swift',false),('Maruti Suzuki','Swift Dzire',false),('Maruti Suzuki','Dzire',false),
  ('Maruti Suzuki','Celerio',false),('Maruti Suzuki','Baleno',false),('Maruti Suzuki','Ertiga',false),
  ('Maruti Suzuki','Brezza',false),('Maruti Suzuki','Eeco',false),('Maruti Suzuki','Ciaz',false),
  ('Maruti Suzuki','Grand Vitara',false),('Maruti Suzuki','Fronx',false),('Maruti Suzuki','Jimny',false),
  ('Maruti Suzuki','800',true),('Maruti Suzuki','Omni',true),('Maruti Suzuki','Zen',true),('Maruti Suzuki','Esteem',true),
  ('Hyundai','Santro',true),('Hyundai','i10',false),('Hyundai','Grand i10 Nios',false),('Hyundai','i20',false),
  ('Hyundai','Verna',false),('Hyundai','Aura',false),('Hyundai','Creta',false),('Hyundai','Venue',false),
  ('Hyundai','Alcazar',false),('Hyundai','Tucson',false),('Hyundai','Exter',false),('Hyundai','Eon',true),('Hyundai','Getz',true),
  ('Tata','Tiago',false),('Tata','Tigor',false),('Tata','Altroz',false),('Tata','Punch',false),
  ('Tata','Nexon',false),('Tata','Harrier',false),('Tata','Safari',false),('Tata','Curvv',false),
  ('Tata','Indica',true),('Tata','Indigo',true),('Tata','Nano',true),('Tata','Sumo',true),
  ('Mahindra','Bolero',false),('Mahindra','Scorpio',false),('Mahindra','Scorpio N',false),('Mahindra','XUV300',false),
  ('Mahindra','XUV400',false),('Mahindra','XUV700',false),('Mahindra','Thar',false),('Mahindra','Marazzo',false),
  ('Mahindra','XUV500',true),('Mahindra','TUV300',true),('Mahindra','KUV100',true),
  ('Toyota','Innova',false),('Toyota','Innova Crysta',false),('Toyota','Innova Hycross',false),('Toyota','Fortuner',false),
  ('Toyota','Glanza',false),('Toyota','Hyryder',false),('Toyota','Rumion',false),('Toyota','Camry',false),
  ('Toyota','Qualis',true),('Toyota','Etios',true),('Toyota','Corolla Altis',true),
  ('Honda','City',false),('Honda','Amaze',false),('Honda','Elevate',false),
  ('Honda','Jazz',true),('Honda','Brio',true),('Honda','WR-V',true),('Honda','Civic',true),
  ('Kia','Seltos',false),('Kia','Sonet',false),('Kia','Carens',false),('Kia','Carnival',false),('Kia','Syros',false),
  ('Renault','Kwid',false),('Renault','Triber',false),('Renault','Kiger',false),('Renault','Duster',true),('Renault','Lodgy',true),
  ('Nissan','Magnite',false),('Nissan','Micra',true),('Nissan','Sunny',true),('Nissan','Terrano',true),
  ('Ford','Figo',true),('Ford','Aspire',true),('Ford','EcoSport',true),('Ford','Endeavour',true),
  ('Volkswagen','Virtus',false),('Volkswagen','Taigun',false),('Volkswagen','Polo',true),('Volkswagen','Vento',true),
  ('Skoda','Slavia',false),('Skoda','Kushaq',false),('Skoda','Rapid',true),('Skoda','Octavia',false),
  ('MG','Hector',false),('MG','Astor',false),('MG','ZS EV',false),('MG','Comet EV',false),
  ('Chevrolet','Beat',true),('Chevrolet','Spark',true),('Chevrolet','Cruze',true),('Chevrolet','Tavera',true),
  ('Jeep','Compass',false),('Jeep','Meridian',false),
  ('Citroen','C3',false),('Citroen','C3 Aircross',false)
) as m(brand,name,disc) on b.name = m.brand
on conflict (brand_id, model_name) do nothing;

-- Service master -------------------------------------------------------------
insert into service_master (name, category, labour_charge, duration_mins, tax_percent) values
  ('General Service','General Service',800,90,18),
  ('Oil Change','Oil and Filters',300,30,18),
  ('Wheel Alignment','Wheel Alignment',600,45,18),
  ('AC Service','AC',1200,60,18),
  ('Brake Service','Brake',700,60,18),
  ('Clutch Overhaul','Clutch',2500,180,18),
  ('Battery Check & Replace','Battery',200,20,18),
  ('Full Body Wash','Washing',350,40,18),
  ('Interior Detailing','Detailing',1500,120,18),
  ('Engine Diagnostics','Diagnostics',500,45,18),
  ('Denting & Painting (per panel)','Painting',2000,240,18),
  ('Suspension Work','Suspension',1800,150,18)
on conflict do nothing;

-- Spare part categories ------------------------------------------------------
insert into spare_part_categories (name, sort_order) values
  ('Engine',1),('Filters',2),('Brake',3),('Suspension',4),('Steering',5),
  ('Clutch and Transmission',6),('Electrical',7),('Battery',8),('AC',9),
  ('Fuel',10),('Body',11),('Tyres and Wheels',12),('Fluids',13),('Consumables',14)
on conflict (name) do nothing;

-- Sample spare parts ---------------------------------------------------------
insert into spare_parts (name, category, part_number, unit, purchase_price, selling_price, gst, opening_qty, current_qty, min_qty, rack_location, warranty) values
  ('Engine Oil 5W30','Fluids','EO-5W30-1L','Litre',320,450,18,2,2,6,'A1','—'),
  ('Oil Filter','Filters','OF-1042','Piece',120,180,18,3,3,8,'B2','—'),
  ('Air Filter','Filters','AF-2210','Piece',170,250,18,4,4,8,'B3','—'),
  ('Cabin AC Filter','Filters','CF-330','Piece',150,240,18,10,10,6,'B4','—'),
  ('Front Brake Pad Set','Brake','BP-F-556','Set',620,950,18,1,1,5,'C1','6 months'),
  ('Rear Brake Shoe','Brake','BS-R-221','Set',380,600,18,5,5,4,'C2','6 months'),
  ('Car Battery 35AH','Battery','BAT-35AH','Piece',3800,4600,18,2,2,4,'D1','24 months'),
  ('Spark Plug','Electrical','SP-778','Piece',85,120,18,6,6,12,'E2','—'),
  ('Wiper Blade','Body','WB-18','Piece',180,280,18,14,14,6,'F1','—'),
  ('Coolant 1L','Fluids','CL-1L','Litre',140,210,18,9,9,6,'A2','—'),
  ('Clutch Plate','Clutch and Transmission','CP-990','Piece',1800,2600,18,2,2,3,'G1','12 months'),
  ('Shock Absorber Front','Suspension','SA-F-140','Piece',1200,1750,18,3,3,4,'H1','12 months')
on conflict do nothing;

-- Record opening stock movements
insert into stock_movements (part_id, movement_type, qty, prev_qty, new_qty, ref_type, note)
select id, 'opening', current_qty, 0, current_qty, 'seed', 'Opening stock' from spare_parts;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SOURCE: 0008_invoice_labour_charge.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

alter table public.invoices
  add column if not exists labour_charge numeric(12,2) not null default 0;
