-- ============================================================
-- E-Tamu — Migrasi 0011: kolom sort_order di employees
-- Mengatur urutan/hirarki pegawai secara manual (semakin kecil
-- angkanya, semakin atas posisinya di daftar & rekomendasi).
-- ============================================================

alter table public.employees add column if not exists sort_order int default 0;

-- Isi awal berurutan berdasarkan nama agar data lama sudah terurut
with ranked as (
  select id, row_number() over (order by full_name) as rn
  from public.employees
  where sort_order is null or sort_order = 0
)
update public.employees e
set sort_order = ranked.rn
from ranked
where e.id = ranked.id;
