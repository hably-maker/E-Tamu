-- ============================================================
-- E-Tamu — Migrasi 0003: penyelarasan skema dengan form registrasi
-- Form registrasi pengunjung (/pengunjung) memetakan ke:
--   Nama Lengkap  -> visitors.full_name
--   No. Telepon   -> visitors.phone
--   Tujuan        -> visits.employee_id  (pegawai / tuan rumah)
--   Keperluan     -> visits.purpose
--   Catatan       -> visits.remarks
-- Kolom di bawah memastikan semuanya ada (idempoten, aman dijalankan ulang).
-- ============================================================

-- visitors.phone (sudah ada di 0001, dipastikan ada)
alter table public.visitors
  add column if not exists phone text;

-- visits.remarks (sudah ada di 0002, dipastikan ada)
alter table public.visits
  add column if not exists remarks text;

-- Index pencarian nomor telepon pengunjung
create index if not exists visitors_phone_idx
  on public.visitors (phone);
