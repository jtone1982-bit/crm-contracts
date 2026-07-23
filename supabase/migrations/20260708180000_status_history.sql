create table if not exists public.candidate_status_history (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz default now()
);

-- Index for fast lookup by candidate
create index if not exists idx_candidate_status_history_candidate_id
  on public.candidate_status_history(candidate_id);

-- RLS: allow authenticated users to read history for candidates they can access
alter table public.candidate_status_history enable row level security;

drop policy if exists candidate_status_history_select on public.candidate_status_history;
create policy candidate_status_history_select
  on public.candidate_status_history
  for select
  to authenticated
  using (
    exists (
      select 1 from public.candidates c
      join public.profiles p on p.id = auth.uid()
      where c.id = candidate_id
        and (p.role = 'admin' or c.manager_id = p.id)
    )
  );

drop policy if exists candidate_status_history_insert on public.candidate_status_history;
create policy candidate_status_history_insert
  on public.candidate_status_history
  for insert
  to authenticated
  with check (true);
