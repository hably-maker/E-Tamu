-- ============================================================
-- E-Tamu — Aktifkan Realtime untuk tabel visits & visitors
-- ============================================================

alter publication supabase_realtime add table public.visits;
alter publication supabase_realtime add table public.visitors;
