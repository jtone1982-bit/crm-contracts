create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

insert into public.departments (name) values
  ('Отдел Галины'),
  ('Отдел Артема')
on conflict (name) do nothing;

alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null;

alter table public.candidates
  add column if not exists department_id uuid references public.departments(id) on delete set null;

-- Auto-assign candidate department from manager on insert/update
-- Removed: we rely on application layer to keep in sync.
