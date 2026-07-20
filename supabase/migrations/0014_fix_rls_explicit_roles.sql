-- ============================================================
-- E-Tamu — Diagnostik & Reset RLS policies (eksplisit untuk anon + authenticated)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Lihat policy yang ada saat ini
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('visitors', 'visits')
order by tablename, cmd, policyname;

-- 2. Hapus semua policy lama
drop policy if exists "visitors_insert_public" on public.visitors;
drop policy if exists "visitors_read_staff" on public.visitors;
drop policy if exists "visitors_update_staff" on public.visitors;
drop policy if exists "visitors_delete_staff" on public.visitors;
drop policy if exists "visits_insert_public" on public.visits;
drop policy if exists "visits_read_staff" on public.visits;
drop policy if exists "visits_update_staff" on public.visits;
drop policy if exists "visits_delete_staff" on public.visits;

-- 3. Buat ulang policy dengan role eksplisit (anon + authenticated)
create policy "visitors_insert_public"
  on public.visitors for insert
  to anon, authenticated
  with check (true);

create policy "visitors_read_staff"
  on public.visitors for select
  to authenticated
  using (public.is_admin());

create policy "visitors_update_staff"
  on public.visitors for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "visitors_delete_staff"
  on public.visitors for delete
  to authenticated
  using (public.is_admin());

create policy "visits_insert_public"
  on public.visits for insert
  to anon, authenticated
  with check (true);

create policy "visits_read_staff"
  on public.visits for select
  to authenticated
  using (public.is_admin());

create policy "visits_update_staff"
  on public.visits for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "visits_delete_staff"
  on public.visits for delete
  to authenticated
  using (public.is_admin());

-- 4. Verifikasi policy yang baru
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('visitors', 'visits')
order by tablename, cmd, policyname;
