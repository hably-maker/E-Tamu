-- ============================================================
-- E-Tamu — Migrasi 0021: tambahan kolom favicon_url
-- Memungkinkan admin mengunggah icon browser tab dari panel
-- pengaturan (site-assets bucket).
-- ============================================================

alter table public.site_settings
  add column if not exists favicon_url text;

-- ============================================================
-- Refresh schema cache PostgREST agar kolom baru dikenali oleh API
-- (diperlukan setelah DDL via SQL Editor, bukan Table Editor GUI)
-- ============================================================
notify pgrst, 'reload schema';
