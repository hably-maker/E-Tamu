-- ============================================================
-- E-Tamu — Migrasi 0002: sesuaikan skema dengan formulir
-- registrasi pengunjung (design/formulir_registrasi_pengunjung)
-- ============================================================

-- Tambah kolom catatan/keterangan pada log kunjungan
alter table public.visits
  add column if not exists remarks text;

-- Kolom purpose menerima teks bebas (termasuk opsi "Lainnya"),
-- sehingga constraint enum dilepas agar tidak menolak input kustom.
alter table public.visits
  drop constraint if exists visits_purpose_check;

-- (opsional) indeks pencarian catatan
create index if not exists visits_remarks_idx
  on public.visits using gin (to_tsvector('indonesian', coalesce(remarks, '')));
