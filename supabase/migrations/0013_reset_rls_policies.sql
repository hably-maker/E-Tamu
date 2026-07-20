-- ============================================================
-- E-Tamu — Reset RLS policies untuk visitors & visits
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Hapus SEMUA policy lama di visitors
drop policy if exists "visitors_insert_public" on public.visitors;
drop policy if exists "visitors_read_staff" on public.visitors;
drop policy if exists "visitors_update_staff" on public.visitors;
drop policy if exists "visitors_delete_staff" on public.visitors;

-- Buat ulang policy visitors
create policy "visitors_insert_public"
  on public.visitors for insert
  with check (true);

create policy "visitors_read_staff"
  on public.visitors for select
  using (public.is_admin());

create policy "visitors_update_staff"
  on public.visitors for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "visitors_delete_staff"
  on public.visitors for delete
  using (public.is_admin());

-- Hapus SEMUA policy lama di visits
drop policy if exists "visits_insert_public" on public.visits;
drop policy if exists "visits_read_staff" on public.visits;
drop policy if exists "visits_update_staff" on public.visits;
drop policy if exists "visits_delete_staff" on public.visits;

-- Buat ulang policy visits
create policy "visits_insert_public"
  on public.visits for insert
  with check (true);

create policy "visits_read_staff"
  on public.visits for select
  using (public.is_admin());

create policy "visits_update_staff"
  on public.visits for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "visits_delete_staff"
  on public.visits for delete
  using (public.is_admin());
