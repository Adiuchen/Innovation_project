-- Updates to an approved plant keep the same plant id and QR code.
-- An officer can write the live record directly.
-- A botanist edit is stored here until an officer approves or rejects it.
-- Until then, public pages keep showing the approved record.
--
-- Run in the Supabase SQL editor, then: NOTIFY pgrst, 'reload schema';

create table if not exists public.plant_updates (
  uuid uuid primary key default gen_random_uuid(),
  plant_record_id uuid not null references public.plant_records (uuid),
  status text not null default 'open' check (status in ('open', 'submitted', 'approved', 'rejected')),
  requested_by uuid not null references public.profiles (uuid),
  botanist_id uuid not null references public.profiles (uuid),
  plant_name text,
  life_stage text,
  species_id uuid,
  new_species_name text,
  height_m numeric,
  trunk_diameter_cm numeric,
  leaf_traits text,
  flower_fruit_traits text,
  health_status text,
  other_traits text,
  location_name text,
  latitude double precision,
  longitude double precision,
  visibility text not null default 'ordinary' check (visibility in ('ordinary', 'rare')),
  scientific_name text,
  common_name text,
  local_name text,
  family text,
  genus text,
  description text,
  conservation_status text,
  distribution text,
  ecological_info text,
  cultural_significance text,
  hide_photo_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid
);

create unique index if not exists plant_updates_one_active_idx
  on public.plant_updates (plant_record_id)
  where status in ('open', 'submitted');

create index if not exists plant_updates_botanist_status_idx
  on public.plant_updates (botanist_id, status);

alter table public.plant_photos
  add column if not exists pending_update_id uuid references public.plant_updates (uuid) on delete cascade;

comment on table public.plant_updates is
  'A proposed change to an approved plant. The live record, plant id, and QR stay put until an officer approves.';

comment on column public.plant_photos.pending_update_id is
  'Set while a photo belongs to a plant update that is not approved yet. Public pages omit these rows.';

alter table public.plant_updates enable row level security;

drop policy if exists "officers select plant updates" on public.plant_updates;
drop policy if exists "officers insert plant updates" on public.plant_updates;
drop policy if exists "officers update plant updates" on public.plant_updates;
drop policy if exists "botanists select assigned plant updates" on public.plant_updates;
drop policy if exists "botanists update assigned plant updates" on public.plant_updates;

create policy "officers select plant updates"
on public.plant_updates
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'conservation_officer'
      and p.status = 'active'
  )
);

create policy "officers insert plant updates"
on public.plant_updates
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'conservation_officer'
      and p.status = 'active'
  )
);

create policy "officers update plant updates"
on public.plant_updates
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'conservation_officer'
      and p.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'conservation_officer'
      and p.status = 'active'
  )
);

create policy "botanists select assigned plant updates"
on public.plant_updates
for select
to authenticated
using (
  botanist_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

create policy "botanists update assigned plant updates"
on public.plant_updates
for update
to authenticated
using (
  botanist_id = auth.uid()
  and status = 'open'
  and exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
)
with check (
  botanist_id = auth.uid()
  and status in ('open', 'submitted')
  and exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

revoke all on public.plant_updates from public, anon;
grant select, insert, update on public.plant_updates to authenticated;

create or replace function public.guard_plant_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1
      from public.plant_records pr
      where pr.uuid = new.plant_record_id
        and pr.status = 'approved'
        and pr.botanist_id = new.botanist_id
    ) then
      raise exception 'Ask the botanist who recorded this approved plant.';
    end if;
    if exists (
      select 1
      from public.plant_updates existing
      where existing.plant_record_id = new.plant_record_id
        and existing.status in ('open', 'submitted')
    ) then
      raise exception 'This plant already has an update in progress.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.plant_record_id is distinct from old.plant_record_id
      or new.requested_by is distinct from old.requested_by
      or new.botanist_id is distinct from old.botanist_id then
      raise exception 'This update stays on the original plant.';
    end if;
    if new.status in ('approved', 'rejected') and new.status is distinct from old.status then
      if not exists (
        select 1 from public.profiles p
        where p.uuid = auth.uid()
          and p.role = 'conservation_officer'
          and p.status = 'active'
      ) then
        raise exception 'Only an officer can approve or reject an update.';
      end if;
    end if;
    if exists (
      select 1 from public.profiles p
      where p.uuid = auth.uid()
        and p.role = 'botanist'
    ) then
      if old.status <> 'open' or new.status not in ('open', 'submitted') then
        raise exception 'This update can no longer be edited.';
      end if;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists guard_plant_update on public.plant_updates;
create trigger guard_plant_update
  before insert or update on public.plant_updates
  for each row
  execute function public.guard_plant_update();

-- Keep a photo that belongs to an unapproved update off the public catalogue.
do $$
declare
  photos_def text;
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'public_plant_photos'
      and c.relkind = 'v'
  ) then
    photos_def := rtrim(pg_get_viewdef('public.public_plant_photos'::regclass, true), E' \n\t;');
    if position('pending_update_id' in photos_def) = 0 then
      execute format(
        'create or replace view public.public_plant_photos as select published.* from (%s) as published where not exists (select 1 from public.plant_photos pending_photo where pending_photo.id = published.id and pending_photo.pending_update_id is not null)',
        photos_def
      );
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';
