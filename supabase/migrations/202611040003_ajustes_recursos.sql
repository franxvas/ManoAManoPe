drop policy resource_response_insert on public.resource_responses;
create policy resource_response_insert on public.resource_responses for insert to authenticated with check(user_id=auth.uid() and status='pending' and exists(select 1 from public.resource_posts p where p.id=post_id and p.owner_id<>auth.uid() and p.starts_at>now()));
create index service_slots_owner_time on public.service_slots(owner_id,starts_at,ends_at);
create index service_bookings_slot_status on public.service_bookings(slot_id,status);
create index service_bookings_client on public.service_bookings(client_id);
create index resource_responses_post on public.resource_responses(post_id,status);
create index resource_posts_kind_created on public.resource_posts(kind,created_at desc);
create index saved_searches_owner on public.saved_searches(owner_id);
notify pgrst,'reload schema';
