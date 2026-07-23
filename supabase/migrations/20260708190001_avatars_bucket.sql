-- Create avatars bucket with public access for profile pictures
-- Run this in Supabase Studio SQL Editor

-- 1. Create bucket
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values (
  'avatars',
  'avatars',
  true,
  array['image/jpeg', 'image/png', 'image/webp'],
  2097152
)
on conflict (id) do update set
  public = excluded.public,
  allowed_mime_types = excluded.allowed_mime_types,
  file_size_limit = excluded.file_size_limit;

-- 2. Allow authenticated users to upload their own avatar
-- Note: we still use service role on server, but policy is useful for direct client access if needed

drop policy if exists avatars_select_public on storage.objects;
create policy avatars_select_public
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_authenticated on storage.objects;
create policy avatars_insert_authenticated
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists avatars_delete_authenticated on storage.objects;
create policy avatars_delete_authenticated
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars');
