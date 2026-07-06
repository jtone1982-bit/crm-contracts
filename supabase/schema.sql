-- Enable RLS
alter table if exists public.profiles enable row level security;
alter table if exists public.candidates enable row level security;
alter table if exists public.candidate_files enable row level security;

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin', 'manager')),
  approved boolean not null default false,
  active boolean not null default true,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Candidates table
create table if not exists public.candidates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  phone text not null,
  full_name text,
  birth_date text,
  city_from text,
  city_to text,
  lead_source text,
  health_group text,
  diseases text,
  scars text,
  documents text,
  is_officer boolean default false,
  is_woman boolean default false,
  is_commissioned boolean default false,
  status text not null check (status in (
    'На обзвон', 'Недозвон', 'В работе', 'На билетах', 'На оформлении',
    'Подписал', 'Женщины, офицеры, комисс', 'Неактуально', 'Архив', 'Черный список'
  )),
  notes text,
  departure_date text,
  next_contact_date text,
  manager_id uuid references public.profiles(id) not null,
  imported_from_sheets boolean default false,
  sheet_row_index integer,
  unique(phone)
);

-- Candidate files
create table if not exists public.candidate_files (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  candidate_id uuid references public.candidates(id) on delete cascade not null,
  file_type text not null check (file_type in ('scar_photo', 'contract_photo', 'ticket', 'document')),
  file_url text not null,
  file_name text not null
);

-- RLS policies
-- Profiles: users can read own, admin can read all
create policy if not exists "Profiles: users read own"
  on public.profiles for select
  using (auth.uid() = id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy if not exists "Profiles: admin update"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Candidates: manager sees own, admin sees all
create policy if not exists "Candidates: manager sees own"
  on public.candidates for select
  using (auth.uid() = manager_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy if not exists "Candidates: manager updates own"
  on public.candidates for update
  using (auth.uid() = manager_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy if not exists "Candidates: admin inserts"
  on public.candidates for insert
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) or auth.uid() = manager_id);

-- Candidate files: same rules
create policy if not exists "Candidate files: manager sees own"
  on public.candidate_files for select
  using (exists (
    select 1 from public.candidates c
    where c.id = candidate_files.candidate_id
    and (c.manager_id = auth.uid() or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ))
  ));

create policy if not exists "Candidate files: manager inserts own"
  on public.candidate_files for insert
  with check (exists (
    select 1 from public.candidates c
    where c.id = candidate_files.candidate_id
    and (c.manager_id = auth.uid() or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ))
  ));

-- Functions
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, approved)
  values (new.id, new.email, 'manager', false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
