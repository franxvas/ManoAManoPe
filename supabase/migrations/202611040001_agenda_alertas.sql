create table public.service_slots (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 listing_id uuid not null references public.listings(id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null, active boolean not null default true,
 check(ends_at>starts_at)
);
create table public.service_bookings (
 id uuid primary key default gen_random_uuid(), slot_id uuid not null references public.service_slots(id),
 client_id uuid not null references public.profiles(id), note text not null check(char_length(trim(note)) between 5 and 1000),
 status text not null default 'pending' check(status in ('pending','confirmed','completed','cancelled')),
 proposed_slot_id uuid references public.service_slots(id), proposed_by uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
alter table public.service_slots enable row level security;
alter table public.service_bookings enable row level security;
create policy slots_read on public.service_slots for select using(true);
create policy bookings_read on public.service_bookings for select to authenticated using(client_id=auth.uid() or exists(select 1 from public.service_slots s where s.id=slot_id and s.owner_id=auth.uid()));
grant select on public.service_slots to anon,authenticated;
grant select on public.service_bookings to authenticated;
create function public.create_service_slot(p_listing uuid,p_start timestamptz,p_end timestamptz) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.listings where id=p_listing and owner_id=auth.uid() and type='service' and status='published') then raise exception 'Selecciona un servicio propio publicado'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if p_start<=now() or p_end<=p_start or p_end-p_start>interval '12 hours' then raise exception 'Revisa el horario; debe ser futuro y durar como máximo 12 horas'; end if;
 if exists(select 1 from public.service_slots where owner_id=auth.uid() and active and starts_at<p_end and ends_at>p_start) then raise exception 'Ya tienes un horario que se cruza'; end if;
 insert into public.service_slots(owner_id,listing_id,starts_at,ends_at) values(auth.uid(),p_listing,p_start,p_end) returning id into result; return result;
end $$;
create function public.book_service_slot(p_slot uuid,p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare s public.service_slots; result uuid;
begin
 select * into s from public.service_slots where id=p_slot for update;
 if not found or auth.uid() is null or s.owner_id=auth.uid() or not s.active or s.starts_at<=now() then raise exception 'Horario no disponible'; end if;
 if exists(select 1 from public.service_bookings where slot_id=p_slot and (status='confirmed' or (client_id=auth.uid() and status='pending'))) then raise exception 'El horario ya está reservado o ya lo solicitaste'; end if;
 insert into public.service_bookings(slot_id,client_id,note) values(p_slot,auth.uid(),trim(p_note)) returning id into result; return result;
end $$;
create function public.change_service_booking(p_booking uuid,p_action text,p_slot uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare b public.service_bookings; s public.service_slots; dest public.service_slots;
begin
 select s0.* into s from public.service_slots s0 join public.service_bookings b0 on b0.slot_id=s0.id where b0.id=p_booking;
 if not found or auth.uid() is null then raise exception 'Cita no disponible'; end if;
 perform 1 from public.profiles where id=s.owner_id for update;
 select * into b from public.service_bookings where id=p_booking for update;
 if auth.uid() not in(s.owner_id,b.client_id) or b.status in('completed','cancelled') then raise exception 'No puedes modificar esta cita'; end if;
 if p_action='cancel' then update public.service_bookings set status='cancelled',proposed_slot_id=null,proposed_by=null where id=b.id;
 elsif p_action='confirm' then
  if auth.uid()<>s.owner_id or b.status<>'pending' or s.starts_at<=now() or not s.active then raise exception 'No puedes confirmar esta cita'; end if;
  if exists(select 1 from public.service_bookings where slot_id=s.id and status='confirmed' and id<>b.id) then raise exception 'Este horario ya fue ocupado'; end if;
  update public.service_bookings set status='confirmed' where id=b.id;
  update public.service_bookings set status='cancelled' where slot_id=s.id and id<>b.id and status='pending';
 elsif p_action='complete' then
  if b.status<>'confirmed' or s.ends_at>now() then raise exception 'La cita todavía no ha terminado'; end if;
  update public.service_bookings set status='completed' where id=b.id;
 elsif p_action in('reschedule','accept_reschedule') then
  if b.status<>'confirmed' then raise exception 'Primero confirma la cita'; end if;
  select * into dest from public.service_slots where id=case when p_action='reschedule' then p_slot else b.proposed_slot_id end for update;
  if not found or dest.owner_id<>s.owner_id or dest.listing_id<>s.listing_id or not dest.active or dest.starts_at<=now() or dest.id=s.id then raise exception 'Elige otro horario del mismo servicio'; end if;
  if exists(select 1 from public.service_bookings where slot_id=dest.id and status='confirmed') then raise exception 'El nuevo horario ya está ocupado'; end if;
  if p_action='reschedule' then update public.service_bookings set proposed_slot_id=dest.id,proposed_by=auth.uid() where id=b.id;
  else
   if b.proposed_by=auth.uid() or b.proposed_by is null then raise exception 'La otra persona debe aceptar el cambio'; end if;
   update public.service_bookings set slot_id=dest.id,proposed_slot_id=null,proposed_by=null where id=b.id;
   update public.service_bookings set status='cancelled' where slot_id=dest.id and status='pending';
  end if;
 elsif p_action='reject_reschedule' then
  if b.proposed_by=auth.uid() or b.proposed_by is null then raise exception 'Cambio no disponible'; end if;
  update public.service_bookings set proposed_slot_id=null,proposed_by=null where id=b.id;
 else raise exception 'Acción inválida'; end if;
end $$;
create table public.saved_searches (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references public.profiles(id),
 query text not null default '', listing_type public.listing_type, category_id uuid references public.categories(id),
 max_price numeric check(max_price>=0), latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180), radius_km numeric not null check(radius_km>0 and radius_km<=100),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.saved_search_matches (
 search_id uuid not null references public.saved_searches(id) on delete cascade,
 listing_id uuid not null references public.listings(id) on delete cascade, created_at timestamptz not null default now(),
 primary key(search_id,listing_id)
);
alter table public.saved_searches enable row level security;
alter table public.saved_search_matches enable row level security;
create policy searches_own on public.saved_searches for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy matches_own on public.saved_search_matches for select to authenticated using(exists(select 1 from public.saved_searches s where s.id=search_id and s.owner_id=auth.uid()));
grant select,insert,update,delete on public.saved_searches to authenticated;
grant select on public.saved_search_matches to authenticated;
create function public.refresh_saved_searches() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 insert into public.saved_search_matches(search_id,listing_id)
 select s.id,l.id from public.saved_searches s join public.listings l on l.created_at>=s.created_at
 where s.owner_id=auth.uid() and s.active and l.owner_id<>auth.uid() and l.status='published'
 and (s.listing_type is null or s.listing_type=l.type) and (s.category_id is null or s.category_id=l.category_id)
 and (s.query='' or position(lower(s.query) in lower(l.title||' '||l.description))>0)
 and (s.max_price is null or coalesce(l.price,l.budget,0)<=s.max_price)
 and 6371*2*asin(sqrt(least(1.0,power(sin(radians(l.latitude-s.latitude)/2),2)+cos(radians(s.latitude))*cos(radians(l.latitude))*power(sin(radians(l.longitude-s.longitude)/2),2))))<=s.radius_km
 on conflict do nothing;
end $$;
revoke all on function public.create_service_slot(uuid,timestamptz,timestamptz),public.book_service_slot(uuid,text),public.change_service_booking(uuid,text,uuid),public.refresh_saved_searches() from public,anon;
grant execute on function public.create_service_slot(uuid,timestamptz,timestamptz),public.book_service_slot(uuid,text),public.change_service_booking(uuid,text,uuid),public.refresh_saved_searches() to authenticated;
notify pgrst,'reload schema';
