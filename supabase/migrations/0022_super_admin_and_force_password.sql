-- ============================================================
-- E-Tamu — Super admin & force change password
-- ============================================================

-- Tambah kolom is_super_admin & must_change_password di profiles
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists must_change_password boolean not null default false;

-- Set admin pertama yang ada sebagai super admin (jika belum ada super admin)
update public.profiles
set is_super_admin = true
where id = (
  select id from public.profiles
  where role = 'admin'
  order by created_at asc
  limit 1
);

-- Trigger: set must_change_password = true untuk user baru
-- yang dibuat lewat admin.createUser (role = 'admin' / 'staff')
create or replace function public.set_must_change_password()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role in ('admin', 'staff') and new.must_change_password is not true then
    new.must_change_password := true;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_must_change_password on public.profiles;
create trigger profiles_must_change_password
  before insert on public.profiles
  for each row execute function public.set_must_change_password();

-- Helper: cek apakah user adalah super admin
create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_super_admin = true
  );
$$;
