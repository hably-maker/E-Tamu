-- ============================================================
-- E-Tamu — Migration 0031: filter, pencarian, paginasi & ringkasan
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
