-- ============================================================================
-- VELCARCARE CRM — Editable invoice date
-- The invoice date was always just `created_at` (fixed at insert time, never
-- shown as an editable field). Adds a real `invoice_date` column that the app
-- sets at creation and can change afterward on edit. Existing rows are
-- backfilled from their created_at so historical invoice dates are preserved.
-- Idempotent — safe to run more than once. Run in the SQL editor.
-- ============================================================================

alter table public.invoices
  add column if not exists invoice_date date;

update public.invoices set invoice_date = created_at::date where invoice_date is null;

alter table public.invoices
  alter column invoice_date set default current_date,
  alter column invoice_date set not null;
