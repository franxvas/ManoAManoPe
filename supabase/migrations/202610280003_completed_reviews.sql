-- Reseñas inmutables en la interfaz: no se editan ni se eliminan por sus autores.
revoke insert,update,delete on public.reviews from anon,authenticated;
grant select on public.reviews to anon,authenticated;
-- Evita que una edición normal del perfil falsifique reputación o identidad.
revoke update on public.profiles from anon,authenticated;
grant update(display_name,avatar_url,cover_url,profession,bio,phone,city,region,seller_mode,latitude,longitude,service_area,availability) on public.profiles to authenticated;
create function public.guard_completed_review() returns trigger language plpgsql security definer set search_path='' as $$
declare d public.deals;
begin
 select * into d from public.deals where id=new.deal_id for update;
 if not found or auth.uid() is null or new.reviewer_id<>auth.uid() or auth.uid() not in(d.buyer_id,d.seller_id) or d.status<>'completed' or new.reviewed_id=auth.uid() or new.reviewed_id not in(d.buyer_id,d.seller_id) then raise exception 'La reseña requiere una operación completada entre sus participantes'; end if;
 return new;
end $$;
create trigger validate_completed_review before insert on public.reviews for each row execute function public.guard_completed_review();
create or replace function public.refresh_profile_rating() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where id=new.reviewed_id for update;
 update public.profiles set rating_average=coalesce((select avg(r.rating) from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=new.reviewed_id and d.status='completed'),0),
 rating_count=(select count(*) from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=new.reviewed_id and d.status='completed') where id=new.reviewed_id;
 return new;
end $$;
update public.profiles p set rating_average=coalesce((select avg(r.rating) from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=p.id and d.status='completed'),0),rating_count=(select count(*) from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=p.id and d.status='completed');
create function public.get_review_context(p_conversation_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare d public.deals;
begin
 select * into d from public.deals where conversation_id=p_conversation_id;
 if not found or auth.uid() is null or auth.uid() not in(d.buyer_id,d.seller_id) then raise exception 'Operación no disponible'; end if;
 return jsonb_build_object('completed',d.status='completed','reviewed',exists(select 1 from public.reviews r where r.deal_id=d.id and r.reviewer_id=auth.uid()));
end $$;
create function public.list_public_reviews(p_owner_id uuid,p_listing_id uuid default null) returns table(id uuid,rating smallint,comment text,reviewer_name text,operation_type public.listing_type,created_at timestamptz)
language sql stable security definer set search_path='' as $$
 select r.id,r.rating,r.comment,p.display_name,l.type,r.created_at from public.reviews r join public.deals d on d.id=r.deal_id join public.listings l on l.id=d.listing_id join public.profiles p on p.id=r.reviewer_id
 where r.reviewed_id=p_owner_id and d.status='completed' and(p_listing_id is null or d.listing_id=p_listing_id) order by r.created_at desc,r.id limit 20;
$$;
revoke all on function public.guard_completed_review(),public.refresh_profile_rating(),public.get_review_context(uuid) from public,anon;
grant execute on function public.get_review_context(uuid) to authenticated;
revoke all on function public.list_public_reviews(uuid,uuid) from public;
grant execute on function public.list_public_reviews(uuid,uuid) to anon,authenticated;
