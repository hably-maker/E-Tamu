-- ============================================================
-- E-Tamu — Migrasi 0009: kolom destination_text di visits
-- Menyimpan nama tujuan bebas ("Lainnya") saat pengunjung
-- mengetik manual nama yang tidak ada di daftar pegawai.
-- ============================================================

alter table public.visits add column if not exists destination_text text;
