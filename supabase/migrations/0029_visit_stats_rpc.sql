-- ============================================================
-- E-Tamu — Migration 0029: RPC agregasi kunjungan per hari
-- Menggantikan 19 query COUNT terpisah (harian/mingguan/bulanan) di
-- dashboard dengan 1 request. Data dikembalikan per tanggal (dalam
-- zona waktu lokal browser, lewat offset menit dari klien) supaya
-- pengelompokan harian/mingguan/bulanan dilakukan di sisi klien.
-- Jalankan di Supabase SQL Editor (aman diulang).
-- ============================================================

create or replace function public.visit_stats(p_tz_offset_minutes int default 0)
returns table (
  day date,
  visits_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ((v.check_in_at at time zone 'utc')
      + make_interval(mins => p_tz_offset_minutes))::date as day,
    count(*)::bigint
  from public.visits v
  where public.is_admin()
    and v.check_in_at >= now() - interval '200 days'
  group by 1
  order by 1;
$$;

revoke all on function public.visit_stats(int) from public;
grant execute on function public.visit_stats(int) to authenticated;
