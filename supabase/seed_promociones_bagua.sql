-- Promociones para cada vendedor de Bagua según su rubro. Correr después de seed_vendedores_bagua.sql
-- y seed_catalogo_bagua.sql. Se puede correr varias veces sin duplicar.
do $$
declare
  item jsonb;
  seller public.profiles;
  listing_id uuid;
  img constant text := 'https://images.unsplash.com/photo-';
  -- u = id del vendedor, c = categoría (03 restaurantes, 13 ofertas), d = días de vigencia
  promos jsonb := '[
    {"u":"50000000-0000-4000-8000-000000000001","c":"13","d":15,"title":"Pack leche + huevos","desc":"Seis litros de leche fresca y una bandeja de 30 huevos de granja.","price":39,"orig":46,"img":"1582722872445-44dc5f7e3c8f"},
    {"u":"50000000-0000-4000-8000-000000000001","c":"13","d":10,"title":"2 gaseosas de 3 litros","desc":"Llévate dos gaseosas de 3 litros a precio especial para el fin de semana.","price":17,"orig":22,"img":"1554866585-cd94860890b7"},

    {"u":"50000000-0000-4000-8000-000000000002","c":"13","d":20,"title":"Cambio de pantalla + funda gratis","desc":"Al cambiar la pantalla de tu celular te regalamos una funda a tu elección.","price":150,"orig":175,"img":"1512054502232-10a0a035d672"},
    {"u":"50000000-0000-4000-8000-000000000002","c":"13","d":30,"title":"Cargador rápido + power bank","desc":"Combo de cargador rápido 25 W y power bank de 10 000 mAh con garantía.","price":89,"orig":110,"img":"1609091839311-d5365f9ff1c5"},

    {"u":"50000000-0000-4000-8000-000000000003","c":"13","d":30,"title":"Juego de 4 sillas de madera","desc":"Cuatro sillas talladas en madera de la zona, barnizadas y listas para entregar.","price":330,"orig":380,"img":"1503602642458-232111445657"},
    {"u":"50000000-0000-4000-8000-000000000003","c":"13","d":20,"title":"Repisa flotante 2x1","desc":"Lleva dos repisas flotantes de 80 cm por el precio de una y media.","price":90,"orig":120,"img":"1594620302200-9a762244a156"},

    {"u":"50000000-0000-4000-8000-000000000004","c":"03","d":15,"title":"Docena de empanadas + gaseosa","desc":"Doce empanadas de carne recién horneadas con una gaseosa de 3 litros.","price":38,"orig":45,"img":"1601050690597-df0568f70950"},
    {"u":"50000000-0000-4000-8000-000000000004","c":"03","d":30,"title":"Torta de chocolate con 10% menos","desc":"Torta de chocolate por encargo para 20 porciones, pide con dos días de anticipación.","price":72,"orig":80,"img":"1578985545062-69928b1d9587"},

    {"u":"50000000-0000-4000-8000-000000000005","c":"13","d":30,"title":"Mudanza pequeña a precio fijo","desc":"Flete en motocarga dentro de Bagua con ayuda para cargar y descargar.","price":40,"orig":55,"img":"1601628828688-632f38a5a7d0"},

    {"u":"50000000-0000-4000-8000-000000000006","c":"13","d":45,"title":"Uniforme escolar completo","desc":"Camisa, pantalón o falda y chompa a medida. Precio especial por campaña escolar.","price":120,"orig":150,"img":"1503342217505-b0a15ec3261c"},
    {"u":"50000000-0000-4000-8000-000000000006","c":"13","d":30,"title":"10 polos estampados para tu equipo","desc":"Polos de algodón con el nombre y número de cada jugador incluidos.","price":180,"orig":220,"img":"1523381210434-271e8be1f52b"},

    {"u":"50000000-0000-4000-8000-000000000007","c":"13","d":30,"title":"Paquete de 8 clases de matemática","desc":"Ocho clases a domicilio de una hora para secundaria. Primera clase de prueba gratis.","price":160,"orig":200,"img":"1509228468518-180dd4864904"},

    {"u":"50000000-0000-4000-8000-000000000008","c":"13","d":20,"title":"Limpieza profunda de casa","desc":"Limpieza completa de casa de hasta tres habitaciones con mis propios productos.","price":90,"orig":120,"img":"1581578731548-c64695cc6952"},

    {"u":"50000000-0000-4000-8000-000000000009","c":"13","d":30,"title":"Taladro + juego de brocas","desc":"Taladro percutor de 650 W con juego de brocas para concreto y madera.","price":189,"orig":225,"img":"1572981779307-38b8cabb2407"},
    {"u":"50000000-0000-4000-8000-000000000009","c":"13","d":20,"title":"2 galones de pintura látex","desc":"Dos galones de pintura látex blanca para interiores a precio de obra.","price":85,"orig":100,"img":"1562259949-e8e7689d7828"},

    {"u":"50000000-0000-4000-8000-000000000010","c":"03","d":15,"title":"Ceviche para dos + jugo","desc":"Dos platos de ceviche de pescado con una jarra de jugo de frutas de la selva.","price":45,"orig":54,"img":"1535399831218-d5bd36d1a6b3"},

    {"u":"22222222-2222-4222-8222-222222222222","c":"13","d":30,"title":"Puerta de madera con instalación","desc":"Puerta contraplacada de madera con marco e instalación incluida en Bagua.","price":420,"orig":480,"img":"1504148455328-c376907d081c"},

    {"u":"11111111-1111-4111-8111-111111111111","c":"13","d":20,"title":"Mantenimiento de laptop","desc":"Limpieza interna, cambio de pasta térmica y formateo con programas básicos.","price":60,"orig":80,"img":"1511707171634-5f897ff02aa9"}
  ]';
begin
  for item in select value from jsonb_array_elements(promos) loop
    select * into seller from public.profiles where id = (item->>'u')::uuid;
    if not found then continue; end if;
    listing_id := md5(seller.id::text || (item->>'title'))::uuid;
    insert into public.listings (id, owner_id, category_id, type, title, description, price, original_price, negotiable, valid_until,
      address, city, region, latitude, longitude, status)
    values (listing_id, seller.id, ('10000000-0000-4000-8000-0000000000' || (item->>'c'))::uuid, 'promotion',
      item->>'title', item->>'desc', (item->>'price')::numeric, (item->>'orig')::numeric, false, current_date + (item->>'d')::int,
      coalesce((select l.address from public.listings l where l.owner_id = seller.id and l.address is not null limit 1), 'Bagua'),
      'Bagua', 'Amazonas', coalesce(seller.latitude, -5.6393), coalesce(seller.longitude, -78.5325), 'published')
    on conflict (id) do nothing;
    insert into public.listing_media (listing_id, storage_path, public_url, sort_order)
    values (listing_id, 'seed/' || listing_id || '.jpg', img || (item->>'img') || '?w=800&auto=format&fit=crop', 0)
    on conflict (storage_path) do update set public_url = excluded.public_url;
  end loop;
end $$;
