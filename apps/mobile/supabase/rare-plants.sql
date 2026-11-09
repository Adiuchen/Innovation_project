-- Rare plants stay off the public catalogue.
-- A botanist marks each record ordinary or rare. Public scans of a rare tag
-- only learn that the plant is not open. Staff still read the row itself.
--
-- Run in the Supabase SQL editor, then: NOTIFY pgrst, 'reload schema';

alter table public.plant_records
  add column if not exists visibility text not null default 'ordinary';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'plant_records_visibility_check'
      and conrelid = 'public.plant_records'::regclass
  ) then
    alter table public.plant_records
      add constraint plant_records_visibility_check
      check (visibility in ('ordinary', 'rare'));
  end if;
end $$;

comment on column public.plant_records.visibility is
  'ordinary: public QR page. rare: staff only; public scans see a closed notice.';

-- Return type gains visibility, so replace the function outright.
drop function if exists public.resolve_plant_tag(text);

create function public.resolve_plant_tag(code text)
returns table(qr_code text, status text, visibility text)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(pr.qr_code, ''), 'plant-' || left(coalesce(pr.local_id::text, pr.uuid::text), 8)),
    pr.status,
    coalesce(pr.visibility, 'ordinary')
  from public.plant_records pr
  where pr.qr_code = code
     or (
       code ~* '^plant-[0-9a-f]{8}$'
       and (
         pr.local_id::text ilike substr(code, 7) || '%'
         or pr.uuid::text ilike substr(code, 7) || '%'
       )
     )
  order by case when pr.qr_code = code then 0 else 1 end
  limit 1;
$$;

revoke all on function public.resolve_plant_tag(text) from public;
grant execute on function public.resolve_plant_tag(text) to anon, authenticated;

-- Hide rare rows from the public catalogue without dropping the existing view.
-- Safe to run again: a view that already joins rare_guard is left as it is.
do $$
declare
  pages_def text;
  photos_def text;
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'public_plant_pages'
      and c.relkind = 'v'
  ) then
    pages_def := rtrim(pg_get_viewdef('public.public_plant_pages'::regclass, true), E' \n\t;');
    if position('rare_guard' in pages_def) = 0 then
      execute format(
        'create or replace view public.public_plant_pages as select published.* from (%s) as published join public.plant_records rare_guard on rare_guard.qr_code = published.qr_code and rare_guard.visibility <> ''rare''',
        pages_def
      );
    end if;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'public_plant_photos'
      and c.relkind = 'v'
  ) then
    photos_def := rtrim(pg_get_viewdef('public.public_plant_photos'::regclass, true), E' \n\t;');
    if position('rare_guard' in photos_def) = 0 then
      execute format(
        'create or replace view public.public_plant_photos as select published.* from (%s) as published where not exists (select 1 from public.plant_records rare_guard where rare_guard.qr_code = published.qr_code and rare_guard.visibility = ''rare'')',
        photos_def
      );
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';
