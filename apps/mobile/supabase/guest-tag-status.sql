-- Guest / scan helpers for plant tags.
-- Run in the Supabase SQL editor, then: NOTIFY pgrst, 'reload schema';

-- Status only (legacy).
create or replace function public.plant_tag_progress(code text)
returns table(status text)
language sql
stable
security definer
set search_path = public
as $$
  select pr.status
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

revoke all on function public.plant_tag_progress(text) from public;
grant execute on function public.plant_tag_progress(text) to anon, authenticated;

-- Resolve a scanned/printed code to the canonical qr_code + status.
-- rare-plants.sql replaces this function so it also returns visibility.
-- After that file has been run, run rare-plants.sql again instead of this one.
-- Covers offline tags derived from local_id when approve minted plant-{server_uuid} instead.
create or replace function public.resolve_plant_tag(code text)
returns table(qr_code text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(pr.qr_code, ''), 'plant-' || left(coalesce(pr.local_id::text, pr.uuid::text), 8)),
    pr.status
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

notify pgrst, 'reload schema';

-- Optional one-time repair (commented out on purpose).
-- Do NOT run this in a normal SQL editor session: updates on plant_records fire
-- enforce_plant_record_access(), which raises "You need an active staff account"
-- when auth.uid() is missing.
--
-- If you need to backfill missing qr_code values, find the trigger name first:
--   select tgname from pg_trigger
--   where tgrelid = 'public.plant_records'::regclass and not tgisinternal;
-- Then disable it, repair, and re-enable (replace <trigger_name>):
--
--   alter table public.plant_records disable trigger <trigger_name>;
--   update public.plant_records
--   set qr_code = 'plant-' || left(local_id, 8)
--   where local_id is not null
--     and length(local_id) >= 8
--     and qr_code is null;
--   alter table public.plant_records enable trigger <trigger_name>;
