create table public.resource_posts (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references public.profiles(id),
 kind text not null check(kind in('loan','rental')),title text not null check(char_length(trim(title)) between 5 and 100),
 description text not null check(char_length(trim(description)) between 10 and 2000), zone text not null check(char_length(zone)>2),
 starts_at timestamptz not null,ends_at timestamptz not null,price numeric not null default 0 check(price>=0),
 unit text not null default 'dia' check(unit in('hora','dia')),deposit numeric not null default 0 check(deposit>=0),
 photos text[] not null default '{}',created_at timestamptz not null default now(),check(ends_at>starts_at),check(kind<>'loan' or price=0)
);
alter table public.resource_posts enable row level security;
create policy resource_read on public.resource_posts for select using(true);
create policy resource_create on public.resource_posts for insert to authenticated with check(owner_id=auth.uid() and starts_at>now());
create policy resource_delete on public.resource_posts for delete to authenticated using(owner_id=auth.uid());
grant select on public.resource_posts to anon,authenticated;
grant insert,delete on public.resource_posts to authenticated;
create table public.resource_responses (
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.resource_posts(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.profiles(id),message text not null check(char_length(trim(message)) between 5 and 1000),
 status text not null default 'pending' check(status in('pending','accepted','declined','delivered','completed','cancelled')),unique(post_id,user_id)
);
alter table public.resource_responses enable row level security;
create policy resource_response_read on public.resource_responses for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.resource_posts p where p.id=post_id and p.owner_id=auth.uid()));
create policy resource_response_insert on public.resource_responses for insert to authenticated with check(user_id=auth.uid() and status='pending' and exists(select 1 from public.resource_posts p where p.id=post_id and p.owner_id<>auth.uid() and p.starts_at>now()) and not exists(select 1 from public.resource_responses r where r.post_id=post_id and r.status in('accepted','delivered')));
grant select,insert on public.resource_responses to authenticated;
create function public.change_resource_response(p_response uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare r public.resource_responses;p public.resource_posts;provider uuid;receiver uuid;
begin
 select p0.* into p from public.resource_posts p0 join public.resource_responses r0 on r0.post_id=p0.id where r0.id=p_response for update of p0;
 select * into r from public.resource_responses where id=p_response for update;
 if not found or auth.uid() is null or auth.uid() not in(p.owner_id,r.user_id) then raise exception 'Acuerdo no disponible';end if;
 provider:=case when p.kind='loan' then r.user_id else p.owner_id end;receiver:=case when p.kind='loan' then p.owner_id else r.user_id end;
 if p_action='accept' then
  if auth.uid()<>p.owner_id or r.status<>'pending' or exists(select 1 from public.resource_responses where post_id=p.id and status in('accepted','delivered','completed')) then raise exception 'Ya hay un acuerdo o la respuesta no está disponible';end if;
  update public.resource_responses set status=case when id=r.id then 'accepted' else 'declined' end where post_id=p.id and status='pending';
 elsif p_action='deliver' and auth.uid()=provider and r.status='accepted' then update public.resource_responses set status='delivered' where id=r.id;
 elsif p_action='return' and auth.uid()=provider and r.status='delivered' then update public.resource_responses set status='completed' where id=r.id;
 elsif p_action='cancel' and r.status in('pending','accepted') then update public.resource_responses set status='cancelled' where id=r.id;
 else raise exception 'No se puede realizar esta acción en el estado actual';end if;
end $$;
revoke all on function public.change_resource_response(uuid,text) from public,anon;
grant execute on function public.change_resource_response(uuid,text) to authenticated;
notify pgrst,'reload schema';
