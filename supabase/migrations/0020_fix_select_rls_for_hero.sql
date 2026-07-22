-- ============================================================
-- E-Tamu — Izinkan SELECT publik untuk hitung pengunjung
-- Diperlukan agar hero section bisa menampilkan jumlah
-- pengunjung hari ini tanpa login.
-- ============================================================

drop policy if exists "visits_select_public" on public.visits;
create policy "visits_select_public"
  on public.visits for select
  to anon
  using (true);

drop policy if exists "visitors_select_public" on public.visitors;
create policy "visitors_select_public"
  on public.visitors for select
  to anon
  using (true);
