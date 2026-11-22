-- A botanist can send an emergency from the field.
-- Conservation officers and other botanists can read it.
-- The sender, or an officer, can mark it safe.
-- Run this whole file once in the Supabase SQL editor.

create table if not exists public.emergency_alerts (
  uuid uuid primary key default gen_random_uuid(),
  botanist_id uuid not null references public.profiles (uuid),
  staff_id text not null,
  botanist_name text not null,
  latitude double precision,
  longitude double precision,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (uuid),
  constraint emergency_alerts_latitude_check check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint emergency_alerts_longitude_check check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint emergency_alerts_pair_check check ((latitude is null) = (longitude is null))
);

create unique index if not exists emergency_alerts_one_open_idx
  on public.emergency_alerts (botanist_id)
  where status = 'open';

create index if not exists emergency_alerts_open_idx
  on public.emergency_alerts (created_at desc)
  where status = 'open';

comment on table public.emergency_alerts is
  'A botanist in danger. Officers and other botanists can read open rows.';

alter table public.emergency_alerts enable row level security;

drop policy if exists "staff read emergencies" on public.emergency_alerts;
drop policy if exists "botanists send emergencies" on public.emergency_alerts;
drop policy if exists "staff update emergencies" on public.emergency_alerts;

create policy "staff read emergencies"
on public.emergency_alerts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.status = 'active'
      and p.role in ('botanist', 'conservation_officer')
  )
);

create policy "botanists send emergencies"
on public.emergency_alerts
for insert
to authenticated
with check (
  botanist_id = auth.uid()
  and status = 'open'
  and exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.status = 'active'
      and p.role = 'botanist'
  )
);

create policy "staff update emergencies"
on public.emergency_alerts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'conservation_officer'
        or (p.role = 'botanist' and emergency_alerts.botanist_id = auth.uid())
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'conservation_officer'
        or (p.role = 'botanist' and botanist_id = auth.uid())
      )
  )
);

create or replace function public.guard_emergency_alert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor_role text;
  actor_staff text;
  actor_name text;
begin
  select role, id, name
    into actor_role, actor_staff, actor_name
  from public.profiles
  where uuid = auth.uid()
    and status = 'active';

  if tg_op = 'INSERT' then
    if actor_role is distinct from 'botanist' then
      raise exception 'Only an active botanist can send an emergency.';
    end if;
    new.botanist_id := auth.uid();
    new.staff_id := actor_staff;
    new.botanist_name := coalesce(nullif(btrim(actor_name), ''), actor_staff);
    new.status := 'open';
    new.resolved_at := null;
    new.resolved_by := null;
  end if;

  if tg_op = 'UPDATE' then
    if actor_role is distinct from 'botanist' and actor_role is distinct from 'conservation_officer' then
      raise exception 'You cannot change this emergency.';
    end if;
    if actor_role = 'botanist' and old.botanist_id is distinct from auth.uid() then
      raise exception 'You can only update your own emergency.';
    end if;
    if old.status = 'resolved' then
      raise exception 'This emergency is already closed.';
    end if;
    if new.status not in ('open', 'resolved') then
      raise exception 'Unknown emergency status.';
    end if;
    new.uuid := old.uuid;
    new.botanist_id := old.botanist_id;
    new.staff_id := old.staff_id;
    new.botanist_name := old.botanist_name;
    if new.status = 'resolved' then
      new.resolved_at := now();
      new.resolved_by := auth.uid();
    end if;
  end if;

  return new;
end $$;

drop trigger if exists guard_emergency_alert on public.emergency_alerts;
create trigger guard_emergency_alert
  before insert or update on public.emergency_alerts
  for each row
  execute function public.guard_emergency_alert();

grant select, insert, update on public.emergency_alerts to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'emergency_alerts'
  ) then
    alter publication supabase_realtime add table public.emergency_alerts;
  end if;
end $$;

notify pgrst, 'reload schema';
