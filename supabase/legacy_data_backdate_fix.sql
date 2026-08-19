-- ============================================================================
-- Backdate legacy-imported records so real/new data sorts above them.
--
-- Run this ONCE if you already executed supabase/legacy_customers_import.sql
-- before it was updated to backdate created_at/received_at (i.e. the imported
-- rows currently show today's date and appear above genuinely new records).
--
-- Safe to run even if some/all legacy rows were already backdated correctly —
-- it just reassigns the same synthetic 2020-01-01+N-seconds timestamps.
--
-- Identifies legacy rows via the JC-OLD-#### / INV-OLD-#### numbering used by
-- scripts/excel-to-sql.js, then cascades the backdating to their linked
-- vehicles and customers.
-- ============================================================================
begin;

with numbered as (
  select id, row_number() over (order by jobcard_no) as rn
  from job_cards
  where jobcard_no like 'JC-OLD-%'
)
update job_cards j
set received_at = timestamptz '2020-01-01 00:00:00+00' + (numbered.rn || ' seconds')::interval,
    created_at  = timestamptz '2020-01-01 00:00:00+00' + (numbered.rn || ' seconds')::interval,
    updated_at  = timestamptz '2020-01-01 00:00:00+00' + (numbered.rn || ' seconds')::interval
from numbered
where j.id = numbered.id;

with numbered as (
  select id, row_number() over (order by invoice_no) as rn
  from invoices
  where invoice_no like 'INV-OLD-%'
)
update invoices i
set created_at = timestamptz '2020-01-01 00:00:00+00' + (numbered.rn || ' seconds')::interval,
    updated_at = timestamptz '2020-01-01 00:00:00+00' + (numbered.rn || ' seconds')::interval
from numbered
where i.id = numbered.id;

update vehicles v
set created_at = j.received_at,
    updated_at = j.received_at
from job_cards j
where j.vehicle_id = v.id
  and j.jobcard_no like 'JC-OLD-%';

update customers c
set created_at = t.min_ts,
    updated_at = t.min_ts
from (
  select j.customer_id, min(j.received_at) as min_ts
  from job_cards j
  where j.jobcard_no like 'JC-OLD-%'
  group by j.customer_id
) t
where c.id = t.customer_id;

commit;
