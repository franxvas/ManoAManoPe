-- Módulo Necesito una mano. Las operaciones de propuestas se realizan mediante RPC.
create table public.mano_requests (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 kind text not null check(kind in ('help','repair','project')),
 title text not null check(char_length(title) between 5 and 120), category text not null,
 description text not null, budget_min numeric check(budget_min>=0), budget_max numeric check(budget_max>=0),
 deadline date, modality text check(modality in ('home','worker_location','remote')),
 approximate_latitude numeric check(approximate_latitude between -90 and 90), approximate_longitude numeric check(approximate_longitude between -180 and 180),
 check((approximate_latitude is null)=(approximate_longitude is null)),
 approximate_location text not null, repair_item text, brand_model text, problem_since text, transport text,
 photos text[] not null default '{}', created_at timestamptz not null default now(),
 check(budget_max is null or budget_min is null or budget_max>=budget_min)
);
create table public.mano_tasks (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.mano_requests on delete cascade,
 title text not null, budget_min numeric check(budget_min>=0), budget_max numeric check(budget_max>=0),
 status text not null default 'open' check(status in ('open','in_progress','completion_requested','completed','cancelled')),
 selected_proposal_id uuid, created_at timestamptz not null default now(),
 check(budget_max is null or budget_min is null or budget_max>=budget_min)
);
create table public.mano_proposals (
 id uuid primary key default gen_random_uuid(), task_id uuid not null references public.mano_tasks on delete cascade,
 worker_id uuid not null references public.profiles(id), quote_kind text not null check(quote_kind in ('diagnosis','estimate','fixed')),
 amount_min numeric not null check(amount_min>=0), amount_max numeric check(amount_max>=amount_min),
 scope text not null, duration text not null, available_from text not null, materials text not null,
 inspection_cost numeric check(inspection_cost>=0), note text not null default '',
 status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(task_id,worker_id)
);
alter table public.mano_tasks add constraint mano_selected_proposal_fk foreign key(selected_proposal_id) references public.mano_proposals(id);
create table public.mano_quote_revisions (
 id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.mano_proposals on delete cascade,
 amount_min numeric not null check(amount_min>=0), amount_max numeric check(amount_max>=amount_min),
 scope text not null, status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(), resolved_at timestamptz
);
create unique index mano_one_pending_revision on public.mano_quote_revisions(proposal_id) where status='pending';
create table public.mano_messages (
 id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.mano_proposals on delete cascade,
 sender_id uuid not null references public.profiles(id), body text not null check(char_length(trim(body)) between 1 and 4000), created_at timestamptz not null default now()
);
create table public.mano_reviews (
 id uuid primary key default gen_random_uuid(), task_id uuid not null unique references public.mano_tasks on delete cascade,
 author_id uuid not null references public.profiles(id), worker_id uuid not null references public.profiles(id),
 rating integer not null check(rating between 1 and 5), comment text not null default '', created_at timestamptz not null default now()
);
alter table public.mano_requests enable row level security;
alter table public.mano_tasks enable row level security;
alter table public.mano_proposals enable row level security;
alter table public.mano_quote_revisions enable row level security;
alter table public.mano_messages enable row level security;
alter table public.mano_reviews enable row level security;
create policy mano_requests_read on public.mano_requests for select using(true);
create policy mano_requests_insert on public.mano_requests for insert to authenticated with check(owner_id=auth.uid());
create policy mano_tasks_read on public.mano_tasks for select using(true);
create policy mano_tasks_insert on public.mano_tasks for insert to authenticated with check(status='open' and selected_proposal_id is null and exists(select 1 from public.mano_requests r where r.id=request_id and r.owner_id=auth.uid()));
create policy mano_proposals_private on public.mano_proposals for select to authenticated using(worker_id=auth.uid() or exists(select 1 from public.mano_tasks t join public.mano_requests r on r.id=t.request_id where t.id=task_id and r.owner_id=auth.uid()));
create policy mano_revisions_private on public.mano_quote_revisions for select to authenticated using(exists(select 1 from public.mano_proposals p join public.mano_tasks t on t.id=p.task_id join public.mano_requests r on r.id=t.request_id where p.id=proposal_id and (p.worker_id=auth.uid() or r.owner_id=auth.uid())));
create policy mano_messages_private on public.mano_messages for select to authenticated using(exists(select 1 from public.mano_proposals p join public.mano_tasks t on t.id=p.task_id join public.mano_requests r on r.id=t.request_id where p.id=proposal_id and (p.worker_id=auth.uid() or r.owner_id=auth.uid())));
create policy mano_messages_insert on public.mano_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.mano_proposals p join public.mano_tasks t on t.id=p.task_id join public.mano_requests r on r.id=t.request_id where p.id=proposal_id and (p.worker_id=auth.uid() or r.owner_id=auth.uid())));
create policy mano_reviews_read on public.mano_reviews for select using(true);

create function public.mano_submit_proposal(p_task uuid,p_kind text,p_min numeric,p_max numeric,p_scope text,p_duration text,p_start text,p_materials text,p_inspection numeric,p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare t public.mano_tasks; owner uuid; result uuid;
begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 select * into t from public.mano_tasks where id=p_task for update;
 if not found or t.status<>'open' then raise exception 'La tarea no recibe propuestas'; end if;
 select owner_id into owner from public.mano_requests where id=t.request_id;
 if owner=auth.uid() then raise exception 'No puedes proponer a tu propia solicitud'; end if;
 insert into public.mano_proposals(task_id,worker_id,quote_kind,amount_min,amount_max,scope,duration,available_from,materials,inspection_cost,note)
 values(p_task,auth.uid(),p_kind,p_min,p_max,p_scope,p_duration,p_start,p_materials,p_inspection,coalesce(p_note,''))
 on conflict(task_id,worker_id) do update set quote_kind=excluded.quote_kind,amount_min=excluded.amount_min,amount_max=excluded.amount_max,scope=excluded.scope,duration=excluded.duration,available_from=excluded.available_from,materials=excluded.materials,inspection_cost=excluded.inspection_cost,note=excluded.note,updated_at=now()
 where public.mano_proposals.status='pending' returning id into result;
 if result is null then raise exception 'La propuesta ya no se puede editar'; end if; return result;
end $$;
create function public.mano_accept_proposal(p_proposal uuid) returns void
language plpgsql security definer set search_path='' as $$
declare p public.mano_proposals; t public.mano_tasks; owner uuid;
begin
 select * into p from public.mano_proposals where id=p_proposal;
 if not found then raise exception 'Propuesta no encontrada'; end if;
 select * into t from public.mano_tasks where id=p.task_id for update;
 select owner_id into owner from public.mano_requests where id=t.request_id;
 if auth.uid() is null or owner<>auth.uid() or t.status<>'open' then raise exception 'No puedes aceptar esta propuesta'; end if;
 select * into p from public.mano_proposals where id=p_proposal for update;
 if p.status<>'pending' then raise exception 'La propuesta ya no está disponible'; end if;
 update public.mano_proposals set status=case when id=p_proposal then 'accepted' else 'rejected' end where task_id=t.id and status='pending';
 update public.mano_tasks set status='in_progress',selected_proposal_id=p_proposal where id=t.id;
end $$;
create function public.mano_reject_proposal(p_proposal uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.mano_proposals p set status='rejected' from public.mano_tasks t,public.mano_requests r
 where p.id=p_proposal and p.task_id=t.id and t.request_id=r.id and r.owner_id=auth.uid() and t.status='open' and p.status='pending';
 if not found then raise exception 'No puedes rechazar esta propuesta'; end if;
end $$;
create function public.mano_revise_quote(p_proposal uuid,p_min numeric,p_max numeric,p_scope text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; task_row public.mano_tasks;
begin
 select t.* into task_row from public.mano_tasks t join public.mano_proposals p on p.task_id=t.id where p.id=p_proposal and p.worker_id=auth.uid() and p.status='accepted' for update of t;
 if not found or task_row.status<>'in_progress' or task_row.selected_proposal_id<>p_proposal then raise exception 'No puedes modificar este presupuesto'; end if;
 insert into public.mano_quote_revisions(proposal_id,amount_min,amount_max,scope) values(p_proposal,p_min,p_max,p_scope) returning id into result; return result;
end $$;
create function public.mano_respond_revision(p_revision uuid,p_accept boolean) returns void
language plpgsql security definer set search_path='' as $$
declare rev public.mano_quote_revisions;
begin
 select q.* into rev from public.mano_quote_revisions q join public.mano_proposals p on p.id=q.proposal_id join public.mano_tasks t on t.id=p.task_id join public.mano_requests r on r.id=t.request_id where q.id=p_revision and r.owner_id=auth.uid() and q.status='pending' and t.status='in_progress' for update of q;
 if not found or p_accept is null then raise exception 'No puedes responder a esta actualización'; end if;
 update public.mano_quote_revisions set status=case when p_accept then 'accepted' else 'rejected' end,resolved_at=now() where id=rev.id;
 if p_accept then update public.mano_proposals set quote_kind=case when rev.amount_max is null then 'fixed' else 'estimate' end,amount_min=rev.amount_min,amount_max=rev.amount_max,scope=rev.scope,updated_at=now() where id=rev.proposal_id; end if;
end $$;
create function public.mano_change_task_status(p_task uuid,p_action text) returns void
language plpgsql security definer set search_path='' as $$
declare t public.mano_tasks; owner uuid; worker uuid;
begin
 select * into t from public.mano_tasks where id=p_task for update;
 if not found then raise exception 'Tarea no encontrada'; end if;
 select owner_id into owner from public.mano_requests where id=t.request_id;
 select worker_id into worker from public.mano_proposals where id=t.selected_proposal_id;
 if p_action='request_completion' and auth.uid()=worker and t.status='in_progress' and not exists(select 1 from public.mano_quote_revisions q where q.proposal_id=t.selected_proposal_id and q.status='pending') then update public.mano_tasks set status='completion_requested' where id=t.id;
 elsif p_action='confirm_completion' and auth.uid()=owner and t.status='completion_requested' then update public.mano_tasks set status='completed' where id=t.id;
 elsif p_action='cancel' and auth.uid()=owner and t.status='open' then update public.mano_tasks set status='cancelled' where id=t.id;
 else raise exception 'Transición no permitida'; end if;
end $$;
create function public.mano_submit_review(p_task uuid,p_rating integer,p_comment text) returns void
language plpgsql security definer set search_path='' as $$
begin
 insert into public.mano_reviews(task_id,author_id,worker_id,rating,comment)
 select t.id,auth.uid(),p.worker_id,p_rating,coalesce(p_comment,'') from public.mano_tasks t join public.mano_requests r on r.id=t.request_id join public.mano_proposals p on p.id=t.selected_proposal_id where t.id=p_task and r.owner_id=auth.uid() and t.status='completed';
 if not found then raise exception 'No puedes calificar esta tarea'; end if;
end $$;
revoke all on function public.mano_submit_proposal(uuid,text,numeric,numeric,text,text,text,text,numeric,text), public.mano_accept_proposal(uuid),public.mano_reject_proposal(uuid),public.mano_revise_quote(uuid,numeric,numeric,text),public.mano_respond_revision(uuid,boolean),public.mano_change_task_status(uuid,text),public.mano_submit_review(uuid,integer,text) from public,anon;
grant execute on function public.mano_submit_proposal(uuid,text,numeric,numeric,text,text,text,text,numeric,text), public.mano_accept_proposal(uuid),public.mano_reject_proposal(uuid),public.mano_revise_quote(uuid,numeric,numeric,text),public.mano_respond_revision(uuid,boolean),public.mano_change_task_status(uuid,text),public.mano_submit_review(uuid,integer,text) to authenticated;
-- Creación atómica: una solicitud siempre nace con al menos una tarea.
create function public.mano_create_request(p_data jsonb,p_tasks jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare request_id uuid; item jsonb; task_count integer;
begin
 if auth.uid() is null then raise exception 'Inicia sesión'; end if;
 if jsonb_typeof(p_tasks)<>'array' then raise exception 'Se requiere una lista de tareas'; end if;
 task_count:=jsonb_array_length(p_tasks);
 if task_count<1 or task_count>30 then raise exception 'Agrega entre una y treinta tareas'; end if;
 if p_data->>'kind'<>'project' and task_count<>1 then raise exception 'Esta solicitud requiere una sola tarea'; end if;
 insert into public.mano_requests(owner_id,kind,title,category,description,budget_min,budget_max,deadline,modality,approximate_location,approximate_latitude,approximate_longitude,repair_item,brand_model,problem_since,transport,photos)
 values(auth.uid(),p_data->>'kind',p_data->>'title',p_data->>'category',p_data->>'description',nullif(p_data->>'budget_min','')::numeric,nullif(p_data->>'budget_max','')::numeric,nullif(p_data->>'deadline','')::date,nullif(p_data->>'modality',''),p_data->>'approximate_location',round(nullif(p_data->>'approximate_latitude','')::numeric,2),round(nullif(p_data->>'approximate_longitude','')::numeric,2),p_data->>'repair_item',p_data->>'brand_model',p_data->>'problem_since',p_data->>'transport',array(select jsonb_array_elements_text(coalesce(p_data->'photos','[]'::jsonb)))) returning id into request_id;
 for item in select * from jsonb_array_elements(p_tasks) loop
  insert into public.mano_tasks(request_id,title,budget_min,budget_max) values(request_id,item->>'title',nullif(item->>'budget_min','')::numeric,nullif(item->>'budget_max','')::numeric);
 end loop;
 return request_id;
end $$;
revoke all on function public.mano_create_request(jsonb,jsonb) from public,anon;
grant execute on function public.mano_create_request(jsonb,jsonb) to authenticated;
-- Obligar a que la creación pase por la operación atómica.
drop policy mano_requests_insert on public.mano_requests;
drop policy mano_tasks_insert on public.mano_tasks;
-- Validaciones adicionales se aplican también a clientes que llaman directamente al API.
alter table public.mano_requests add constraint mano_request_nonempty check (length(trim(category))>0 and length(trim(description))>0 and length(trim(approximate_location))>0);
alter table public.mano_tasks add constraint mano_task_nonempty check (length(trim(title))>0);
alter table public.mano_proposals add constraint mano_proposal_nonempty check (length(trim(scope))>0 and length(trim(duration))>0 and length(trim(available_from))>0 and length(trim(materials))>0);
alter table public.mano_proposals add constraint mano_estimate_has_range check (quote_kind<>'estimate' or amount_max is not null);
alter table public.mano_quote_revisions add constraint mano_revision_nonempty check (length(trim(scope))>0);
-- Integración con reputación y bandeja de conversaciones existentes.
create function public.mano_refresh_rating(p_profile uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where id=p_profile for update;
 update public.profiles set rating_average=(select coalesce(avg(rating),0) from (select r.rating from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=p_profile and d.status='completed' union all select r.rating from public.mano_reviews r join public.mano_tasks t on t.id=r.task_id where r.worker_id=p_profile and t.status='completed') all_reviews),
 rating_count=(select count(*) from (select r.id from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=p_profile and d.status='completed' union all select r.id from public.mano_reviews r join public.mano_tasks t on t.id=r.task_id where r.worker_id=p_profile and t.status='completed') all_reviews) where id=p_profile;
end $$;
revoke all on function public.mano_refresh_rating(uuid) from public,anon,authenticated;
create function public.mano_review_rating_trigger() returns trigger language plpgsql security definer set search_path='' as $$ begin perform public.mano_refresh_rating(new.worker_id); return new; end $$;
revoke all on function public.mano_review_rating_trigger() from public,anon,authenticated;
create trigger mano_review_rating after insert on public.mano_reviews for each row execute function public.mano_review_rating_trigger();
create or replace function public.refresh_profile_rating() returns trigger language plpgsql security definer set search_path='' as $$ begin perform public.mano_refresh_rating(new.reviewed_id); return new; end $$;
create or replace function public.list_public_reviews(p_owner_id uuid,p_listing_id uuid default null) returns table(id uuid,rating smallint,comment text,reviewer_name text,operation_type public.listing_type,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select * from (
 select r.id,r.rating,r.comment,p.display_name,l.type,r.created_at from public.reviews r join public.deals d on d.id=r.deal_id join public.listings l on l.id=d.listing_id join public.profiles p on p.id=r.reviewer_id where r.reviewed_id=p_owner_id and d.status='completed' and(p_listing_id is null or d.listing_id=p_listing_id)
 union all select r.id,r.rating::smallint,r.comment,p.display_name,'need'::public.listing_type,r.created_at from public.mano_reviews r join public.mano_tasks t on t.id=r.task_id join public.profiles p on p.id=r.author_id where r.worker_id=p_owner_id and t.status='completed' and p_listing_id is null
 ) all_reviews order by created_at desc,id limit 20;
$$;
create or replace function public.get_profile_trust(p_owner_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare joined timestamptz; services integer; reviews integer; average numeric;
begin
 select created_at into joined from public.profiles where id=p_owner_id; if not found then raise exception 'Perfil no disponible'; end if;
 select (select count(*) from public.service_confirmations c join public.deals d on d.id=c.deal_id where d.seller_id=p_owner_id and d.status='completed' and c.status='confirmed')+(select count(*) from public.mano_tasks t join public.mano_proposals p on p.id=t.selected_proposal_id where p.worker_id=p_owner_id and t.status='completed') into services;
 select count(*),coalesce(avg(rating),0) into reviews,average from (select r.rating from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=p_owner_id and d.status='completed' union all select r.rating from public.mano_reviews r join public.mano_tasks t on t.id=r.task_id where r.worker_id=p_owner_id and t.status='completed') all_reviews;
 return jsonb_build_object('joined_at',joined,'confirmed_services',services,'completed_operations',services,'review_count',reviews,'review_average',round(average,2),'supported_sources',jsonb_build_array('service','need'));
end $$;
create function public.mano_list_threads() returns table(proposal_id uuid,request_id uuid,task_id uuid,request_title text,task_title text,participant_name text,last_message text,last_message_at timestamptz)
language sql stable security definer set search_path='' as $$
 select p.id,r.id,t.id,r.title,t.title,profile.display_name,coalesce(m.body,'Conversación de la solicitud'),coalesce(m.created_at,p.created_at)
 from public.mano_proposals p join public.mano_tasks t on t.id=p.task_id join public.mano_requests r on r.id=t.request_id join public.profiles profile on profile.id=case when auth.uid()=r.owner_id then p.worker_id else r.owner_id end
 left join lateral(select msg.body,msg.created_at from public.mano_messages msg where msg.proposal_id=p.id order by msg.created_at desc,msg.id desc limit 1)m on true
 where auth.uid() in(p.worker_id,r.owner_id) order by coalesce(m.created_at,p.created_at) desc;
$$;
revoke all on function public.mano_list_threads() from public,anon;
grant execute on function public.mano_list_threads() to authenticated;
alter table public.mano_requests add constraint mano_repair_details check (kind<>'repair' or (length(trim(coalesce(repair_item,'')))>0 and length(trim(coalesce(problem_since,'')))>0 and length(trim(coalesce(transport,'')))>0));
alter table public.mano_requests add constraint mano_photo_limit check (cardinality(photos)<=4);
-- Permisos explícitos: no depender de los privilegios predeterminados del servidor.
revoke all on public.mano_requests,public.mano_tasks,public.mano_proposals,public.mano_quote_revisions,public.mano_messages,public.mano_reviews from anon,authenticated;
grant select on public.mano_requests,public.mano_tasks,public.mano_reviews to anon,authenticated;
grant select on public.mano_proposals,public.mano_quote_revisions,public.mano_messages to authenticated;
grant insert on public.mano_messages to authenticated;
