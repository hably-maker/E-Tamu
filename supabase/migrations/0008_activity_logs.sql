-- ============================================================
-- E-Tamu — Migrasi 0008: log aktivitas admin
-- Mencatat siapa yang mengedit/menghapus data kunjungan.
-- ============================================================

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  admin_name  text,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  target_name text,
  detail      text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs(created_at desc);

alter table public.activity_logs enable row level security;

create policy "activity_logs_read_admin"
  on public.activity_logs for select
  using (public.is_admin());

create policy "activity_logs_write_admin"
  on public.activity_logs for insert
  with check (public.is_admin());
