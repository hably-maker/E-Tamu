-- ============================================================
-- E-Tamu — Migration 0028: kunci policy Storage bucket "site-assets"
-- Masalah: policy di 0004_site_settings.sql (write/delete) tidak punya
-- restriction role maupun cek admin, sehingga role "public" (anon)
-- bisa meng-upload dan menghapus file logo/background/favicon.
-- Jalankan ulang script ini di Supabase SQL Editor (aman diulang).
-- ============================================================

-- Pastikan bucket ada & public (hanya read yang boleh publik)
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

-- Hapus policy lama yang terlalu longgar
drop policy if exists "site_assets_read_public" on storage.objects;
drop policy if exists "site_assets_write_admin" on storage.objects;
drop policy if exists "site_assets_delete_admin" on storage.objects;
drop policy if exists "site_assets_insert_admin" on storage.objects;
drop policy if exists "site_assets_update_admin" on storage.objects;

-- Baca: publik (logo, background, favicon ditampilkan di halaman publik)
create policy "site_assets_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'site-assets');

-- Tulis/Hapus: hanya admin yang sudah login
create policy "site_assets_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_admin());

create policy "site_assets_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

create policy "site_assets_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin());

-- Verifikasi
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'site_assets%'
order by cmd, policyname;
