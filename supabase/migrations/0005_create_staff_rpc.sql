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
