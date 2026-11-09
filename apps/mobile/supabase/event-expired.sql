-- Let an event be expired after its date, while cancelled stays for a person who took it down.
-- Run this in the Supabase SQL editor, then: notify pgrst, 'reload schema';

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'events'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%published%'
    and pg_get_constraintdef(con.oid) ilike '%cancelled%'
    and pg_get_constraintdef(con.oid) not ilike '%expired%';
  if constraint_name is not null then
    execute format('alter table public.events drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.events drop constraint if exists events_status_check;
alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'published', 'cancelled', 'expired'));

update public.events
set status = 'expired'
where status = 'published'
  and coalesce(ends_at, starts_at + interval '1 day') < now();

notify pgrst, 'reload schema';
