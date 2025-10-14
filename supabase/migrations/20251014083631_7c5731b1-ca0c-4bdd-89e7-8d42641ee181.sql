-- Create a secure helper to fetch resident id by flat number for guards/admins
create or replace function public.lookup_resident_id_by_flat(_flat text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resident_uuid uuid;
begin
  -- Allow only guards and admins to use this helper
  if not (public.has_role(auth.uid(), 'guard') or public.has_role(auth.uid(), 'admin')) then
    return null;
  end if;

  select p.id
    into resident_uuid
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id and ur.role = 'resident'
  where p.flat_number = _flat
  limit 1;

  return resident_uuid;
end;
$$;

-- Grant execution to authenticated users so RPC can be called from the app
grant execute on function public.lookup_resident_id_by_flat(text) to authenticated;
