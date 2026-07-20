-- ============================================================
-- E-Tamu — Function untuk registrasi visitor (bypass RLS SELECT)
-- ============================================================

create or replace function public.register_visitor(p_full_name text, p_phone text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.visitors (full_name, phone)
  values (p_full_name, p_phone)
  returning id into v_id;
  return v_id;
end;
$$;
