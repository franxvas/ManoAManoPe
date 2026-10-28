create table public.portfolio_works (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 5 and 100),category text not null check(char_length(trim(category)) between 2 and 80),
 description text not null check(char_length(trim(description)) between 20 and 4000), completed_month date not null check(completed_month<=current_date),
 visible boolean not null default true, deal_id uuid references public.deals(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portfolio_media (
 work_id uuid not null references public.portfolio_works(id) on delete cascade, storage_path text primary key,
 kind text not null check(kind in ('work','before','after')),sort_order integer not null check(sort_order between 0 and 5)
);
alter table public.portfolio_works enable row level security;
alter table public.portfolio_media enable row level security;
create policy portfolio_read on public.portfolio_works for select using(visible or owner_id=auth.uid());
create policy portfolio_media_read on public.portfolio_media for select using(exists(select 1 from public.portfolio_works w where w.id=work_id and (w.visible or w.owner_id=auth.uid())));
revoke all on public.portfolio_works,public.portfolio_media from anon,authenticated;
grant select on public.portfolio_works,public.portfolio_media to anon,authenticated;

create function public.allocate_portfolio_id() returns uuid language plpgsql security definer set search_path='' as $$ begin if auth.uid() is null then raise exception 'Inicia sesión'; end if; return gen_random_uuid(); end $$;
create function public.save_portfolio_work(p_id uuid,p_title text,p_category text,p_description text,p_completed_month date,p_visible boolean,p_deal_id uuid,p_media jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); w public.portfolio_works; m jsonb; path text; n integer:=0;
begin
 if owner is null or p_id is null then raise exception 'Inicia sesión'; end if;
 -- Serializa creaciones y cambios aun cuando todavía no existe la fila.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text,0));
 select * into w from public.portfolio_works where id=p_id for update;
 if found and w.owner_id<>owner then raise exception 'No puedes editar el trabajo de otra persona'; end if;
 if p_deal_id is not null and not exists(select 1 from public.deals d join public.service_confirmations c on c.deal_id=d.id where d.id=p_deal_id and d.seller_id=owner and d.status='completed' and c.status='confirmed') then raise exception 'El servicio no está confirmado a tu nombre'; end if;
 if p_media is null or jsonb_typeof(p_media)<>'array' or jsonb_array_length(p_media) not between 1 and 6 then raise exception 'Añade entre una y seis fotos'; end if;
 for m in select value from jsonb_array_elements(p_media) loop
  path:=m->>'path';
  if path is null or path not like owner::text||'/'||p_id::text||'/%' or path like '%..%' or coalesce(m->>'kind','') not in('work','before','after') or not exists(select 1 from storage.objects where bucket_id='portfolio-media' and name=path) then raise exception 'Foto no autorizada o no disponible'; end if;
 end loop;
 insert into public.portfolio_works(id,owner_id,title,category,description,completed_month,visible,deal_id)
 values(p_id,owner,trim(p_title),trim(p_category),trim(p_description),p_completed_month,p_visible,p_deal_id)
 on conflict(id) do update set title=excluded.title,category=excluded.category,description=excluded.description,completed_month=excluded.completed_month,visible=excluded.visible,deal_id=excluded.deal_id,updated_at=now();
 delete from public.portfolio_media where work_id=p_id;
 for m in select value from jsonb_array_elements(p_media) loop
  insert into public.portfolio_media(work_id,storage_path,kind,sort_order) values(p_id,m->>'path',m->>'kind',n);n:=n+1;
 end loop;
 return p_id;
end $$;
create function public.delete_portfolio_work(p_id uuid) returns text[] language plpgsql security definer set search_path='' as $$
declare owner uuid; paths text[];
begin
 select owner_id into owner from public.portfolio_works where id=p_id for update;
 if owner is null or auth.uid() is null or owner<>auth.uid() then raise exception 'Trabajo no disponible'; end if;
 select array_agg(storage_path) into paths from public.portfolio_media where work_id=p_id;
 delete from public.portfolio_works where id=p_id;
 return coalesce(paths,'{}');
end $$;
revoke all on function public.allocate_portfolio_id(),public.save_portfolio_work(uuid,text,text,text,date,boolean,uuid,jsonb),public.delete_portfolio_work(uuid) from public,anon;
grant execute on function public.allocate_portfolio_id(),public.save_portfolio_work(uuid,text,text,text,date,boolean,uuid,jsonb),public.delete_portfolio_work(uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portfolio-media','portfolio-media',false,8388608,array['image/jpeg','image/png','image/webp']);
create policy portfolio_storage_read on storage.objects for select using(bucket_id='portfolio-media' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.portfolio_media m join public.portfolio_works w on w.id=m.work_id where m.storage_path=name and w.visible)));
create policy portfolio_storage_insert on storage.objects for insert to authenticated with check(bucket_id='portfolio-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy portfolio_storage_delete on storage.objects for delete to authenticated using(bucket_id='portfolio-media' and (storage.foldername(name))[1]=auth.uid()::text);

create function public.portfolio_work_confirmed(p_work_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.portfolio_works w join public.deals d on d.id=w.deal_id join public.service_confirmations c on c.deal_id=d.id where w.id=p_work_id and(w.visible or w.owner_id=auth.uid()) and d.seller_id=w.owner_id and d.status='completed' and c.status='confirmed');
$$;
revoke all on function public.portfolio_work_confirmed(uuid) from public;
grant execute on function public.portfolio_work_confirmed(uuid) to anon,authenticated;

create function public.get_my_confirmed_services() returns table(id uuid,title text) language sql stable security definer set search_path='' as $$
 select d.id,l.title from public.deals d join public.service_confirmations c on c.deal_id=d.id join public.listings l on l.id=d.listing_id where auth.uid() is not null and d.seller_id=auth.uid() and d.status='completed' and c.status='confirmed' order by d.completed_at desc limit 50;
$$;
revoke all on function public.get_my_confirmed_services() from public,anon;
grant execute on function public.get_my_confirmed_services() to authenticated;
