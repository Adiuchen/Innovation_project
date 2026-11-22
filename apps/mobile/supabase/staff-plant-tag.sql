-- Let every signed-in staff role read a plant from its printed tag,
-- including records an officer has not approved yet.
-- Public visitors do not receive this function. They keep using the public page.
--
-- Run this whole file once in the Supabase SQL editor, then:
--   NOTIFY pgrst, 'reload schema';

create or replace function public.staff_read_plant_tag(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.uuid = auth.uid()
      and p.status = 'active'
      and p.role in ('botanist', 'conservation_officer', 'administrator', 'guide')
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'uuid', pr.uuid,
    'id', pr.id,
    'botanist_id', pr.botanist_id,
    'plant_name', pr.plant_name,
    'life_stage', pr.life_stage,
    'species_id', pr.species_id,
    'status', pr.status,
    'location_name', pr.location_name,
    'latitude', pr.latitude,
    'longitude', pr.longitude,
    'height_m', pr.height_m,
    'trunk_diameter_cm', pr.trunk_diameter_cm,
    'leaf_traits', pr.leaf_traits,
    'flower_fruit_traits', pr.flower_fruit_traits,
    'health_status', pr.health_status,
    'other_traits', pr.other_traits,
    'qr_code', coalesce(nullif(pr.qr_code, ''), 'plant-' || left(coalesce(pr.local_id::text, pr.uuid::text), 8)),
    'review_note', pr.review_note,
    'recorded_at', pr.recorded_at,
    'local_id', pr.local_id,
    'scientific_name', s.scientific_name,
    'common_name', s.common_name,
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('storage_path', ph.storage_path, 'caption', ph.caption))
      from public.plant_photos ph
      where ph.plant_record_id = pr.uuid
        and ph.hidden_at is null
        and ph.storage_path is not null
    ), '[]'::jsonb)
  )
  into result
  from public.plant_records pr
  left join public.species s on s.uuid = pr.species_id
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

  return result;
end;
$$;

revoke all on function public.staff_read_plant_tag(text) from public;
grant execute on function public.staff_read_plant_tag(text) to authenticated;

notify pgrst, 'reload schema';
