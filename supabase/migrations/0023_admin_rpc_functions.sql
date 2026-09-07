-- ============================================================
-- E-Tamu — RPC untuk operasi admin user (bypass RLS via service role)
-- Dipanggil dari frontend via supabase.rpc(...)
-- ============================================================

-- pgcrypto untuk crypt() / gen_salt()
create extension if not exists pgcrypto with schema extensions;

-- Helper: bikin encrypted password bcrypt yang kompatibel dengan Supabase Auth.
-- (Supabase GoAuth memvalidasi bcrypt hash; cost 10 sesuai default GoAuth.)
-- Pakai schema-qualified extensions.crypt & extensions.gen_salt.
create or replace function public._hash_password(p_password text)
returns text
language sql
immutable
as $$
  select extensions.crypt(p_password, extensions.gen_salt('bf', 10));
$$;

-- ------------------------------------------------------------
-- 1. Buat admin baru (insert ke auth.users + auth.identities + profiles)
-- ------------------------------------------------------------
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text default 'staff'
)
returns json
language plpgsql
security definer set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_caller_id uuid := auth.uid();
  v_is_super boolean;
  v_existing uuid;
begin
  -- Hanya super admin yang boleh membuat user baru
  select is_super_admin into v_is_super
  from public.profiles where id = v_caller_id;
  if not v_is_super then
    raise exception 'Hanya super admin yang dapat membuat admin baru.';
  end if;

  if length(p_password) < 6 then
    raise exception 'Kata sandi minimal 6 karakter.';
  end if;

  -- Cek apakah email sudah terdaftar
  select id into v_existing from auth.users where email = p_email;
  if v_existing is not null then
    raise exception 'Email sudah terdaftar.';
  end if;

  v_user_id := gen_random_uuid();

  -- Buat user di auth.users
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    public._hash_password(p_password),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Pastikan profile ada dengan role yang benar.
  -- Pakai UPDATE (lebih aman dari INSERT+conflict), insert jika belum ada.
  insert into public.profiles (id, full_name, email, role, must_change_password)
  values (v_user_id, p_full_name, p_email, p_role, true)
  on conflict (id) do nothing;

  update public.profiles
  set full_name = p_full_name,
      email = p_email,
      role = p_role,
      must_change_password = true
  where id = v_user_id;


  -- Identity untuk email/password login
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
    'email',
    v_user_id::text,
    now(),
    now()
  );

  return json_build_object(
    'id', v_user_id,
    'email', p_email,
    'full_name', p_full_name,
    'role', p_role
  );
end;
$$;

revoke all on function public.admin_create_user(text, text, text, text) from public;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 2. Reset password user (khusus super admin)
-- ------------------------------------------------------------
create or replace function public.admin_reset_password(
  p_user_id uuid,
  p_new_password text
)
returns void
language plpgsql
security definer set search_path = public, auth
as $$
declare
  v_caller_id uuid := auth.uid();
  v_is_super boolean;
begin
  select is_super_admin into v_is_super
  from public.profiles where id = v_caller_id;
  if not v_is_super then
    raise exception 'Hanya super admin yang dapat mereset kata sandi.';
  end if;

  if length(p_new_password) < 6 then
    raise exception 'Kata sandi minimal 6 karakter.';
  end if;

  update auth.users
  set encrypted_password = public._hash_password(p_new_password),
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'User tidak ditemukan.';
  end if;

  update public.profiles
  set must_change_password = true
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_reset_password(uuid, text) from public;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 3. Update role user (khusus super admin)
-- ------------------------------------------------------------
create or replace function public.admin_update_role(
  p_user_id uuid,
  p_new_role text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_is_super boolean;
  v_target_is_super boolean;
begin
  select is_super_admin into v_is_super
  from public.profiles where id = v_caller_id;
  if not v_is_super then
    raise exception 'Hanya super admin yang dapat mengubah peran.';
  end if;

  -- Tidak boleh mengubah peran super admin
  select is_super_admin into v_target_is_super
  from public.profiles where id = p_user_id;
  if v_target_is_super then
    raise exception 'Tidak dapat mengubah peran super admin.';
  end if;

  if p_new_role not in ('admin', 'staff') then
    raise exception 'Role tidak valid.';
  end if;

  update public.profiles
  set role = p_new_role
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_update_role(uuid, text) from public;
grant execute on function public.admin_update_role(uuid, text) to authenticated;
