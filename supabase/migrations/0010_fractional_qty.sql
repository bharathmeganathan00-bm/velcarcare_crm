-- ============================================================================
-- VELCARCARE CRM — Fractional quantities for Litre-based spare parts
-- The UI lets staff pick quantities in 0.5 steps for Litre-unit parts (e.g.
-- "3.5 L" engine oil), but every qty column was `int`, so saving such a job
-- card or invoice failed with "invalid input syntax for type integer: 3.5".
-- Widens all quantity columns to numeric(12,2) app-wide so stock, job cards,
-- invoices, estimates and purchases can all hold fractional quantities
-- consistently (idempotent — safe to run more than once). Run in the SQL editor.
-- ============================================================================

alter table public.spare_parts
  alter column opening_qty type numeric(12,2) using opening_qty::numeric,
  alter column current_qty type numeric(12,2) using current_qty::numeric,
  alter column min_qty type numeric(12,2) using min_qty::numeric;

alter table public.job_card_parts
  alter column qty type numeric(12,2) using qty::numeric;

alter table public.estimate_items
  alter column qty type numeric(12,2) using qty::numeric;

alter table public.invoice_items
  alter column qty type numeric(12,2) using qty::numeric;

alter table public.purchase_items
  alter column qty type numeric(12,2) using qty::numeric;

alter table public.stock_movements
  alter column qty type numeric(12,2) using qty::numeric,
  alter column prev_qty type numeric(12,2) using prev_qty::numeric,
  alter column new_qty type numeric(12,2) using new_qty::numeric;
