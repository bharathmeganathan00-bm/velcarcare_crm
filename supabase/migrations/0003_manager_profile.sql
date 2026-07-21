-- ============================================================================
-- VELCARCARE CRM — Link the Manager profile
--
-- PREREQUISITE: the Manager auth user must already exist.
--   Supabase Dashboard → Authentication → Users → "Add user"
--   Email: velcarcarekpm@gmail.com   (set a password, tick "Auto Confirm User")
--
-- This script then finds that user's UID by email automatically — no UID to
-- paste. `profiles.id` is a foreign key to auth.users(id), so the auth user
-- MUST exist first (that was the cause of the profiles_id_fkey error).
-- ============================================================================

insert into profiles (id, staff_id, name, username, email, mobile, role, status, permissions)
select
  u.id,
  'VCC-MGR-001',
  'Manager',
  'manager',
  u.email,
  '9787549179',
  'manager',
  'active',
  '{}'::jsonb          -- managers bypass permission checks via is_manager()
from auth.users u
where u.email = 'velcarcarekpm@gmail.com'   -- <-- change if you used a different email
on conflict (id) do update
  set role = 'manager',
      status = 'active',
      staff_id = excluded.staff_id;

-- Safety check: if this returns 0 rows, the Manager auth user does not exist yet.
-- Create it in Authentication → Users, then re-run this file.
do $$
begin
  if not exists (select 1 from profiles where role = 'manager') then
    raise notice 'No manager profile created — did you add the auth user velcarcarekpm@gmail.com first?';
  end if;
end $$;
