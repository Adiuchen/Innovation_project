-- Allow botanists to permanently delete their own draft plant_records
-- (and the plant_photos rows that belong to those drafts).
--
-- Fixes mobile "Delete draft" when Supabase returns permission denied / RLS.
-- Prefer the RPC below: table DELETE grants are often missing even after
-- RLS policies exist, and a trigger on plant_records can also block deletes.
--
-- Run the WHOLE file in the Supabase SQL editor (as a privileged role).
-- Do not highlight a fragment — Run with nothing selected runs the full script.
-- Then: NOTIFY pgrst, 'reload schema';
--
-- Safe to re-run. Does not allow deleting submitted / approved / rejected rows.

alter table public.plant_records enable row level security;
alter table public.plant_photos enable row level security;

-- Table privileges (RLS policies alone are not enough).
grant select, insert, update, delete on table public.plant_records to authenticated;
grant select, insert, update, delete on table public.plant_photos to authenticated;

-- Drop prior versions so the script is safe to re-run.
drop policy if exists "botanists delete own draft plant records" on public.plant_records;
drop policy if exists "botanists delete own plant photos" on public.plant_photos;
drop policy if exists "botanists delete own plant photo files" on storage.objects;
drop function if exists public.delete_own_draft(uuid);

-- Botanists: remove a draft they still own. Submitted and later statuses stay.
create policy "botanists delete own draft plant records"
on public.plant_records
for delete
to authenticated
using (
  botanist_id = auth.uid()
  and status::text = 'draft'
  and exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role::text = 'botanist'
      and p.status::text = 'active'
  )
);

-- Botanists: remove photo metadata on their own records (needed before the draft row goes).
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
      and p.role::text = 'botanist'
      and p.status::text = 'active'
  )
);

-- Optional cleanup of image files under the botanist's own folder in plant-photos.
create policy "botanists delete own plant photo files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Reliable path used by the mobile app: runs as the function owner so missing
-- DELETE grants / awkward RLS combinations cannot block an authorized botanist.
create or replace function public.delete_own_draft(p_record_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  record_status text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role::text = 'botanist'
      and p.status::text = 'active'
  ) then
    raise exception 'Only an active botanist can delete a draft';
  end if;

  select pr.botanist_id, pr.status::text
    into owner_id, record_status
  from public.plant_records pr
  where pr.uuid = p_record_id
  for update;

  if owner_id is null then
    raise exception 'Draft not found';
  end if;

  if owner_id <> auth.uid() then
    raise exception 'You can only delete your own drafts';
  end if;

  if record_status <> 'draft' then
    raise exception 'Only drafts can be deleted';
  end if;

  delete from public.plant_photos
  where plant_record_id = p_record_id;

  delete from public.plant_records
  where uuid = p_record_id
    and botanist_id = auth.uid()
    and status::text = 'draft';
end;
$$;

revoke all on function public.delete_own_draft(uuid) from public;
grant execute on function public.delete_own_draft(uuid) to authenticated;

notify pgrst, 'reload schema';
