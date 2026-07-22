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
