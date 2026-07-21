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
