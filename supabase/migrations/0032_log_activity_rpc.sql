-- ============================================================
-- E-Tamu — Migration 0032: RPC log_activity
-- Masalah: logActivity dari frontend pakai anon key, tapi policy
--          activity_logs.insert butuh is_admin() -> gagal (401/42501).
-- Solusi: RPC SECURITY DEFINER yang insert ke activity_logs.
-- Jalankan di Supabase SQL Editor (aman diulang).
-- ============================================================

create or replace function public.log_activity(
  p_admin_id uuid default null,
  p_admin_name text default 'Admin',
  p_action text,
  p_target_type text,
  p_target_id uuid default null,
  p_target_name text default null,
  p_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_logs (
    admin_id,
    admin_name,
    action,
    target_type,
    target_id,
    target_name,
    detail
  ) values (
    p_admin_id,
    p_admin_name,
    p_action,
    p_target_type,
    p_target_id,
    p_target_name,
    p_detail
  );
end;
$$;

revoke all on function public.log_activity(uuid, text, text, text, uuid, text, text) from public;
grant execute on function public.log_activity(uuid, text, text, text, uuid, text, text)
  to authenticated;

-- Verifikasi
select proname, prosecdef, proacl
from pg_proc
where proname = 'log_activity';