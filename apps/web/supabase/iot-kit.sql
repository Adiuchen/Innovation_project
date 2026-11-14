-- One IoT kit for the whole park. Botanists and officers assign it to one plant.
--
-- Run in the Supabase SQL editor, then: NOTIFY pgrst, 'reload schema';

create table if not exists public.iot_kit (
  id integer primary key default 1 check (id = 1),
  plant_id text,
  updated_at timestamptz not null default now()
);

comment on table public.iot_kit is
  'The single park sensor kit. plant_id is the approved plant it is assigned to, or null.';

insert into public.iot_kit (id, plant_id)
values (1, null)
on conflict (id) do nothing;

alter table public.iot_kit enable row level security;

drop policy if exists "staff read iot kit" on public.iot_kit;
drop policy if exists "staff assign iot kit" on public.iot_kit;

create policy "staff read iot kit"
on public.iot_kit
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('botanist', 'conservation_officer', 'administrator')
      and p.status = 'active'
  )
);

create policy "staff assign iot kit"
on public.iot_kit
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('botanist', 'conservation_officer', 'administrator')
      and p.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.role in ('botanist', 'conservation_officer', 'administrator')
      and p.status = 'active'
  )
);

grant select, update on public.iot_kit to authenticated;
