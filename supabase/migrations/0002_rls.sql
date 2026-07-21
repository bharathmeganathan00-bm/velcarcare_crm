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
