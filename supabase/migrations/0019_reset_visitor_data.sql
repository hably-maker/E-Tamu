-- ============================================================
-- E-Tamu — Reset data pengunjung dan kunjungan (dummy data)
-- Hanya menghapus data di tabel visits dan visitors.
-- Data pegawai/admin/pengaturan tidak ikut terhapus.
-- ============================================================

BEGIN;

-- Hapus data kunjungan terlebih dahulu karena ada foreign key ke visitors
delete from public.visits;

-- Hapus data pengunjung
delete from public.visitors;

COMMIT;
