-- ============================================================
-- E-Tamu — Pastikan policy DELETE untuk visits & visitors ada
-- ============================================================

-- visits: hapus hanya admin
drop policy if exists "visits_delete_staff" on public.visits;
create policy "visits_delete_staff"
  on public.visits for delete
  using (public.is_admin());

-- visitors: hapus hanya admin
drop policy if exists "visitors_delete_staff" on public.visitors;
create policy "visitors_delete_staff"
  on public.visitors for delete
  using (public.is_admin());
