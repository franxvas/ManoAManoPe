-- Confianza y seguridad (pedido del ingeniero):
-- 1) valoración estable (promedio bayesiano), 2) estado de confianza,
-- 3) denuncias de publicaciones y límite para cuentas nuevas, 4) verificación de identidad.

-- ---------- 1. Valoración estable ----------
-- Con pocas reseñas la nota se acerca a un valor previo (4.0) y se mueve poco.
-- Fórmula: (C*m + suma) / (C + n), con C = 5 reseñas "imaginarias" y m = 4.0.
create or replace function public.stable_rating(p_sum numeric, p_count integer) returns numeric
language sql immutable set search_path = '' as $$
  select case when coalesce(p_count,0) = 0 then 0
              else round((5 * 4.0 + p_sum) / (5 + p_count), 2) end;
$$;

create or replace function public.refresh_profile_rating() returns trigger language plpgsql security definer set search_path='' as $$
declare s numeric; n integer;
begin
 perform 1 from public.profiles where id=new.reviewed_id for update;
 select coalesce(sum(r.rating),0),count(*) into s,n from public.reviews r join public.deals d on d.id=r.deal_id
  where r.reviewed_id=new.reviewed_id and d.status='completed';
 update public.profiles set rating_average=public.stable_rating(s,n),rating_count=n where id=new.reviewed_id;
 return new;
end $$;

update public.profiles p set rating_average=public.stable_rating(x.s,x.n),rating_count=x.n
from (select pr.id,coalesce(sum(r.rating),0) s,count(r.id)::int n from public.profiles pr
      left join public.reviews r on r.reviewed_id=pr.id
      left join public.deals d on d.id=r.deal_id and d.status='completed'
      where r.id is null or d.id is not null group by pr.id) x
where x.id=p.id;

-- ---------- 4. Verificación de identidad ----------
-- Solo se guarda que la cuenta fue verificada y cuándo; nunca el número de DNI (Ley 29733).
alter table public.profiles add column if not exists verified_at timestamptz;

-- ---------- 3. Denuncias de publicaciones ----------
create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('estafa','prohibido','falso','ofensivo','spam','otro')),
  details text check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);
alter table public.listing_reports enable row level security;
revoke all on public.listing_reports from anon, authenticated;

-- Cada usuario reporta una vez; con 3 denuncias distintas la publicación se pausa sola.
create or replace function public.report_listing(p_listing_id uuid, p_reason text, p_details text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare l public.listings; total integer;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para reportar'; end if;
 select * into l from public.listings where id=p_listing_id for update;
 if not found then raise exception 'Publicación no disponible'; end if;
 if l.owner_id=auth.uid() then raise exception 'No puedes reportar tu propia publicación'; end if;
 insert into public.listing_reports(listing_id,reporter_id,reason,details)
  values(p_listing_id,auth.uid(),p_reason,nullif(trim(p_details),''))
  on conflict (listing_id,reporter_id) do nothing;
 if not found then raise exception 'Ya reportaste esta publicación'; end if;
 select count(*) into total from public.listing_reports where listing_id=p_listing_id;
 if total>=3 and l.status='published' then
  update public.listings set status='paused' where id=p_listing_id;
  insert into public.notifications(user_id,type,title,body,data)
   values(l.owner_id,'report','Publicación en revisión','Tu publicación "'||l.title||'" recibió varias denuncias y quedó pausada mientras se revisa.',jsonb_build_object('listing_id',l.id));
 end if;
 return jsonb_build_object('reports',total,'paused',total>=3);
end $$;
revoke all on function public.report_listing(uuid,text,text) from public,anon;
grant execute on function public.report_listing(uuid,text,text) to authenticated;

-- Cuentas nuevas (< 7 días) y sin verificar: máximo 5 publicaciones por día.
create or replace function public.guard_listing_rate() returns trigger language plpgsql security definer set search_path='' as $$
declare p public.profiles; recent integer;
begin
 select * into p from public.profiles where id=new.owner_id;
 if p.verified or p.created_at < now()-interval '7 days' then return new; end if;
 select count(*) into recent from public.listings where owner_id=new.owner_id and created_at > now()-interval '1 day';
 if recent>=5 then raise exception 'Las cuentas nuevas pueden publicar hasta 5 veces por día. Verifica tu identidad para quitar el límite.'; end if;
 return new;
end $$;
drop trigger if exists listings_rate_limit on public.listings;
create trigger listings_rate_limit before insert on public.listings for each row execute function public.guard_listing_rate();
revoke all on function public.guard_listing_rate() from public,anon,authenticated;

-- ---------- 2. Estado de confianza ----------
create or replace function public.get_profile_trust(p_owner_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare pr public.profiles; services integer; ops integer; reviews integer; total numeric; raw numeric; reports integer;
begin
 select * into pr from public.profiles where id=p_owner_id;
 if not found then raise exception 'Perfil no disponible'; end if;
 select count(*) into services from public.service_confirmations c join public.deals d on d.id=c.deal_id
  where d.seller_id=p_owner_id and d.status='completed' and c.status='confirmed';
 select count(*) into ops from public.deals d where p_owner_id in (d.buyer_id,d.seller_id) and d.status='completed';
 select count(*),coalesce(sum(r.rating),0),coalesce(avg(r.rating),0) into reviews,total,raw
  from public.reviews r join public.deals d on d.id=r.deal_id
  where r.reviewed_id=p_owner_id and d.status='completed' and r.reviewer_id in(d.buyer_id,d.seller_id) and r.reviewer_id<>r.reviewed_id;
 select count(distinct rp.reporter_id) into reports from public.listing_reports rp join public.listings l on l.id=rp.listing_id
  where l.owner_id=p_owner_id and rp.created_at > now()-interval '90 days';
 return jsonb_build_object('joined_at',pr.created_at,'confirmed_services',services,'completed_operations',ops,
  'review_count',reviews,'review_average',public.stable_rating(total,reviews),'raw_average',round(raw,2),
  'verified',pr.verified,'verified_at',pr.verified_at,'recent_reports',reports,
  'supported_sources',jsonb_build_array('service','product'));
end $$;
revoke all on function public.get_profile_trust(uuid) from public;
grant execute on function public.get_profile_trust(uuid) to anon,authenticated;
