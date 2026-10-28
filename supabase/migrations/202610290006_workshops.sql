-- Los talleres usan la misma tabla de eventos con datos extra. Por ahora son de una sola sesión.
alter table public.community_events drop constraint community_events_category_check;
alter table public.community_events
  add constraint community_events_category_check check (category in ('campana', 'limpieza', 'feria', 'salud', 'actividad', 'taller')),
  add column kind text not null default 'event' check (kind in ('event', 'workshop')),
  add column topic text not null default '' check (char_length(topic) <= 100),
  add column instructor text not null default '' check (char_length(instructor) <= 100),
  add column level text check (level in ('basico', 'intermedio', 'avanzado')),
  add column materials text not null default '' check (char_length(materials) <= 500),
  add column modality text check (modality in ('presencial', 'virtual')),
  add column registration_deadline timestamptz,
  add constraint community_events_workshop_ok check (
    kind = 'event' or (
      requires_registration and capacity is not null
      and char_length(trim(topic)) >= 2 and char_length(trim(instructor)) >= 2
      and level is not null and modality is not null
      and registration_deadline is not null and registration_deadline <= starts_at
    )
  );

grant insert (kind, topic, instructor, level, materials, modality, registration_deadline),
  update (topic, instructor, level, materials, modality, registration_deadline) on public.community_events to authenticated;

create or replace function public.register_for_event(p_event uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare e public.community_events; new_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para inscribirte.'; end if;
  select * into e from public.community_events where id = p_event for update;
  if not found then raise exception 'El evento ya no existe.'; end if;
  if not e.requires_registration then raise exception 'Este evento no necesita inscripción.'; end if;
  if e.organizer_id = auth.uid() then raise exception 'Eres quien organiza este evento.'; end if;
  if e.ends_at <= now() then raise exception 'El evento ya finalizó.'; end if;
  if e.registration_deadline is not null and now() > e.registration_deadline then raise exception 'Las inscripciones ya cerraron.'; end if;
  if exists (select 1 from public.event_registrations where event_id = e.id and user_id = auth.uid() and status = 'active') then
    raise exception 'Ya estás inscrito.';
  end if;
  if e.capacity is not null and e.registered_count >= e.capacity then raise exception 'Sin cupos.'; end if;
  insert into public.event_registrations(event_id, user_id) values (e.id, auth.uid()) returning id into new_id;
  update public.community_events set registered_count = registered_count + 1 where id = e.id;
  return new_id;
end $$;
