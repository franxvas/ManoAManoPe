-- Datos de ejemplo de la parte 2 (guardados y reseñas). Solo usa las cuentas demo y se puede correr varias veces.
-- demo@manoamano.pe = 1111...  ·  vendedor.demo@manoamano.pe = 2222...

-- Guardados de la cuenta demo: algo de cada sección.
insert into public.saved_items(user_id, item_type, item_id)
select '11111111-1111-4111-8111-111111111111'::uuid, 'listing', id from (select id from public.listings where status = 'published' order by created_at desc limit 4) l
union all select '11111111-1111-4111-8111-111111111111', 'donation', id from public.donations
union all select '11111111-1111-4111-8111-111111111111', 'adoption', id from public.adoptions
union all select '11111111-1111-4111-8111-111111111111', 'event', id from public.community_events
on conflict do nothing;

-- Guardados de la cuenta vendedor.
insert into public.saved_items(user_id, item_type, item_id)
select '22222222-2222-4222-8222-222222222222'::uuid, 'listing', id
from (select id from public.listings where owner_id <> '22222222-2222-4222-8222-222222222222' and status = 'published' order by created_at limit 3) l
on conflict do nothing;

-- Un servicio terminado entre las dos cuentas demo, con reseñas de ambos lados para que el perfil muestre reputación.
insert into public.conversations(id, listing_id, buyer_id, seller_id, status)
select 'c0000000-0000-4000-8000-000000000001', id, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'closed'
from public.listings where owner_id = '22222222-2222-4222-8222-222222222222' and type = 'service' limit 1
on conflict do nothing;

insert into public.offers(id, conversation_id, listing_id, sender_id, receiver_id, amount, status, responded_at)
select 'a0000000-0000-4000-8000-000000000001', c.id, c.listing_id, c.buyer_id, c.seller_id, 120, 'accepted', now() - interval '6 days'
from public.conversations c where c.id = 'c0000000-0000-4000-8000-000000000001'
on conflict do nothing;

insert into public.deals(id, conversation_id, listing_id, accepted_offer_id, buyer_id, seller_id, status, agreed_amount, completed_at)
select 'd0000000-0000-4000-8000-000000000001', c.id, c.listing_id, 'a0000000-0000-4000-8000-000000000001', c.buyer_id, c.seller_id, 'completed', 120, now() - interval '5 days'
from public.conversations c where c.id = 'c0000000-0000-4000-8000-000000000001'
on conflict do nothing;

-- La regla de reseñas pide que quien reseña sea el usuario de la sesión.
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
insert into public.reviews(deal_id, reviewer_id, reviewed_id, rating, comment)
select 'd0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 5,
  'Muy puntual y dejó todo funcionando. Lo recomiendo.'
where exists (select 1 from public.deals where id = 'd0000000-0000-4000-8000-000000000001')
  and not exists (select 1 from public.reviews where deal_id = 'd0000000-0000-4000-8000-000000000001' and reviewer_id = '11111111-1111-4111-8111-111111111111');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
insert into public.reviews(deal_id, reviewer_id, reviewed_id, rating, comment)
select 'd0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 5,
  'Cliente amable y claro con lo que necesitaba.'
where exists (select 1 from public.deals where id = 'd0000000-0000-4000-8000-000000000001')
  and not exists (select 1 from public.reviews where deal_id = 'd0000000-0000-4000-8000-000000000001' and reviewer_id = '22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claims', '', true);
