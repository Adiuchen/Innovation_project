-- Officers could not see who submitted a plant.
-- profiles only lets each person read their own row, so the review list
-- embed comes back empty and the page shows "Unknown botanist".
-- Run this whole file once in the Supabase SQL editor.

create or replace function public.officer_can_read_profiles()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where uuid = auth.uid()
      and status = 'active'
      and role in ('conservation_officer', 'administrator')
  )
$$;

revoke all on function public.officer_can_read_profiles() from public;
grant execute on function public.officer_can_read_profiles() to authenticated;

drop policy if exists "officers read staff names" on public.profiles;

create policy "officers read staff names"
on public.profiles
for select
to authenticated
using (public.officer_can_read_profiles());
