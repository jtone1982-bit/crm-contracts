alter table public.profiles
add column if not exists last_active_at timestamp with time zone;

create index if not exists idx_profiles_last_active_at
on public.profiles(last_active_at);

comment on column public.profiles.last_active_at is 'Timestamp of last user activity on the site';
