-- Solicitudes privadas: solo las ve quien la envía y el dueño de la publicación.
create table public.donation_requests (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 5 and 300),
  status text not null default 'pending' check (status in ('pending', 'selected', 'declined', 'withdrawn', 'cancelled', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index donation_requests_one_active on public.donation_requests(donation_id, requester_id) where status in ('pending', 'selected');

create table public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.adoptions(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  housing text not null check (char_length(trim(housing)) between 2 and 500),
  other_pets text not null check (char_length(trim(other_pets)) between 2 and 500),
  daily_care text not null check (char_length(trim(daily_care)) between 2 and 500),
  experience text not null check (char_length(trim(experience)) between 2 and 500),
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'evaluating', 'accepted', 'declined', 'withdrawn', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index adoption_applications_one_active on public.adoption_applications(adoption_id, applicant_id) where status in ('pending', 'evaluating', 'accepted');

create trigger donation_requests_updated_at before update on public.donation_requests for each row execute function public.set_updated_at();
create trigger adoption_applications_updated_at before update on public.adoption_applications for each row execute function public.set_updated_at();

alter table public.donation_requests enable row level security;
alter table public.adoption_applications enable row level security;
revoke all on public.donation_requests, public.adoption_applications from anon, authenticated;
grant select on public.donation_requests, public.adoption_applications to authenticated;

create policy donation_requests_read on public.donation_requests for select to authenticated
  using (requester_id = auth.uid() or exists (select 1 from public.donations d where d.id = donation_id and d.owner_id = auth.uid()));
create policy adoption_applications_read on public.adoption_applications for select to authenticated
  using (applicant_id = auth.uid() or exists (select 1 from public.adoptions a where a.id = adoption_id and a.owner_id = auth.uid()));

create function public.community_notify(p_user uuid, p_title text, p_body text, p_data jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications(user_id, type, title, body, data) values (p_user, 'community', p_title, p_body, p_data);
$$;
revoke all on function public.community_notify(uuid, text, text, jsonb) from public, anon, authenticated;

-- Donaciones ------------------------------------------------------------

create function public.request_donation(p_donation uuid, p_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare d public.donations; new_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para solicitar.'; end if;
  select * into d from public.donations where id = p_donation for update;
  if not found then raise exception 'La donación ya no existe.'; end if;
  if d.owner_id = auth.uid() then raise exception 'No puedes solicitar tu propia donación.'; end if;
  if d.status <> 'available' then raise exception 'Esta donación ya no está disponible.'; end if;
  if exists (select 1 from public.donation_requests where donation_id = p_donation and requester_id = auth.uid() and status in ('pending', 'selected')) then
    raise exception 'Ya enviaste una solicitud para esta donación.';
  end if;
  insert into public.donation_requests(donation_id, requester_id, message) values (p_donation, auth.uid(), trim(p_message)) returning id into new_id;
  perform public.community_notify(d.owner_id, 'Nueva solicitud de donación', 'Alguien quiere "' || d.title || '".', jsonb_build_object('donation_id', d.id));
  return new_id;
end $$;

create function public.withdraw_donation_request(p_request uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.donation_requests set status = 'withdrawn' where id = p_request and requester_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Solo puedes retirar una solicitud pendiente.'; end if;
end $$;

-- Elegir a alguien solo reserva el objeto; la entrega se marca aparte.
create function public.select_donation_request(p_request uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.donation_requests; d public.donations;
begin
  select * into r from public.donation_requests where id = p_request;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  select * into d from public.donations where id = r.donation_id for update;
  if d.owner_id is distinct from auth.uid() then raise exception 'Solo el dueño puede elegir.'; end if;
  if d.status <> 'available' then raise exception 'La donación ya está reservada o entregada.'; end if;
  if r.status <> 'pending' then raise exception 'Esa solicitud ya no está pendiente.'; end if;
  update public.donation_requests set status = 'selected' where id = r.id;
  update public.donations set status = 'reserved' where id = d.id;
  perform public.community_notify(r.requester_id, '¡Te eligieron!', 'Coordina el recojo de "' || d.title || '".', jsonb_build_object('donation_id', d.id));
end $$;

create function public.mark_donation_delivered(p_donation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.donations;
begin
  select * into d from public.donations where id = p_donation for update;
  if d.owner_id is distinct from auth.uid() then raise exception 'Solo el dueño puede marcar la entrega.'; end if;
  if d.status <> 'reserved' then raise exception 'Primero elige a quién se entrega.'; end if;
  update public.donation_requests set status = 'delivered' where donation_id = d.id and status = 'selected';
  update public.donation_requests set status = 'declined' where donation_id = d.id and status = 'pending';
  update public.donations set status = 'delivered' where id = d.id;
end $$;

-- Si el acuerdo se cae, la donación vuelve a estar disponible.
create function public.cancel_donation_agreement(p_donation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.donations; r public.donation_requests;
begin
  select * into d from public.donations where id = p_donation for update;
  if d.status is distinct from 'reserved' then raise exception 'No hay un acuerdo activo.'; end if;
  select * into r from public.donation_requests where donation_id = d.id and status = 'selected';
  if auth.uid() is distinct from d.owner_id and auth.uid() is distinct from r.requester_id then raise exception 'No participas en este acuerdo.'; end if;
  update public.donation_requests set status = 'cancelled' where id = r.id;
  update public.donations set status = 'available' where id = d.id;
  perform public.community_notify(case when auth.uid() = d.owner_id then r.requester_id else d.owner_id end,
    'Acuerdo cancelado', '"' || d.title || '" vuelve a estar disponible.', jsonb_build_object('donation_id', d.id));
end $$;

-- Adopciones ------------------------------------------------------------

create function public.refresh_adoption_status(p_adoption uuid) returns void
language sql security definer set search_path = '' as $$
  update public.adoptions a set status = case
      when exists (select 1 from public.adoption_applications x where x.adoption_id = a.id and x.status = 'evaluating') then 'evaluating'
      else 'seeking' end
  where a.id = p_adoption and a.status in ('seeking', 'evaluating');
$$;
revoke all on function public.refresh_adoption_status(uuid) from public, anon, authenticated;

create function public.apply_for_adoption(p_adoption uuid, p_housing text, p_other_pets text, p_daily_care text, p_experience text, p_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a public.adoptions; new_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para adoptar.'; end if;
  select * into a from public.adoptions where id = p_adoption for update;
  if not found then raise exception 'La ficha ya no existe.'; end if;
  if a.owner_id = auth.uid() then raise exception 'No puedes adoptar tu propia publicación.'; end if;
  if a.status not in ('seeking', 'evaluating') then raise exception 'Esta adopción ya fue acordada.'; end if;
  if exists (select 1 from public.adoption_applications where adoption_id = p_adoption and applicant_id = auth.uid() and status in ('pending', 'evaluating', 'accepted')) then
    raise exception 'Ya enviaste una solicitud para este animal.';
  end if;
  insert into public.adoption_applications(adoption_id, applicant_id, housing, other_pets, daily_care, experience, message)
  values (p_adoption, auth.uid(), trim(p_housing), trim(p_other_pets), trim(p_daily_care), trim(p_experience), trim(coalesce(p_message, '')))
  returning id into new_id;
  perform public.community_notify(a.owner_id, 'Nueva solicitud de adopción', 'Alguien quiere adoptar a ' || a.pet_name || '.', jsonb_build_object('adoption_id', a.id));
  return new_id;
end $$;

-- El dueño revisa, rechaza o acuerda. Ninguna solicitud gana sola.
create function public.review_adoption_application(p_application uuid, p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare x public.adoption_applications; a public.adoptions;
begin
  select * into x from public.adoption_applications where id = p_application;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  select * into a from public.adoptions where id = x.adoption_id for update;
  if a.owner_id is distinct from auth.uid() then raise exception 'Solo quien publica revisa las solicitudes.'; end if;
  if x.status not in ('pending', 'evaluating') then raise exception 'Esa solicitud ya fue resuelta.'; end if;

  if p_action = 'evaluate' then
    if a.status not in ('seeking', 'evaluating') then raise exception 'La adopción ya está acordada.'; end if;
    update public.adoption_applications set status = 'evaluating' where id = x.id;
  elsif p_action = 'decline' then
    update public.adoption_applications set status = 'declined' where id = x.id;
    perform public.community_notify(x.applicant_id, 'Solicitud no seleccionada', 'Gracias por tu interés en ' || a.pet_name || '.', jsonb_build_object('adoption_id', a.id));
  elsif p_action = 'agree' then
    if a.status not in ('seeking', 'evaluating') then raise exception 'La adopción ya está acordada.'; end if;
    update public.adoption_applications set status = 'accepted' where id = x.id;
    update public.adoptions set status = 'agreed' where id = a.id;
    perform public.community_notify(x.applicant_id, '¡Adopción acordada!', 'Coordina la entrega de ' || a.pet_name || '.', jsonb_build_object('adoption_id', a.id));
    return;
  else
    raise exception 'Acción no válida.';
  end if;
  perform public.refresh_adoption_status(a.id);
end $$;

create function public.complete_adoption(p_adoption uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.adoptions;
begin
  select * into a from public.adoptions where id = p_adoption for update;
  if a.owner_id is distinct from auth.uid() then raise exception 'Solo quien publica confirma la entrega.'; end if;
  if a.status <> 'agreed' then raise exception 'Primero acuerda la adopción con una persona.'; end if;
  update public.adoption_applications set status = 'completed' where adoption_id = a.id and status = 'accepted';
  update public.adoption_applications set status = 'declined' where adoption_id = a.id and status in ('pending', 'evaluating');
  update public.adoptions set status = 'adopted' where id = a.id;
end $$;

-- Antes de la entrega, cualquiera de los dos puede cancelar el proceso.
create function public.cancel_adoption_process(p_adoption uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.adoptions; x public.adoption_applications;
begin
  select * into a from public.adoptions where id = p_adoption for update;
  if a.status is distinct from 'agreed' then raise exception 'No hay un proceso acordado.'; end if;
  select * into x from public.adoption_applications where adoption_id = a.id and status = 'accepted';
  if auth.uid() is distinct from a.owner_id and auth.uid() is distinct from x.applicant_id then raise exception 'No participas en este proceso.'; end if;
  update public.adoption_applications set status = 'cancelled' where id = x.id;
  update public.adoptions set status = 'seeking' where id = a.id;
  perform public.refresh_adoption_status(a.id);
  perform public.community_notify(case when auth.uid() = a.owner_id then x.applicant_id else a.owner_id end,
    'Proceso de adopción cancelado', a.pet_name || ' vuelve a buscar hogar.', jsonb_build_object('adoption_id', a.id));
end $$;

create function public.withdraw_adoption_application(p_application uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare x public.adoption_applications;
begin
  select * into x from public.adoption_applications where id = p_application and applicant_id = auth.uid();
  if not found or x.status not in ('pending', 'evaluating') then raise exception 'Solo puedes retirar una solicitud en revisión.'; end if;
  perform 1 from public.adoptions where id = x.adoption_id for update;
  update public.adoption_applications set status = 'withdrawn' where id = x.id;
  perform public.refresh_adoption_status(x.adoption_id);
end $$;

revoke all on function
  public.request_donation(uuid, text), public.withdraw_donation_request(uuid), public.select_donation_request(uuid),
  public.mark_donation_delivered(uuid), public.cancel_donation_agreement(uuid),
  public.apply_for_adoption(uuid, text, text, text, text, text), public.review_adoption_application(uuid, text),
  public.complete_adoption(uuid), public.cancel_adoption_process(uuid), public.withdraw_adoption_application(uuid)
from public, anon;
grant execute on function
  public.request_donation(uuid, text), public.withdraw_donation_request(uuid), public.select_donation_request(uuid),
  public.mark_donation_delivered(uuid), public.cancel_donation_agreement(uuid),
  public.apply_for_adoption(uuid, text, text, text, text, text), public.review_adoption_application(uuid, text),
  public.complete_adoption(uuid), public.cancel_adoption_process(uuid), public.withdraw_adoption_application(uuid)
to authenticated;
