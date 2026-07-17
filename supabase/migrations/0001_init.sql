-- ============================================================
-- E-Tamu — Skema database untuk beranda publik & admin internal
-- Jalankan di Supabase SQL Editor (Dashboard > SQL > New query)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabel: departments (divisi/bagian di kantor)
-- ------------------------------------------------------------
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Tabel: employees (pegawai / tuan rumah yang dikunjungi)
-- ------------------------------------------------------------
create table if not exists public.employees (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  department_id uuid references public.departments(id) on delete set null,
  position     text,
  email        text,
  phone        text,
  created_at   timestamptz not null default now()
);

create index if not exists employees_department_id_idx
  on public.employees(department_id);

-- ------------------------------------------------------------
-- 3. Tabel: visitors (data tamu / pengunjung)
-- ------------------------------------------------------------
create table if not exists public.visitors (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  id_number       text,                       -- KTP / identitas
  phone           text,
  organization    text,                       -- instansi/perusahaan tamu
  purpose         text,                       -- keperluan kunjungan
  employee_id     uuid references public.employees(id) on delete set null,
  department_id   uuid references public.departments(id) on delete set null,
  photo_url       text,                       -- foto tamu (Storage)
  signature_url   text,                       -- tanda tangan (Storage)
  created_at      timestamptz not null default now()
);

create index if not exists visitors_employee_id_idx
  on public.visitors(employee_id);
create index if not exists visitors_created_at_idx
  on public.visitors(created_at desc);

-- ------------------------------------------------------------
-- 4. Tabel: visits (log kunjungan: check-in / check-out)
-- ------------------------------------------------------------
create table if not exists public.visits (
  id            uuid primary key default gen_random_uuid(),
  visitor_id    uuid not null references public.visitors(id) on delete cascade,
  employee_id   uuid references public.employees(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  purpose       text,
  status        text not null default 'active'
                check (status in ('active', 'completed', 'cancelled')),
  qr_code       text,                          -- token pra-registrasi QR
  check_in_at   timestamptz not null default now(),
  check_out_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists visits_status_idx on public.visits(status);
create index if not exists visits_check_in_at_idx
  on public.visits(check_in_at desc);

-- ============================================================
-- ADMIN AUTHENTICATION
-- Admin menggunakan fitur Auth bawaan Supabase (email/password).
-- Tabel profiles menyimpan peran admin.
-- ============================================================

-- ------------------------------------------------------------
-- 5. Tabel: profiles (profil pengguna/admin)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'staff'
             check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trigger: buat profile otomatis saat user auth dibuat
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET untuk foto tamu & tanda tangan
-- ============================================================
insert into storage.buckets (id, name, public)
values ('visitor-assets', 'visitor-assets', true)
on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.departments enable row level security;
alter table public.employees   enable row level security;
alter table public.visitors    enable row level security;
alter table public.visits      enable row level security;
alter table public.profiles    enable row level security;

-- Helper: cek apakah user adalah admin
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- departments: bisa dibaca publik (untuk dropdown form), tulis hanya admin
create policy "departments_read_public"
  on public.departments for select using (true);
create policy "departments_write_admin"
  on public.departments for all
  using (public.is_admin()) with check (public.is_admin());

-- employees: baca publik (dropdown tuan rumah), tulis hanya admin
create policy "employees_read_public"
  on public.employees for select using (true);
create policy "employees_write_admin"
  on public.employees for all
  using (public.is_admin()) with check (public.is_admin());

-- visitors: insert publik (pendaftaran tamu), baca hanya admin/staff
create policy "visitors_insert_public"
  on public.visitors for insert with check (true);
create policy "visitors_read_staff"
  on public.visitors for select using (public.is_admin());

-- visits: insert publik (check-in), update/select hanya admin/staff
create policy "visits_insert_public"
  on public.visits for insert with check (true);
create policy "visits_read_staff"
  on public.visits for select using (public.is_admin());
create policy "visits_update_staff"
  on public.visits for update using (public.is_admin()) with check (public.is_admin());

-- profiles: user hanya boleh akses profil sendiri, admin akses semua
create policy "profiles_read_self_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles_update_self_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Storage policy: upload publik (foto saat check-in), baca publik
create policy "visitor_assets_read_public"
  on storage.objects for select
  using (bucket_id = 'visitor-assets');
create policy "visitor_assets_insert_public"
  on storage.objects for insert
  with check (bucket_id = 'visitor-assets');
