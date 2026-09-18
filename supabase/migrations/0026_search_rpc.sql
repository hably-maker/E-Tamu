-- Full-text search RPC for global search across admin dashboard tabs
-- Usage: select * from search_global('query text', 'dasbor'|'pegawai'|'admin'|'log', 20, 0);

create or replace function search_global(
  p_query text,
  p_tab text default 'dasbor',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  type text,
  title text,
  subtitle text,
  metadata jsonb,
  created_at timestamptz,
  rank real
)
language sql
security definer
set search_path = public
as $$
  -- Normalize query
  with q as (
    select plainto_tsquery('indonesian', p_query) as tsq
  ),
  -- Search visits (dasbor)
  visits_search as (
    select
      v.id,
      'visit' as type,
      vt.full_name as title,
      concat_ws(' | ', vt.organization, vt.phone, e.full_name) as subtitle,
      jsonb_build_object(
        'purpose', v.purpose,
        'remarks', v.remarks,
        'status', v.status,
        'employee_id', v.employee_id,
        'visitor_id', v.visitor_id
      ) as metadata,
      v.check_in_at as created_at,
      ts_rank_cd(
        to_tsvector('indonesian', concat_ws(' ', vt.full_name, vt.organization, vt.phone, e.full_name, e.position, e.rank)),
        q.tsq
      ) as rank
    from visits v
    join visitors vt on vt.id = v.visitor_id
    left join employees e on e.id = v.employee_id
    cross join q
    where q.tsq is not null
      and to_tsvector('indonesian', concat_ws(' ', vt.full_name, vt.organization, vt.phone, e.full_name, e.position, e.rank)) @@ q.tsq
      and p_tab = 'dasbor'
  ),
  -- Search employees (pegawai)
  employees_search as (
    select
      e.id,
      'employee' as type,
      e.full_name as title,
      concat_ws(' | ', e.rank, e.position) as subtitle,
      jsonb_build_object(
        'rank', e.rank,
        'position', e.position,
        'sort_order', e.sort_order
      ) as metadata,
      now() as created_at,
      ts_rank_cd(
        to_tsvector('indonesian', concat_ws(' ', e.full_name, e.rank, e.position)),
        q.tsq
      ) as rank
    from employees e
    cross join q
    where q.tsq is not null
      and to_tsvector('indonesian', concat_ws(' ', e.full_name, e.rank, e.position)) @@ q.tsq
      and p_tab = 'pegawai'
  ),
  -- Search admins (admin)
  admins_search as (
    select
      p.id,
      'admin' as type,
      p.full_name as title,
      concat_ws(' | ', p.email, p.role, case when p.is_super_admin then 'Super Admin' end) as subtitle,
      jsonb_build_object(
        'email', p.email,
        'role', p.role,
        'is_super_admin', p.is_super_admin,
        'must_change_password', p.must_change_password
      ) as metadata,
      now() as created_at,
      ts_rank_cd(
        to_tsvector('indonesian', concat_ws(' ', p.full_name, p.email, p.role)),
        q.tsq
      ) as rank
    from profiles p
    cross join q
    where q.tsq is not null
      and p.role in ('admin', 'staff')
      and to_tsvector('indonesian', concat_ws(' ', p.full_name, p.email, p.role)) @@ q.tsq
      and p_tab = 'admin'
  ),
  -- Search activity logs (log)
  logs_search as (
    select
      l.id,
      'log' as type,
      l.action as title,
      concat_ws(' | ', l.admin_name, l.target_name, l.detail) as subtitle,
      jsonb_build_object(
        'admin_id', l.admin_id,
        'admin_name', l.admin_name,
        'action', l.action,
        'target_type', l.target_type,
        'target_id', l.target_id,
        'target_name', l.target_name,
        'detail', l.detail
      ) as metadata,
      l.created_at,
      ts_rank_cd(
        to_tsvector('indonesian', concat_ws(' ', l.admin_name, l.action, l.target_name, l.detail)),
        q.tsq
      ) as rank
    from activity_logs l
    cross join q
    where q.tsq is not null
      and to_tsvector('indonesian', concat_ws(' ', l.admin_name, l.action, l.target_name, l.detail)) @@ q.tsq
      and p_tab = 'log'
  )
  -- Union all results
  select * from visits_search
  union all
  select * from employees_search
  union all
  select * from admins_search
  union all
  select * from logs_search
  order by rank desc, created_at desc
  limit p_limit
  offset p_offset;
$$;

-- Grant execute to authenticated roles
grant execute on function search_global(text, text, int, int) to authenticated;
grant execute on function search_global(text, text, int, int) to service_role;

-- Optional: Create GIN indexes for better performance (run once)
-- create index if not exists idx_visits_search_fts on visits using gin (to_tsvector('indonesian', concat_ws(' ', visitor_id::text, employee_id::text, purpose, remarks)));
-- create index if not exists idx_employees_search_fts on employees using gin (to_tsvector('indonesian', concat_ws(' ', full_name, rank, position)));
-- create index if not exists idx_profiles_search_fts on profiles using gin (to_tsvector('indonesian', concat_ws(' ', full_name, email, role)));
-- create index if not exists idx_logs_search_fts on activity_logs using gin (to_tsvector('indonesian', concat_ws(' ', admin_name, action, target_name, detail)));