-- ============================================================
-- E-Tamu — Diagnostik lengkap untuk tabel visitors & visits
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. SEMUA policies (tanpa filter cmd)
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('visitors', 'visits')
order by tablename, policyname;

-- 2. Cek apakah ada trigger di visitors
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_table = 'visitors';

-- 3. Cek apakah ada trigger di visits
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_table = 'visits';

-- 4. Cek functions yang mungkin terkait
select
  routine_name,
  routine_type,
  routine_definition
from information_schema.routines
where routine_schema = 'public'
  and (routine_name like '%visitor%' or routine_name like '%visit%')
order by routine_name;

-- 5. Cek kolom yang ada di visitors (pastikan phone ada)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'visitors'
order by ordinal_position;

-- 6. Cek kolom yang ada di visits
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'visits'
order by ordinal_position;
