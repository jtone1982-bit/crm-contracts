create or replace function public.get_stuck_candidates(cutoff timestamptz)
returns table (id uuid, manager_id uuid, last_activity_at timestamptz)
language sql
stable
as $$
  select c.id, c.manager_id, c.last_activity_at
  from public.candidates c
  where c.status = 'На обзвон'
    and coalesce(c.last_activity_at, c.created_at) < cutoff
$$;
