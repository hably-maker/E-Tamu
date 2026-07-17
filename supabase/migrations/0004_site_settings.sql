-- ============================================================
-- E-Tamu — Migrasi 0004: pengaturan tampilan situs
-- Menyimpan konfigurasi yang bisa diubah dari dashboard admin:
--   hero_bg_url     -> foto background beranda (/)
--   form_bg_url     -> foto background page registrasi (/pengunjung)
--   logo_url        -> logo E-Tamu (navbar & sidebar)
--   ticker_items    -> (opsional) teks pengumuman dashboard TV
-- ============================================================

create table if not exists public.site_settings (
  id          int primary key default 1,
  hero_bg_url text,
  form_bg_url text,
  logo_url    text,
  ticker_items text[],
  updated_at  timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Pastikan selalu ada 1 baris
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "site_settings_read_public"
  on public.site_settings for select using (true);

create policy "site_settings_write_admin"
  on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Storage bucket untuk aset situs (logo, background)
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "site_assets_read_public"
  on storage.objects for select
  using (bucket_id = 'site-assets');

create policy "site_assets_write_admin"
  on storage.objects for insert
  with check (bucket_id = 'site-assets');

create policy "site_assets_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'site-assets');
