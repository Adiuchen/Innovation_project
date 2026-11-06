-- Allow authenticated staff to manage rows in public.plant_photos.
-- Fixes: new row violates row-level security policy for table "plant_photos"
--
-- Run in the Supabase SQL editor (as a privileged role), then:
--   NOTIFY pgrst, 'reload schema';
--
-- Storage bucket policies stay in storage.sql. This file is only for the
-- plant_photos *table* (metadata rows that point at storage paths).

alter table public.plant_photos enable row level security;

-- Drop prior versions of these policies so the script is safe to re-run.
drop policy if exists "botanists select own plant photos" on public.plant_photos;
drop policy if exists "botanists insert own plant photos" on public.plant_photos;
drop policy if exists "botanists update own plant photos" on public.plant_photos;
drop policy if exists "botanists delete own plant photos" on public.plant_photos;
drop policy if exists "officers select plant photos" on public.plant_photos;
drop policy if exists "officers insert plant photos" on public.plant_photos;
drop policy if exists "officers update plant photos" on public.plant_photos;
drop policy if exists "officers delete plant photos" on public.plant_photos;
drop policy if exists "staff select plant photos" on public.plant_photos;
drop policy if exists "staff insert plant photos" on public.plant_photos;
drop policy if exists "staff update plant photos" on public.plant_photos;
drop policy if exists "staff delete plant photos" on public.plant_photos;

-- Botanists: read photos on their own records (mobile sync / record detail).
create policy "botanists select own plant photos"
on public.plant_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.plant_records pr
    join public.profiles p on p.uuid = auth.uid()
    where pr.uuid = plant_photos.plant_record_id
      and pr.botanist_id = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

-- Botanists: attach photos while syncing offline submits / revising records.
create policy "botanists insert own plant photos"
on public.plant_photos
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.plant_records pr
    join public.profiles p on p.uuid = auth.uid()
    where pr.uuid = plant_photos.plant_record_id
      and pr.botanist_id = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

create policy "botanists update own plant photos"
on public.plant_photos
for update
to authenticated
using (
  exists (
    select 1
    from public.plant_records pr
    join public.profiles p on p.uuid = auth.uid()
    where pr.uuid = plant_photos.plant_record_id
      and pr.botanist_id = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
)
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.plant_records pr
    join public.profiles p on p.uuid = auth.uid()
    where pr.uuid = plant_photos.plant_record_id
      and pr.botanist_id = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

-- Botanists: remove photos when deleting a remote draft.
create policy "botanists delete own plant photos"
on public.plant_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.plant_records pr
    join public.profiles p on p.uuid = auth.uid()
    where pr.uuid = plant_photos.plant_record_id
      and pr.botanist_id = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

-- Officers / admins: review UI can view and manage photos on any record.
create policy "officers select plant photos"
on public.plant_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('conservation_officer', 'administrator')
      and p.status = 'active'
  )
);

create policy "officers insert plant photos"
on public.plant_photos
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('conservation_officer', 'administrator')
      and p.status = 'active'
  )
);

create policy "officers update plant photos"
on public.plant_photos
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('conservation_officer', 'administrator')
      and p.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('conservation_officer', 'administrator')
      and p.status = 'active'
  )
);

create policy "officers delete plant photos"
on public.plant_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('conservation_officer', 'administrator')
      and p.status = 'active'
  )
);

notify pgrst, 'reload schema';
