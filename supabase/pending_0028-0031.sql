-- ============================================================
-- E-Tamu — Paket migrasi tertunda (gabungan 0028 s/d 0031)
-- Jalankan SELURUH file ini sekali di Supabase > SQL Editor > New query > Run.
-- Urutan: 0028 (kunci storage) -> 0029 (RPC grafik) -> 0030 (registrasi atomik) -> 0031 (tabel dasbor server-side)
-- Semua bagian idempotent: aman dijalankan berulang kali.
-- Setelah selesai, tunggu ~10 detik agar PostgREST memuat ulang schema cache.
-- ============================================================

-- ------------------------------------------------------------
-- BEGIN 0028_lock_site_assets_storage.sql
-- ------------------------------------------------------------
-- ============================================================
-- E-Tamu â€” Migration 0028: kunci policy Storage bucket "site-assets"
-- Masalah: policy di 0004_site_settings.sql (write/delete) tidak punya
-- restriction role maupun cek admin, sehingga role "public" (anon)
-- bisa meng-upload dan menghapus file logo/background/favicon.
-- Jalankan ulang script ini di Supabase SQL Editor (aman diulang).
-- ============================================================

-- Pastikan bucket ada & public (hanya read yang boleh publik)
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

-- Hapus policy lama yang terlalu longgar
drop policy if exists "site_assets_read_public" on storage.objects;
drop policy if exists "site_assets_write_admin" on storage.objects;
drop policy if exists "site_assets_delete_admin" on storage.objects;
drop policy if exists "site_assets_insert_admin" on storage.objects;
drop policy if exists "site_assets_update_admin" on storage.objects;

-- Baca: publik (logo, background, favicon ditampilkan di halaman publik)
create policy "site_assets_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'site-assets');

-- Tulis/Hapus: hanya admin yang sudah login
create policy "site_assets_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_admin());

create policy "site_assets_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

create policy "site_assets_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin());

-- Verifikasi
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'site_assets%'
order by cmd, policyname;


-- ------------------------------------------------------------
-- BEGIN 0029_visit_stats_rpc.sql
-- ------------------------------------------------------------
-- ============================================================
-- E-Tamu â€” Migration 0029: RPC agregasi kunjungan per hari
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


-- ------------------------------------------------------------
-- BEGIN 0030_create_visit_rpc.sql
-- ------------------------------------------------------------
-- ============================================================
-- E-Tamu â€” Migration 0030: registrasi pengunjung jadi 1 RPC atomik
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


-- ------------------------------------------------------------
-- BEGIN 0031_admin_visits_page_rpc.sql
-- ------------------------------------------------------------
-- ============================================================
-- E-Tamu â€” Migration 0031: filter, pencarian, paginasi & ringkasan
--            dihitung di server (1 request) untuk tabel dasbor.
-- Masalah: filter tujuan/tanggal, pencarian, dan kartu ringkasan
--          dihitung di klien dari 20 baris halaman aktif -> angka salah
--          saat total kunjungan > PAGE_SIZE, dan hasil pencarian di luar
--          halaman 1 tidak pernah tampil.
-- Solusi: RPC admin_visits_page mengembalikan {rows, total, today, week, month}
-- Jalankan di Supabase SQL Editor (aman diulang).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Index pendukung
-- ------------------------------------------------------------
-- Hanya index yang benar-benar bisa dipakai query di bawah.
-- Pencarian pada admin_visits_page menggabungkan kolom visitors + employees
-- dalam satu tsvector, sehingga index FTS per tabel tidak bisa memakainya
-- (ekspresi index tidak sama dengan ekspresi query). Kalau data tumbuh
-- menjadi ratusan ribu baris, tambahkan index trigram (pg_trgm) pada
-- visitors.full_name / visitors.phone.
create index if not exists visits_employee_id_idx
  on public.visits (employee_id);

-- ------------------------------------------------------------
-- 1. RPC utama
-- ------------------------------------------------------------
create or replace function public.admin_visits_page(
  p_page              int  default 1,
  p_page_size         int  default 20,
  p_employee_id       uuid default null,
  p_date_start        date default null,
  p_date_end          date default null,
  p_query             text default null,
  p_tz_offset_minutes int  default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_page  int := greatest(1, coalesce(p_page, 1));
  v_size  int := least(200, greatest(1, coalesce(p_page_size, 20)));
  v_off   int := 0;
  v_emp   uuid := nullif(coalesce(p_employee_id::text, ''), '')::uuid;
  v_tz    int  := coalesce(p_tz_offset_minutes, 0);
  v_query text := nullif(trim(coalesce(p_query, '')), '');
  v_like  text;
  v_ts    tsquery;
  v_from  timestamptz;
  v_to    timestamptz;
  v_today date;
  v_week_start  date;
  v_month_start date;
begin
  v_like  := case when v_query is null then null else '%' || v_query || '%' end;
  v_ts    := case when v_query is null then null else plainto_tsquery('indonesian', v_query) end;
  v_off   := (v_page - 1) * v_size;

  -- Batas tanggal lokal browser -> batas UTC
  v_from := case when p_date_start is null then null
            else ((p_date_start::timestamp) - make_interval(mins => v_tz)) at time zone 'utc' end;
  v_to   := case when p_date_end is null then null
            else (((p_date_end + 1)::timestamp) - make_interval(mins => v_tz)) at time zone 'utc' end;

  -- Hari lokal browser (WIB = +420 menit, dll)
  v_today := (((now() at time zone 'utc') + make_interval(mins => v_tz))::date);
  v_week_start  := v_today - ((extract(isodow from v_today)::int) - 1);
  v_month_start := date_trunc('month', v_today)::date;

  return (
    with base as materialized (
      select
        v.id,
        v.visitor_id,
        v.employee_id,
        v.purpose,
        v.remarks,
        v.status,
        v.check_in_at,
        v.check_out_at,
        v.qr_code,
        v.destination_text,
        vt.id as visitor_ref_id,
        vt.full_name as v_name,
        vt.phone as v_phone,
        vt.organization as v_org,
        vt.photo_url as v_photo,
        e.id as emp_ref_id,
        e.full_name as e_name,
        e.rank as e_rank,
        e.position as e_pos,
        (((v.check_in_at at time zone 'utc') + make_interval(mins => v_tz))::date) as local_day
      from public.visits v
      join public.visitors vt on vt.id = v.visitor_id
      left join public.employees e on e.id = v.employee_id
      where public.is_admin()
        and (v_emp is null or v.employee_id = v_emp)
        and (v_from is null or v.check_in_at >= v_from)
        and (v_to   is null or v.check_in_at <  v_to)
    ),
    matched as materialized (
      select b.*
      from base b
      where
        v_ts is null
        or to_tsvector('indonesian', concat_ws(' ',
             b.v_name, coalesce(b.v_org, ''), coalesce(b.v_phone, ''),
             coalesce(b.e_name, ''), coalesce(b.e_pos, ''), coalesce(b.e_rank, ''),
             coalesce(b.remarks, ''), coalesce(b.purpose, ''), coalesce(b.destination_text, '')
           )) @@ v_ts
        or b.v_name ilike v_like
        or coalesce(b.v_phone, '')   ilike v_like
        or coalesce(b.e_name, '')    ilike v_like
    ),
    totals as (
      select
        count(*)::bigint as total,
        count(*) filter (where local_day = v_today)::bigint as today,
        count(*) filter (where local_day >= v_week_start)::bigint as week,
        count(*) filter (where local_day >= v_month_start)::bigint as month
      from matched
    )
    select jsonb_build_object(
      'rows', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'visitor_id', m.visitor_id,
            'employee_id', m.employee_id,
            'purpose', m.purpose,
            'remarks', m.remarks,
            'status', m.status,
            'check_in_at', m.check_in_at,
            'check_out_at', m.check_out_at,
            'qr_code', m.qr_code,
            'destination_text', m.destination_text,
            'visitors', jsonb_build_object(
              'id', m.visitor_ref_id,
              'full_name', m.v_name,
              'phone', m.v_phone,
              'organization', m.v_org,
              'photo_url', m.v_photo
            ),
            'employees', case when m.emp_ref_id is null then null else jsonb_build_object(
              'id', m.emp_ref_id,
              'full_name', m.e_name,
              'rank', m.e_rank,
              'position', m.e_pos
            ) end
          )
          order by m.check_in_at desc, m.id desc
        )
        from (
          select * from matched
          order by check_in_at desc, id desc
          limit v_size offset v_off
        ) m
      ), '[]'::jsonb),
      'total',  t.total,
      'today',  t.today,
      'week',   t.week,
      'month',  t.month,
      'page',   v_page,
      'page_size', v_size
    )
    from totals t
  );
end;
$$;

revoke all on function public.admin_visits_page(int, int, uuid, date, date, text, int) from public;
grant execute on function public.admin_visits_page(int, int, uuid, date, date, text, int)
  to authenticated;

-- ------------------------------------------------------------
-- 2. Sanity check (jalankan terpisah, boleh dihapus)
--    select public.admin_visits_page(1, 20, null, null, null, null, 420);
-- ------------------------------------------------------------

