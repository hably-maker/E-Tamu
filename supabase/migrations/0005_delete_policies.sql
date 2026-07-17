-- ============================================================
-- E-Tamu — Tambahkan policy DELETE untuk visits & visitors
-- ============================================================

-- visits: hapus hanya admin/staff
drop policy if exists "visits_delete_staff" on public.visits;
create policy "visits_delete_staff"
  on public.visits for delete
  using (public.is_admin());

-- visitors: update & hapus hanya admin/staff (agar data tamu bisa diedit/dihapus)
drop policy if exists "visitors_update_staff" on public.visitors;
create policy "visitors_update_staff"
  on public.visitors for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "visitors_delete_staff" on public.visitors;
create policy "visitors_delete_staff"
  on public.visitors for delete
  using (public.is_admin());
