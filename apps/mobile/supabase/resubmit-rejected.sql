-- Let a botanist edit a rejected record and send it back for review.
-- Needs revision and drafts were already editable. Rejected was blocked
-- when the update policy only matched those two statuses.
--
-- Run in the Supabase SQL editor, then: NOTIFY pgrst, 'reload schema';

drop policy if exists "botanists resubmit returned plant records" on public.plant_records;

create policy "botanists resubmit returned plant records"
on public.plant_records
for update
to authenticated
using (
  botanist_id = auth.uid()
  and status in ('draft', 'needs_revision', 'rejected')
  and exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
)
with check (
  botanist_id = auth.uid()
  and status in ('draft', 'submitted', 'needs_revision', 'rejected')
  and exists (
    select 1 from public.profiles p
    where p.uuid = auth.uid()
      and p.role = 'botanist'
      and p.status = 'active'
  )
);

notify pgrst, 'reload schema';
