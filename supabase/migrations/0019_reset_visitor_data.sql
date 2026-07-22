-- ============================================================
-- E-Tamu — Reset data dummy (visits, visitors, activity_logs)
-- Hanya menghapus data dummy tanpa merusak struktur tabel.
-- ============================================================

BEGIN;

-- Hapus data kunjungan
delete from public.visits;

-- Hapus data pengunjung
delete from public.visitors;

-- Hapus log aktivitas
delete from public.activity_logs;

COMMIT;
