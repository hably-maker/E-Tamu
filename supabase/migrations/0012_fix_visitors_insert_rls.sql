-- ============================================================
-- E-Tamu — Pastikan policy INSERT publik untuk visitors & visits tetap ada
-- ============================================================

drop policy if exists "visitors_insert_public" on public.visitors;
create policy "visitors_insert_public"
  on public.visitors for insert
  with check (true);

drop policy if exists "visits_insert_public" on public.visits;
create policy "visits_insert_public"
  on public.visits for insert
  with check (true);
