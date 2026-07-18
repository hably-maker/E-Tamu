-- ============================================================
-- E-Tamu — Migrasi 0010: kolom rank (pangkat) di employees
-- Menambahkan pangkat sebelum jabatan, mis. "Kapten", "Mayor".
-- ============================================================

alter table public.employees add column if not exists rank text;
