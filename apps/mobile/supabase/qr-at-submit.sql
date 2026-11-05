-- Botanists must be able to set qr_code when inserting/updating their own plant_records.
-- Run in the Supabase SQL editor if offline submit sync fails to persist qr_code.

comment on column public.plant_records.qr_code is
  'Stable tag code assigned at submit (from local_id). Kept on approve; minted only when missing.';

-- Example policies (adjust names to match your project). Prefer WITH CHECK that allows qr_code.
-- drop policy if exists "botanists insert own plant records" on public.plant_records;
-- create policy "botanists insert own plant records"
--   on public.plant_records for insert to authenticated
--   with check (
--     botanist_id = auth.uid()
--     and exists (select 1 from profiles p where p.uuid = auth.uid() and p.role = 'botanist' and p.status = 'active')
--   );
--
-- drop policy if exists "botanists update own plant records" on public.plant_records;
-- create policy "botanists update own plant records"
--   on public.plant_records for update to authenticated
--   using (botanist_id = auth.uid())
--   with check (botanist_id = auth.uid());
