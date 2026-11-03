alter table public.community_events
  add column requires_registration boolean not null default false,
  add column capacity integer check (capacity is null or capacity between 1 and 5000),
  add column registered_count integer not null default 0 check (registered_count >= 0),
  add constraint community_events_capacity_ok check (capacity is null or registered_count <= capacity);

grant insert (requires_registration, capacity), update (requires_registration, capacity) on public.community_events to authenticated;

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index event_registrations_one_active on public.event_registrations(event_id, user_id) where status = 'active';

alter table public.event_registrations enable row level security;
revoke all on public.event_registrations from anon, authenticated;
grant select on public.event_registrations to authenticated;
create policy event_registrations_read on public.event_registrations for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.community_events e where e.id = event_id and e.organizer_id = auth.uid()));

-- Bloquear la fila del evento hace que dos inscripciones al mismo tiempo se atiendan una por una.
create function public.register_for_event(p_event uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare e public.community_events; new_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para inscribirte.'; end if;
  select * into e from public.community_events where id = p_event for update;
  if not found then raise exception 'El evento ya no existe.'; end if;
  if not e.requires_registration then raise exception 'Este evento no necesita inscripción.'; end if;
  if e.organizer_id = auth.uid() then raise exception 'Eres quien organiza este evento.'; end if;
  if e.ends_at <= now() then raise exception 'El evento ya finalizó.'; end if;
  if exists (select 1 from public.event_registrations where event_id = e.id and user_id = auth.uid() and status = 'active') then
    raise exception 'Ya estás inscrito.';
  end if;
  if e.capacity is not null and e.registered_count >= e.capacity then raise exception 'Sin cupos.'; end if;
  insert into public.event_registrations(event_id, user_id) values (e.id, auth.uid()) returning id into new_id;
  update public.community_events set registered_count = registered_count + 1 where id = e.id;
  return new_id;
end $$;

-- Cancelar libera el cupo.
create function public.cancel_event_registration(p_event uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare e public.community_events;
begin
  select * into e from public.community_events where id = p_event for update;
  if not found then raise exception 'El evento ya no existe.'; end if;
  if e.ends_at <= now() then raise exception 'El evento ya finalizó.'; end if;
  update public.event_registrations set status = 'cancelled', cancelled_at = now()
  where event_id = e.id and user_id = auth.uid() and status = 'active';
  if not found then raise exception 'No tienes una inscripción activa.'; end if;
  update public.community_events set registered_count = registered_count - 1 where id = e.id;
end $$;

-- El organizador no puede bajar la capacidad por debajo de los inscritos.
create function public.check_event_capacity() returns trigger
language plpgsql as $$
begin
  if new.capacity is not null and new.capacity < old.registered_count then
    raise exception 'Ya hay % inscritos, la capacidad no puede ser menor.', old.registered_count;
  end if;
  return new;
end $$;
create trigger community_events_capacity before update of capacity on public.community_events for each row execute function public.check_event_capacity();

revoke all on function public.register_for_event(uuid), public.cancel_event_registration(uuid) from public, anon;
grant execute on function public.register_for_event(uuid), public.cancel_event_registration(uuid) to authenticated;
