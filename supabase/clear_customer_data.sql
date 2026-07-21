-- ============================================================================
-- VELCARCARE CRM — Clear all CUSTOMER data (test cleanup)
--
-- Run in the Supabase SQL editor. This deletes every customer and everything
-- that hangs off a customer:
--   customers, vehicles, job cards (+ services/parts/status history),
--   inspections (+ items), estimates (+ items), invoices (+ items),
--   payments, bookings, reminders.
--
-- KEEPS: company settings, car brands/models/variants, service catalogue,
--        spare parts, staff & manager logins.
--
-- TRUNCATE ... CASCADE follows the foreign keys automatically, so one line
-- clears the whole customer graph. This CANNOT be undone — make sure you want
-- a clean slate before running it.
-- ============================================================================

truncate table customers restart identity cascade;

-- Optional: also clear the spare-part stock movements created by those invoices
-- (the stock quantities themselves are NOT changed — reset them in Services →
-- Spare Parts if needed). Uncomment to remove sale/usage movement history:
-- delete from stock_movements where ref_type in ('invoice', 'jobcard');
