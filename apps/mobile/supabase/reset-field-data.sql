-- Reset plant records and staff logins. Keep administrator (management) accounts.
--
-- Botanist, officer, and guide accounts are removed, including their login in auth.users.
-- Species rows are removed too. The table stays, so new species can be added afterwards.
-- The next plant id becomes P001, the next species id starts again at 001, and the next
-- staff ids become B001, O001, and G001, because those ids are the highest remaining number plus one.
--
-- Run the whole file once in the Supabase SQL editor. This cannot be undone.
-- The phone still keeps its own copies until that person signs out or the app data is cleared.

begin;

do $$
begin
  if not exists (select 1 from public.profiles where role = 'administrator' and status = 'active') then
    raise exception 'No active administrator profile found. Nothing was deleted.';
  end if;
end $$;

create temp table drop_users on commit drop as
select uuid
from public.profiles
where role in ('botanist', 'conservation_officer', 'guide');

-- Photos can belong to a plant or to a species. Clear every row before those tables.
delete from public.plant_photos;

delete from public.plant_updates;

-- A trigger on plant_records can refuse deletes. Turn user triggers off for this statement only.
alter table public.plant_records disable trigger user;
delete from public.plant_records;
alter table public.plant_records enable trigger user;

alter table public.species disable trigger user;
delete from public.species;
alter table public.species enable trigger user;

-- Events created by a removed officer cannot keep that created_by value.
delete from public.events
where created_by in (select uuid from drop_users);

-- Clear every login history row, including the management account. The table stays.
delete from public.login_logs;

-- Drop or detach any other row that still points at these accounts.
do $$
declare
  ref record;
begin
  for ref in
    select
      n.nspname as schema_name,
      cl.relname as table_name,
      att.attname as column_name,
      att.attnotnull as required
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    join pg_attribute att on att.attrelid = cl.oid and att.attnum = con.conkey[1]
    join pg_class target on target.oid = con.confrelid
    join pg_namespace target_ns on target_ns.oid = target.relnamespace
    where con.contype = 'f'
      and target_ns.nspname = 'public'
      and target.relname = 'profiles'
      and n.nspname = 'public'
      and cl.relname <> 'profiles'
      and cardinality(con.conkey) = 1
  loop
    if ref.required then
      execute format(
        'delete from %I.%I where %I in (select uuid from drop_users)',
        ref.schema_name, ref.table_name, ref.column_name
      );
    else
      execute format(
        'update %I.%I set %I = null where %I in (select uuid from drop_users)',
        ref.schema_name, ref.table_name, ref.column_name, ref.column_name
      );
    end if;
  end loop;
end $$;

-- Storage files cannot be deleted from SQL. After this script, empty the
-- plant-photos bucket from Storage in the Supabase dashboard.

delete from public.profiles
where uuid in (select uuid from drop_users);

delete from auth.users
where id in (select uuid from drop_users);

-- If a plant-id sequence exists, start it at 1 again. A trigger that reads the highest P-number
-- already returns P001 once plant_records is empty, so this is only for a real sequence.
do $$
declare
  seq regclass;
begin
  for seq in
    select c.oid::regclass
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'S'
      and n.nspname = 'public'
      and (c.relname ilike '%plant%' or c.relname ilike '%species%')
  loop
    perform setval(seq, 1, false);
  end loop;
end $$;

commit;

-- What remains. The next botanist created in Management is B001, the next officer is O001.
select id, name, role, status
from public.profiles
order by role, id;

select count(*) as plant_records_left from public.plant_records;
select count(*) as species_left from public.species;
