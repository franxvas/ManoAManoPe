insert into public.categories (id, name, slug, type, icon, sort_order) values
  ('10000000-0000-4000-8000-000000000001', 'Tecnología', 'tecnologia', 'product', 'laptop-outline', 10),
  ('10000000-0000-4000-8000-000000000002', 'Carpintería', 'carpinteria', 'service', 'hammer-outline', 20),
  ('10000000-0000-4000-8000-000000000003', 'Restaurantes', 'restaurantes', 'promotion', 'restaurant-outline', 30),
  ('10000000-0000-4000-8000-000000000004', 'Técnicos', 'tecnicos', 'service', 'construct-outline', 40),
  ('10000000-0000-4000-8000-000000000005', 'Ropa', 'ropa', 'product', 'shirt-outline', 50),
  ('10000000-0000-4000-8000-000000000006', 'Transporte', 'transporte', 'service', 'car-outline', 60),
  ('10000000-0000-4000-8000-000000000007', 'Técnicos', 'tecnicos', 'need', 'construct-outline', 70)
on conflict (id) do nothing;

do $$
declare demo_user uuid := '11111111-1111-4111-8111-111111111111'; demo_seller uuid := '22222222-2222-4222-8222-222222222222';
begin
  if not exists (select 1 from auth.users where id = demo_user) then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', demo_user, 'authenticated', 'authenticated', 'demo@manoamano.pe', crypt('Demo12345!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Billy Mark Núñez Sánchez"}', now(), now());
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (demo_user, demo_user, demo_user::text, jsonb_build_object('sub', demo_user::text, 'email', 'demo@manoamano.pe', 'email_verified', true), 'email', now(), now(), now());
  end if;
  if not exists (select 1 from auth.users where id = demo_seller) then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', demo_seller, 'authenticated', 'authenticated', 'vendedor.demo@manoamano.pe', crypt('Demo12345!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Juan Díaz"}', now(), now());
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (demo_seller, demo_seller, demo_seller::text, jsonb_build_object('sub', demo_seller::text, 'email', 'vendedor.demo@manoamano.pe', 'email_verified', true), 'email', now(), now(), now());
  end if;
end $$;

update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

update public.profiles set avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop', profession = 'Profesional TI',
  bio = 'Apasionado por la tecnología y por conectar a las personas de Bagua.', city = 'Bagua', region = 'Amazonas', seller_mode = true,
  verified = true, rating_average = 4.8, rating_count = 24, latitude = -5.6395, longitude = -78.5325,
  service_area = 'Bagua y alrededores', availability = 'Lun–Sáb, 8:00 a 18:00'
where id = '11111111-1111-4111-8111-111111111111';

update public.profiles set avatar_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop', profession = 'Maestro carpintero',
  bio = 'Más de 15 años creando muebles a medida para hogares y negocios.', city = 'Bagua', region = 'Amazonas', seller_mode = true,
  verified = true, rating_average = 4.9, rating_count = 37, latitude = -5.6406, longitude = -78.5348,
  service_area = 'Bagua y alrededores', availability = 'Lun–Sáb, 8:00 a 18:00'
where id = '22222222-2222-4222-8222-222222222222';

insert into public.listings (id, owner_id, category_id, type, title, description, price, original_price, budget, negotiable, condition, service_area, availability, home_service, shipping_available, valid_until, address, city, region, latitude, longitude, status) values
  ('30000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000001', 'product', 'Laptop HP Pavilion', 'Laptop en excelente estado, Ryzen 5, 16 GB RAM y SSD de 512 GB. Incluye cargador original.', 1800, null, null, true, 'Como nuevo', null, null, false, true, null, 'Campus universitario', 'Bagua', 'Amazonas', -5.6388, -78.5312, 'published'),
  ('30000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000002', 'service', 'Carpintería Díaz', 'Muebles a medida, puertas, mesas y trabajos en melamina. Cotización sin compromiso.', 120, null, null, true, null, 'Todo Bagua', 'Lun–Sáb', true, false, null, 'Jr. Amazonas 280', 'Bagua', 'Amazonas', -5.6406, -78.5348, 'published'),
  ('30000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000003', 'promotion', '1/4 de pollo + papas + ensalada', 'Promoción familiar de Pollería El Chalaquito. Válida hasta agotar stock.', 35, 42, null, false, null, null, null, false, false, '2026-12-31', 'Plaza de Armas', 'Bagua', 'Amazonas', -5.6393, -78.5325, 'published'),
  ('30000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000005', 'product', 'Casacas urbanas para dama', 'Nueva colección de casacas urbanas, disponibles en tallas S a XL y varios colores.', 50, null, null, false, 'Nuevo', null, null, false, true, null, 'Mercado Central', 'Bagua', 'Amazonas', -5.6420, -78.5362, 'published')
on conflict (id) do nothing;

insert into public.listing_media (listing_id, storage_path, public_url, sort_order) values
  ('30000000-0000-4000-8000-000000000001', 'demo/laptop.jpg', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop', 0),
  ('30000000-0000-4000-8000-000000000002', 'demo/carpinteria.jpg', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&auto=format&fit=crop', 0),
  ('30000000-0000-4000-8000-000000000003', 'demo/polleria.jpg', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=900&auto=format&fit=crop', 0),
  ('30000000-0000-4000-8000-000000000004', 'demo/ropa.jpg', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&auto=format&fit=crop', 0)
on conflict (storage_path) do nothing;
