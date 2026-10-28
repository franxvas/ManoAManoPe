-- pgcrypto puede estar en public o extensions en instalaciones de Supabase.
create schema billy_private;
revoke all on schema billy_private from public, anon, authenticated;
create function billy_private.hash_code(code text, salt text default null) returns text
language plpgsql set search_path = '' as $$
declare ns text; result text;
begin
 select n.nspname into ns from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto';
 execute format('select %I.crypt($1,coalesce($2,%I.gen_salt(''bf'',10)))',ns,ns) into result using code,salt;
 return result;
end $$;
create function billy_private.random_bytes() returns bytea
language plpgsql set search_path = '' as $$
declare ns text; result bytea;
begin
 select n.nspname into ns from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto';
 execute format('select %I.gen_random_bytes(3)',ns) into result;
 return result;
end $$;
revoke all on function billy_private.hash_code(text,text),billy_private.random_bytes() from public,anon,authenticated;
-- La única operación conectada es un acuerdo de servicio existente.
create table public.service_confirmations (
  deal_id uuid primary key references public.deals(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','issued','locked','confirmed')),
  code_hash text,
  expires_at timestamptz,
  attempts integer not null default 0 check (attempts between 0 and 5),
  issued_at timestamptz,
  generation_count integer not null default 0,
  generation_window timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  requested_at timestamptz not null default now()
);
alter table public.service_confirmations enable row level security;
revoke all on public.service_confirmations from anon, authenticated;

create function public.request_service_completion(p_conversation_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.deals; t public.listing_type;
begin
  select * into d from public.deals where conversation_id=p_conversation_id for update;
  if not found or auth.uid() is null or d.seller_id<>auth.uid() then raise exception 'Solo el trabajador puede solicitar la confirmación'; end if;
  select type into t from public.listings where id=d.listing_id;
  if t<>'service' or d.status<>'accepted' then raise exception 'Se requiere un acuerdo de servicio aceptado'; end if;
  insert into public.service_confirmations(deal_id) values(d.id) on conflict(deal_id) do nothing;
end $$;

create function public.issue_service_code(p_conversation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d public.deals; c public.service_confirmations; code text; bytes bytea; n integer;
begin
  select * into d from public.deals where conversation_id=p_conversation_id for update;
  if not found or auth.uid() is null or d.buyer_id<>auth.uid() then raise exception 'Solo el cliente puede generar el código'; end if;
  if d.status<>'accepted' then raise exception 'El acuerdo no está pendiente'; end if;
  select * into c from public.service_confirmations where deal_id=d.id for update;
  if not found or c.status='confirmed' then raise exception 'El trabajador debe solicitar la confirmación primero'; end if;
  if c.issued_at>clock_timestamp()-interval '30 seconds' then raise exception 'Espera 30 segundos antes de regenerar'; end if;
  if c.generation_window>clock_timestamp()-interval '24 hours' and c.generation_count>=10 then raise exception 'Límite diario de generación alcanzado'; end if;
  loop
    bytes:=billy_private.random_bytes();
    n:=get_byte(bytes,0)*65536+get_byte(bytes,1)*256+get_byte(bytes,2);
    if n<16000000 then
      code:=lpad((n%1000000)::text,6,'0');
      exit when c.code_hash is null or billy_private.hash_code(code,c.code_hash)<>c.code_hash;
    end if;
  end loop;
  update public.service_confirmations set status='issued',code_hash=billy_private.hash_code(code),expires_at=clock_timestamp()+interval '10 minutes',attempts=0,issued_at=clock_timestamp(),
    generation_count=case when generation_window<=clock_timestamp()-interval '24 hours' then 1 else generation_count+1 end,
    generation_window=case when generation_window<=clock_timestamp()-interval '24 hours' then clock_timestamp() else generation_window end
  where deal_id=d.id;
  return jsonb_build_object('code',code,'expires_at',clock_timestamp()+interval '10 minutes');
end $$;

create function public.validate_service_code(p_conversation_id uuid,p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d public.deals; c public.service_confirmations;
begin
  select * into d from public.deals where conversation_id=p_conversation_id for update;
  if not found or auth.uid() is null or d.seller_id<>auth.uid() then raise exception 'Solo el trabajador puede introducir el código'; end if;
  select * into c from public.service_confirmations where deal_id=d.id for update;
  if not found then return jsonb_build_object('ok',false,'reason','not_requested'); end if;
  if d.status<>'accepted' or c.status='confirmed' then return jsonb_build_object('ok',false,'reason','already_finished'); end if;
  if c.status<>'issued' or c.attempts>=5 then return jsonb_build_object('ok',false,'reason','unavailable'); end if;
  if c.expires_at<=clock_timestamp() then return jsonb_build_object('ok',false,'reason','expired'); end if;
  if p_code is null or p_code!~'^[0-9]{6}$' or billy_private.hash_code(p_code,c.code_hash)<>c.code_hash then
    update public.service_confirmations set attempts=attempts+1,status=case when attempts+1>=5 then 'locked' else status end where deal_id=d.id;
    return jsonb_build_object('ok',false,'reason','incorrect','remaining',4-c.attempts);
  end if;
  update public.service_confirmations set status='confirmed',code_hash=null,confirmed_at=clock_timestamp(),confirmed_by=auth.uid() where deal_id=d.id;
  update public.deals set status='completed',completed_at=clock_timestamp() where id=d.id;
  insert into public.messages(conversation_id,body,message_type) values(d.conversation_id,'Servicio confirmado por ambas partes. El código no acredita un pago.','system');
  return jsonb_build_object('ok',true);
end $$;

create function public.get_service_confirmation(p_conversation_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d public.deals; c public.service_confirmations; t public.listing_type;
begin
  select * into d from public.deals where conversation_id=p_conversation_id;
  if not found or auth.uid() is null or auth.uid() not in (d.buyer_id,d.seller_id) then raise exception 'Acuerdo no disponible'; end if;
  select type into t from public.listings where id=d.listing_id;
  if t<>'service' then raise exception 'Este acuerdo no es un servicio'; end if;
  select * into c from public.service_confirmations where deal_id=d.id;
  return jsonb_build_object('deal_id',d.id,'role',case when d.buyer_id=auth.uid() then 'client' else 'worker' end,'deal_status',d.status,'status',coalesce(c.status,'not_requested'),'expires_at',c.expires_at,'attempts',c.attempts,'confirmed_at',c.confirmed_at);
end $$;

-- La reseña ya no puede completar por sí sola un acuerdo.
create or replace function public.complete_deal_and_review(p_conversation_id uuid,p_rating smallint,p_comment text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare d public.deals; target uuid; review_id uuid;
begin
  select * into d from public.deals where conversation_id=p_conversation_id for update;
  if not found or auth.uid() is null or auth.uid() not in(d.buyer_id,d.seller_id) or d.status<>'completed' then raise exception 'Solo se puede reseñar una operación completada'; end if;
  if p_rating is null or p_rating not between 1 and 5 or char_length(coalesce(p_comment,''))>1000 then raise exception 'Reseña inválida'; end if;
  target:=case when auth.uid()=d.buyer_id then d.seller_id else d.buyer_id end;
  insert into public.reviews(deal_id,reviewer_id,reviewed_id,rating,comment) values(d.id,auth.uid(),target,p_rating,nullif(trim(p_comment),'')) returning id into review_id;
  return review_id;
end $$;
revoke all on function public.request_service_completion(uuid),public.issue_service_code(uuid),public.validate_service_code(uuid,text),public.get_service_confirmation(uuid),public.complete_deal_and_review(uuid,smallint,text) from public,anon;
grant execute on function public.request_service_completion(uuid),public.issue_service_code(uuid),public.validate_service_code(uuid,text),public.get_service_confirmation(uuid),public.complete_deal_and_review(uuid,smallint,text) to authenticated;
