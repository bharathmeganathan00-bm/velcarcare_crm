-- ============================================================================
-- VELCARCARE CRM — Labour charge on invoices
-- Adds a dedicated labour_charge column (idempotent). Run in the SQL editor.
-- ============================================================================

alter table public.invoices
  add column if not exists labour_charge numeric(12,2) not null default 0;
