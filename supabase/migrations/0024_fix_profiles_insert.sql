-- ============================================================
-- E-Tamu — Fix: pastikan profile dibuat untuk user yang dibuat via RPC
-- Migration ini hanya untuk user yang sudah ada tapi belum punya profile
-- atau punya profile dengan role salah.
-- ============================================================

-- Tambahkan INSERT policy untuk profiles (untuk SECURITY DEFINER functions)
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_super_admin());

-- Backfill: pastikan semua user di auth.users punya profile dengan role yang sesuai
-- (berguna jika ada user yang dibuat tapi profile-nya missing)
insert into public.profiles (id, full_name, email, role, must_change_password)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.email,
  coalesce(u.raw_user_meta_data->>'role', 'staff')::text as role,
  true as must_change_password
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name;
