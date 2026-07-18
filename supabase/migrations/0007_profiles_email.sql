-- ============================================================
-- E-Tamu — Tambahkan kolom email ke profiles + sinkronisasi
-- ============================================================

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  )
  on conflict (id) do
    update set email = coalesce(public.profiles.email, new.email);
  return new;
end;
$$;

-- Isi email yang mungkin belum tersinkron
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null and u.email is not null;
