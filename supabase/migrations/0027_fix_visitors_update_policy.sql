-- ============================================================
-- E-Tamu — Migration 0027: pastikan policy UPDATE visitors/visits ada
-- Masalah: policy "visitors_update_staff" sering tidak ada di database
-- (hanya insert & select yang dibuat di 0001), sehingga admin tidak
-- bisa menyimpan perubahan data pengunjung dari Dasbor.
-- Jalankan ulang script ini di Supabase SQL Editor (aman diulang).
-- ============================================================

-- 0. Pastikan RLS aktif
alter table public.visitors enable row level security;
alter table public.visits   enable row level security;

-- 1. Hapus policy lama (kalau ada) agar tidak bentrok
drop policy if exists "visitors_insert_public" on public.visitors;
drop policy if exists "visitors_read_staff"    on public.visitors;
drop policy if exists "visitors_update_staff"  on public.visitors;
drop policy if exists "visitors_delete_staff"  on public.visitors;
drop policy if exists "visits_insert_public"   on public.visits;
drop policy if exists "visits_read_staff"      on public.visits;
drop policy if exists "visits_update_staff"    on public.visits;
drop policy if exists "visits_delete_staff"    on public.visits;

-- 2. visitors: insert publik,(select/update/delete) admin
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

-- 3. visits: insert publik, (select/update/delete) admin
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

-- 4. Verifikasi: visits_update_staff & visitors_update_staff harus muncul
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('visitors', 'visits')
  and cmd in ('update', 'select')
order by tablename, cmd, policyname;
