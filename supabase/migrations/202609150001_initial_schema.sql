create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;
create extension if not exists unaccent;

create text search configuration public.spanish_unaccent (copy = pg_catalog.spanish);
alter text search configuration public.spanish_unaccent alter mapping for hword, hword_part, word with unaccent, spanish_stem;

create type public.listing_type as enum ('product', 'service', 'promotion', 'need');
create type public.listing_status as enum ('draft', 'published', 'paused', 'sold', 'completed');
create type public.conversation_status as enum ('chatting', 'negotiating', 'offer_sent', 'waiting', 'accepted', 'closed');
create type public.message_type as enum ('text', 'image', 'offer', 'system');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'countered', 'cancelled');
create type public.deal_status as enum ('accepted', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  avatar_url text,
  cover_url text,
  profession text,
  bio text check (char_length(bio) <= 500),
  phone text,
  city text,
  region text,
  seller_mode boolean not null default false,
  verified boolean not null default false,
  rating_average numeric(3,2) not null default 0 check (rating_average between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  service_area text,
  availability text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  type public.listing_type not null,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (type, slug)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  type public.listing_type not null,
  title text not null check (char_length(title) between 5 and 100),
  description text not null check (char_length(description) between 20 and 4000),
  price numeric(12,2) check (price >= 0),
  original_price numeric(12,2) check (original_price >= 0),
  budget numeric(12,2) check (budget >= 0),
  currency char(3) not null default 'PEN',
  negotiable boolean not null default false,
  condition text,
  service_area text,
  availability text,
  home_service boolean not null default false,
  shipping_available boolean not null default false,
  valid_until date,
  address text,
  city text not null,
  region text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  geographic_location extensions.geography(point, 4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography) stored,
  base_search_document tsvector generated always as (to_tsvector('public.spanish_unaccent', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, '') || ' ' || coalesce(region, ''))) stored,
  status public.listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'need' and price is null) or type <> 'need'),
  check ((type <> 'promotion') or (original_price is not null and price is not null and original_price >= price))
);

create table public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status public.conversation_status not null default 'chatting',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id),
  unique (listing_id, buyer_id, seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null default '',
  message_type public.message_type not null default 'text',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (char_length(body) <= 5000)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'PEN',
  status public.offer_status not null default 'pending',
  parent_offer_id uuid references public.offers(id),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id)
);

alter table public.messages add column offer_id uuid references public.offers(id) on delete set null;

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  accepted_offer_id uuid not null unique references public.offers(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  status public.deal_status not null default 'accepted',
  agreed_amount numeric(12,2) not null check (agreed_amount > 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (buyer_id <> seller_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  check (reviewer_id <> reviewed_id),
  unique (deal_id, reviewer_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  device_id text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index listings_geo_idx on public.listings using gist (geographic_location);
create index listings_search_idx on public.listings using gin (base_search_document);
create index listings_feed_idx on public.listings (status, type, created_at desc);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index conversations_participants_idx on public.conversations (buyer_id, seller_id, last_message_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger listings_updated_at before update on public.listings for each row execute function public.set_updated_at();
create trigger push_tokens_updated_at before update on public.push_tokens for each row execute function public.set_updated_at();

create or replace function public.message_updates_conversation() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.conversations set last_message_at = new.created_at where id = new.conversation_id; return new; end;
$$;
create trigger messages_update_conversation after insert on public.messages for each row execute function public.message_updates_conversation();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace view public.listing_feed with (security_invoker = true) as
select l.*, p.display_name as owner_name, p.avatar_url as owner_avatar, p.profession as owner_profession,
       p.verified as owner_verified, p.rating_average as rating,
       l.base_search_document || to_tsvector('public.spanish_unaccent', p.display_name || ' ' || coalesce(p.profession, '')) as search_document,
       coalesce(array_agg(lm.public_url order by lm.sort_order) filter (where lm.id is not null), '{}') as media_urls
from public.listings l
join public.profiles p on p.id = l.owner_id
left join public.listing_media lm on lm.listing_id = l.id
group by l.id, p.id;

create or replace function public.get_nearby_listings(
  p_latitude double precision, p_longitude double precision, p_radius_meters integer default 15000,
  p_listing_type public.listing_type default null, p_category_id uuid default null
) returns table (
  id uuid, owner_id uuid, category_id uuid, type public.listing_type, title text, description text,
  price numeric, original_price numeric, budget numeric, currency char(3), negotiable boolean, condition text,
  service_area text, availability text, home_service boolean, shipping_available boolean, valid_until date,
  address text, city text, region text, latitude double precision, longitude double precision,
  status public.listing_status, created_at timestamptz, owner_name text, owner_avatar text,
  owner_profession text, owner_verified boolean, rating numeric, media_urls text[], distance_meters double precision
) language sql stable security invoker set search_path = '' as $$
  select l.id, l.owner_id, l.category_id, l.type, l.title, l.description, l.price, l.original_price, l.budget,
    l.currency, l.negotiable, l.condition, l.service_area, l.availability, l.home_service, l.shipping_available,
    l.valid_until, l.address, l.city, l.region, l.latitude, l.longitude, l.status, l.created_at,
    p.display_name, p.avatar_url, p.profession, p.verified, p.rating_average,
    coalesce(array_agg(lm.public_url order by lm.sort_order) filter (where lm.id is not null), '{}'),
    extensions.st_distance(l.geographic_location, extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography)
  from public.listings l join public.profiles p on p.id = l.owner_id left join public.listing_media lm on lm.listing_id = l.id
  where l.status = 'published'
    and (p_listing_type is null or l.type = p_listing_type)
    and (p_category_id is null or l.category_id = p_category_id)
    and extensions.st_dwithin(l.geographic_location, extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography, p_radius_meters)
  group by l.id, p.id order by 31 limit 100;
$$;

create or replace function public.open_or_create_conversation(p_listing_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_listing public.listings; v_conversation_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into v_listing from public.listings where id = p_listing_id and status = 'published';
  if not found or v_listing.owner_id = auth.uid() then raise exception 'invalid listing'; end if;
  insert into public.conversations (listing_id, buyer_id, seller_id)
  values (v_listing.id, auth.uid(), v_listing.owner_id)
  on conflict (listing_id, buyer_id, seller_id) do update set last_message_at = public.conversations.last_message_at
  returning id into v_conversation_id;
  return v_conversation_id;
end;
$$;

create or replace function public.respond_to_offer(p_offer_id uuid, p_action text, p_counter_amount numeric default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_offer public.offers; v_conversation public.conversations; v_new_offer_id uuid; v_deal_id uuid;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found or v_offer.status <> 'pending' then raise exception 'offer is no longer pending'; end if;
  if v_offer.receiver_id <> auth.uid() then raise exception 'only the receiver can respond'; end if;
  select * into v_conversation from public.conversations where id = v_offer.conversation_id;
  if auth.uid() not in (v_conversation.buyer_id, v_conversation.seller_id) then raise exception 'not a participant'; end if;
  if p_action = 'accept' then
    update public.offers set status = 'accepted', responded_at = now() where id = v_offer.id;
    insert into public.deals (conversation_id, listing_id, accepted_offer_id, buyer_id, seller_id, agreed_amount)
    values (v_conversation.id, v_offer.listing_id, v_offer.id, v_conversation.buyer_id, v_conversation.seller_id, v_offer.amount)
    returning id into v_deal_id;
    update public.conversations set status = 'accepted', last_message_at = now() where id = v_conversation.id;
    insert into public.messages (conversation_id, body, message_type) values (v_conversation.id, 'Trato Aceptado', 'system');
    insert into public.notifications (user_id, type, title, body, data)
    values (v_offer.sender_id, 'offer_accepted', '¡Trato aceptado!', 'La otra persona aceptó tu oferta.', jsonb_build_object('deal_id', v_deal_id));
    return v_deal_id;
  elsif p_action = 'reject' then
    update public.offers set status = 'rejected', responded_at = now() where id = v_offer.id;
    insert into public.messages (conversation_id, body, message_type) values (v_conversation.id, 'Oferta rechazada', 'system');
    return v_offer.id;
  elsif p_action = 'counter' and p_counter_amount > 0 then
    update public.offers set status = 'countered', responded_at = now() where id = v_offer.id;
    insert into public.offers (conversation_id, listing_id, sender_id, receiver_id, amount, parent_offer_id)
    values (v_offer.conversation_id, v_offer.listing_id, auth.uid(), v_offer.sender_id, p_counter_amount, v_offer.id)
    returning id into v_new_offer_id;
    insert into public.messages (conversation_id, sender_id, body, message_type, offer_id)
    values (v_offer.conversation_id, auth.uid(), p_counter_amount::text, 'offer', v_new_offer_id);
    return v_new_offer_id;
  end if;
  raise exception 'invalid action';
end;
$$;

create or replace function public.send_offer(p_conversation_id uuid, p_amount numeric, p_parent_offer_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_conversation public.conversations; v_receiver uuid; v_offer_id uuid;
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  select * into v_conversation from public.conversations where id = p_conversation_id for update;
  if not found or auth.uid() not in (v_conversation.buyer_id, v_conversation.seller_id) then raise exception 'not a participant'; end if;
  v_receiver := case when auth.uid() = v_conversation.buyer_id then v_conversation.seller_id else v_conversation.buyer_id end;
  if p_parent_offer_id is not null then
    update public.offers set status = 'countered', responded_at = now()
    where id = p_parent_offer_id and receiver_id = auth.uid() and conversation_id = p_conversation_id and status = 'pending';
    if not found then raise exception 'parent offer cannot be countered'; end if;
  end if;
  insert into public.offers (conversation_id, listing_id, sender_id, receiver_id, amount, parent_offer_id)
  values (v_conversation.id, v_conversation.listing_id, auth.uid(), v_receiver, p_amount, p_parent_offer_id)
  returning id into v_offer_id;
  insert into public.messages (conversation_id, sender_id, body, message_type, offer_id)
  values (v_conversation.id, auth.uid(), p_amount::text, 'offer', v_offer_id);
  update public.conversations set status = 'offer_sent', last_message_at = now() where id = v_conversation.id;
  insert into public.notifications (user_id, type, title, body, data)
  values (v_receiver, case when p_parent_offer_id is null then 'offer' else 'counteroffer' end, case when p_parent_offer_id is null then 'Nueva oferta' else 'Nueva contraoferta' end, 'Recibiste una propuesta de S/ ' || p_amount::text, jsonb_build_object('offer_id', v_offer_id, 'conversation_id', v_conversation.id));
  return v_offer_id;
end;
$$;

create or replace function public.refresh_profile_rating() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set rating_average = coalesce((select avg(r.rating) from public.reviews r where r.reviewed_id = new.reviewed_id), 0),
    rating_count = (select count(*) from public.reviews r where r.reviewed_id = new.reviewed_id)
  where id = new.reviewed_id;
  return new;
end;
$$;
create trigger reviews_refresh_rating after insert or update on public.reviews for each row execute function public.refresh_profile_rating();

create or replace function public.complete_deal_and_review(p_conversation_id uuid, p_rating smallint, p_comment text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_deal public.deals; v_reviewed_id uuid; v_review_id uuid;
begin
  if p_rating < 1 or p_rating > 5 then raise exception 'rating must be between 1 and 5'; end if;
  select * into v_deal from public.deals where conversation_id = p_conversation_id for update;
  if not found or auth.uid() not in (v_deal.buyer_id, v_deal.seller_id) then raise exception 'invalid deal'; end if;
  v_reviewed_id := case when auth.uid() = v_deal.buyer_id then v_deal.seller_id else v_deal.buyer_id end;
  update public.deals set status = 'completed', completed_at = coalesce(completed_at, now()) where id = v_deal.id;
  insert into public.reviews (deal_id, reviewer_id, reviewed_id, rating, comment)
  values (v_deal.id, auth.uid(), v_reviewed_id, p_rating, nullif(trim(p_comment), ''))
  returning id into v_review_id;
  insert into public.notifications (user_id, type, title, body, data)
  values (v_reviewed_id, 'review', 'Nueva reseña', 'Recibiste una calificación de ' || p_rating::text || ' estrellas.', jsonb_build_object('review_id', v_review_id));
  return v_review_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;
alter table public.deals enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;

create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "categories are public" on public.categories for select using (active);
create policy "published listings are public" on public.listings for select using (status = 'published' or owner_id = auth.uid());
create policy "users create own listings" on public.listings for insert with check (owner_id = auth.uid());
create policy "owners update listings" on public.listings for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete listings" on public.listings for delete using (owner_id = auth.uid());
create policy "listing media follows listing visibility" on public.listing_media for select using (exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'published' or l.owner_id = auth.uid())));
create policy "owners manage listing media" on public.listing_media for all using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())) with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "users read own favorites" on public.favorites for select using (user_id = auth.uid());
create policy "users add own favorites" on public.favorites for insert with check (user_id = auth.uid());
create policy "users remove own favorites" on public.favorites for delete using (user_id = auth.uid());
create policy "participants read conversations" on public.conversations for select using (auth.uid() in (buyer_id, seller_id));
create policy "participants read messages" on public.messages for select using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "participants send messages" on public.messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "participants mark messages read" on public.messages for update using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id))) with check (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "participants read offers" on public.offers for select using (auth.uid() in (sender_id, receiver_id));
create policy "participants create offers" on public.offers for insert with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "participants read deals" on public.deals for select using (auth.uid() in (buyer_id, seller_id));
create policy "reviews are public" on public.reviews for select using (true);
create policy "deal participants create one review" on public.reviews for insert with check (reviewer_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.status = 'completed' and auth.uid() in (d.buyer_id, d.seller_id) and reviewed_id in (d.buyer_id, d.seller_id) and reviewed_id <> auth.uid()));
create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users mark own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage push tokens" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true), ('listing-media', 'listing-media', true), ('message-media', 'message-media', false) on conflict (id) do nothing;
create policy "public avatar reads" on storage.objects for select using (bucket_id in ('avatars', 'listing-media'));
create policy "users upload own public media" on storage.objects for insert with check (bucket_id in ('avatars', 'listing-media') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own public media" on storage.objects for update using (bucket_id in ('avatars', 'listing-media') and owner_id = auth.uid()::text);
create policy "users delete own public media" on storage.objects for delete using (bucket_id in ('avatars', 'listing-media') and owner_id = auth.uid()::text);
create policy "participants access message media" on storage.objects for select using (bucket_id = 'message-media' and exists (select 1 from public.conversations c where c.id::text = (storage.foldername(name))[1] and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "users upload own message media" on storage.objects for insert with check (bucket_id = 'message-media' and (storage.foldername(name))[2] = auth.uid()::text and exists (select 1 from public.conversations c where c.id::text = (storage.foldername(name))[1] and auth.uid() in (c.buyer_id, c.seller_id)));
create policy "users delete own message media" on storage.objects for delete using (bucket_id = 'message-media' and owner_id = auth.uid()::text);

grant execute on function public.get_nearby_listings(double precision, double precision, integer, public.listing_type, uuid) to anon, authenticated;
grant execute on function public.open_or_create_conversation(uuid) to authenticated;
grant execute on function public.respond_to_offer(uuid, text, numeric) to authenticated;
grant execute on function public.send_offer(uuid, numeric, uuid) to authenticated;
grant execute on function public.complete_deal_and_review(uuid, smallint, text) to authenticated;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.offers;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
