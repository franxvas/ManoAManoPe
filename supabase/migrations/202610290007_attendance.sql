-- Inscribirse y asistir son cosas distintas: la asistencia la marca el organizador.
alter table public.event_registrations add column attended boolean;

create function public.set_event_attendance(p_registration uuid, p_attended boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.event_registrations; e public.community_events;
begin
  select * into r from public.event_registrations where id = p_registration;
  if not found then raise exception 'Inscripción no encontrada.'; end if;
  select * into e from public.community_events where id = r.event_id;
  if e.organizer_id is distinct from auth.uid() then raise exception 'Solo quien organiza marca la asistencia.'; end if;
  if r.status <> 'active' then raise exception 'Esa inscripción fue cancelada.'; end if;
  if e.starts_at > now() then raise exception 'La asistencia se marca cuando el evento ya empezó.'; end if;
  update public.event_registrations set attended = p_attended where id = r.id;
end $$;

revoke all on function public.set_event_attendance(uuid, boolean) from public, anon;
grant execute on function public.set_event_attendance(uuid, boolean) to authenticated;
