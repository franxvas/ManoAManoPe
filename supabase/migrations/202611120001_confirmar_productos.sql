-- La confirmación con código ahora sirve para servicios y también para productos y promociones (entregas).
-- Así, después de confirmar, se puede reseñar y calificar cualquiera de los dos.
create or replace function public.request_service_completion(p_conversation_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.deals; t public.listing_type;
begin
  select * into d from public.deals where conversation_id=p_conversation_id for update;
  if not found or auth.uid() is null or d.seller_id<>auth.uid() then raise exception 'Solo quien vende o presta el servicio puede pedir la confirmación'; end if;
  select type into t from public.listings where id=d.listing_id;
  if t not in ('service','product','promotion') then raise exception 'Este acuerdo no se puede confirmar con código'; end if;
  if d.status<>'accepted' then raise exception 'Primero deben aceptar la oferta'; end if;
  insert into public.service_confirmations(deal_id) values(d.id) on conflict(deal_id) do nothing;
end $$;

create or replace function public.get_service_confirmation(p_conversation_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d public.deals; c public.service_confirmations; t public.listing_type;
begin
  select * into d from public.deals where conversation_id=p_conversation_id;
  if not found or auth.uid() is null or auth.uid() not in (d.buyer_id,d.seller_id) then raise exception 'Acuerdo no disponible'; end if;
  select type into t from public.listings where id=d.listing_id;
  if t not in ('service','product','promotion') then raise exception 'Este acuerdo no se puede confirmar con código'; end if;
  select * into c from public.service_confirmations where deal_id=d.id;
  return jsonb_build_object('deal_id',d.id,'role',case when d.buyer_id=auth.uid() then 'client' else 'worker' end,
    'kind',case when t='service' then 'service' else 'product' end,
    'deal_status',d.status,'status',coalesce(c.status,'not_requested'),'expires_at',c.expires_at,'attempts',c.attempts,'confirmed_at',c.confirmed_at);
end $$;
