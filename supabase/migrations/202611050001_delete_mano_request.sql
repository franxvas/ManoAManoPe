create or replace function public.mano_delete_request(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare request_owner uuid;
begin
  select owner_id into request_owner from public.mano_requests where id = p_request for update;
  if auth.uid() is null or request_owner is distinct from auth.uid() then
    raise exception 'No puedes eliminar esta publicación.';
  end if;
  perform id from public.mano_tasks where request_id = p_request order by id for update;
  if exists (select 1 from public.mano_tasks where request_id = p_request and (status not in ('open', 'cancelled') or selected_proposal_id is not null)) then
    raise exception 'Esta publicación tiene un trabajo acordado. Conserva su historial.';
  end if;
  delete from public.mano_requests where id = p_request;
end;
$$;
revoke all on function public.mano_delete_request(uuid) from public, anon;
grant execute on function public.mano_delete_request(uuid) to authenticated;
