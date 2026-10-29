-- Run in the Supabase SQL editor.
-- The mobile app signs in with the publishable anon key only.
-- Do not put the service-role key in the app.

insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public read plant photos" on storage.objects;
drop policy if exists "botanists insert own plant photos" on storage.objects;
drop policy if exists "botanists update own plant photos" on storage.objects;

create policy "public read plant photos"
on storage.objects for select
to public
using (bucket_id = 'plant-photos');

create policy "botanists insert own plant photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "botanists update own plant photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
