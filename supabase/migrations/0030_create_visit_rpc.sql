-- ============================================================
-- E-Tamu — Migration 0030: registrasi pengunjung jadi 1 RPC atomik
-- Masalah:
--   1. insert visitors (RPC register_visitor) dan insert visits dilakukan
--      terpisah dari klien -> jika langkah kedua gagal, data visitor yatim.
--   2. policy "visitors_insert_public" dan "visits_insert_public" memakai
--      with check (true) tanpa role, sehingga siapa pun (anon) bisa
--      menyisipkan baris visits dengan visitor_id/employee_id bebas.
-- Solusi: hapus policy insert publik,_register lewat RPC create_visit.
-- Jalankan di Supabase SQL Editor (aman diulang).
-- ============================================================

-- 1. Cabut hak eksekusi RPC lama
revoke all on function public.register_visitor(text, text) from public;

-- 2. Hapus policy insert yang terlalu longgar
drop policy if exists "visitors_insert_public" on public.visitors;
drop policy if exists "visits_insert_public"   on public.visits;

-- 3. RPC create_visit: 1 transaksi, validasi, kembalikan id kunjungan
create or replace function public.create_visit(
  p_full_name text,
  p_phone text default null,
  p_employee_id uuid default null,
  p_destination_text text default null,
  p_purpose text default null,
  p_remarks text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name   text := nullif(trim(coalesce(p_full_name, '')), '');
  v_phone  text := nullif(trim(coalesce(p_phone, '')), '');
  v_dest   text := nullif(trim(coalesce(p_destination_text, '')), '');
  v_purpose text := nullif(trim(coalesce(p_purpose, '')), '');
  v_notes  text := nullif(trim(coalesce(p_remarks, '')), '');
  v_visitor uuid;
  v_visit   uuid;
begin
  -- Validasi dasar (pencegahan spam/kosong)
  if v_name is null or length(v_name) < 2 then
    raise exception 'Nama lengkap wajib diisi (minimal 2 karakter).';
  end if;
  if length(v_name) > 120 then
    raise exception 'Nama lengkap maksimal 120 karakter.';
  end if;
  if v_phone is not null and length(v_phone) > 30 then
    raise exception 'Nomor telepon maksimal 30 karakter.';
  end if;
  if v_purpose is null then
    raise exception 'Keperluan kunjungan wajib diisi.';
  end if;
  if length(v_purpose) > 60 then
    raise exception 'Keperluan maksimal 60 karakter.';
  end if;
  if v_dest is not null and length(v_dest) > 120 then
    raise exception 'Tujuan manual maksimal 120 karakter.';
  end if;
  if v_notes is not null and length(v_notes) > 500 then
    raise exception 'Keterangan maksimal 500 karakter.';
  end if;

  insert into public.visitors (full_name, phone)
  values (v_name, v_phone)
  returning id into v_visitor;

  insert into public.visits (visitor_id, employee_id, destination_text, purpose, remarks)
  values (v_visitor, p_employee_id, v_dest, v_purpose, v_notes)
  returning id into v_visit;

  return v_visit;
end;
$$;

revoke all on function public.create_visit(text, text, uuid, text, text, text) from public;
grant execute on function public.create_visit(text, text, uuid, text, text, text)
  to anon, authenticated;

-- 4. Verifikasi: tidak boleh ada policy insert publik lagi
select policyname, roles, cmd, with_check
from pg_policies
where tablename in ('visitors', 'visits')
  and cmd = 'insert'
order by tablename, policyname;
