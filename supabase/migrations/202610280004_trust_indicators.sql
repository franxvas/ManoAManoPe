create function public.get_profile_trust(p_owner_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare joined timestamptz; services integer; reviews integer; average numeric;
begin
 select created_at into joined from public.profiles where id=p_owner_id;
 if not found then raise exception 'Perfil no disponible'; end if;
 select count(*) into services from public.service_confirmations c join public.deals d on d.id=c.deal_id where d.seller_id=p_owner_id and d.status='completed' and c.status='confirmed';
 select count(*),coalesce(avg(r.rating),0) into reviews,average from public.reviews r join public.deals d on d.id=r.deal_id where r.reviewed_id=p_owner_id and d.status='completed' and r.reviewer_id in(d.buyer_id,d.seller_id) and r.reviewed_id in(d.buyer_id,d.seller_id) and r.reviewer_id<>r.reviewed_id;
 return jsonb_build_object('joined_at',joined,'confirmed_services',services,'completed_operations',services,'review_count',reviews,'review_average',round(average,2),'supported_sources',jsonb_build_array('service'));
end $$;
revoke all on function public.get_profile_trust(uuid) from public;
grant execute on function public.get_profile_trust(uuid) to anon,authenticated;
