-- Catálogo de productos para los vendedores de seed_vendedores_bagua.sql: cada negocio con varios productos.
-- Correr después de ese archivo. Se puede correr varias veces sin duplicar.
do $$
declare
  item jsonb;
  seller public.profiles;
  listing_id uuid;
  img constant text := 'https://images.unsplash.com/photo-';
  -- url = foto de Wikimedia Commons cuando no hubo una buena en Unsplash.
  -- n = número del vendedor, c = categoría (08 hogar, 09 herramientas, 01 tecnología, 05 ropa, 03 restaurantes, 13 ofertas)
  catalog jsonb := '[
    {"n":9,"t":"product","c":"09","title":"Martillo de carpintero 16 oz","desc":"Mango de fibra antideslizante, cabeza de acero forjado.","price":28,"img":"1586864387967-d02ef85d93e8"},
    {"n":9,"t":"product","c":"09","title":"Clavos de 2 y 3 pulgadas (1 kg)","desc":"Clavos de acero para madera y construcción. Precio por kilo.","price":8,"url":"https://upload.wikimedia.org/wikipedia/commons/8/8e/Nails.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled"},
    {"n":9,"t":"product","c":"09","title":"Cable eléctrico N.º 14 (rollo 100 m)","desc":"Cable THW para instalaciones de casa. También vendemos por metro.","price":160,"url":"https://upload.wikimedia.org/wikipedia/commons/6/6d/Drum_Roll_-_geograph.org.uk_-_1003165.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled"},
    {"n":9,"t":"product","c":"09","title":"Pintura látex blanca (galón)","desc":"Rinde hasta 40 m². Lavable y de secado rápido.","price":45,"img":"1562259949-e8e7689d7828"},
    {"n":9,"t":"product","c":"09","title":"Wincha de 5 metros","desc":"Cinta métrica con freno y clip para el cinturón.","price":15,"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Tape_Measure_25%27_Klein_Tools.jpg/960px-Tape_Measure_25%27_Klein_Tools.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"},
    {"n":9,"t":"product","c":"09","title":"Foco LED de 12 W","desc":"Luz blanca, ahorra hasta 80 % de energía. Garantía de 1 año.","price":9,"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/LED-E27-Light-Bulb-1134.jpg/960px-LED-E27-Light-Bulb-1134.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"},
    {"n":9,"t":"product","c":"09","title":"Candado de seguridad 50 mm","desc":"Candado de bronce con tres llaves.","price":22,"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Brass_padlock_with_key.jpg/960px-Brass_padlock_with_key.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"},

    {"n":1,"t":"product","c":"08","title":"Huevos de granja (bandeja de 30)","desc":"Huevos frescos de la zona, llegan cada mañana.","price":18,"img":"1582722872445-44dc5f7e3c8f"},
    {"n":1,"t":"product","c":"08","title":"Leche fresca (litro)","desc":"Leche de vaca de productores de Bagua.","price":4,"img":"1563636619-e9143da7973b"},
    {"n":1,"t":"product","c":"08","title":"Gaseosas de 3 litros","desc":"Varios sabores, bien heladas.","price":11,"img":"1554866585-cd94860890b7"},
    {"n":1,"t":"product","c":"08","title":"Fideos y pastas (paquete 1 kg)","desc":"Tallarín, spaghetti y canuto.","price":5,"img":"1612929633738-8fe44f7ec841"},
    {"n":1,"t":"product","c":"08","title":"Azúcar rubia (bolsa 5 kg)","desc":"Azúcar de caña, ideal para la casa o el negocio.","price":19,"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Brown_sugar_examples.JPG/960px-Brown_sugar_examples.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"},

    {"n":2,"t":"product","c":"01","title":"Smartphone Android 128 GB","desc":"Equipo nuevo, libre para cualquier operador, con garantía de 6 meses.","price":650,"img":"1511707171634-5f897ff02aa9"},
    {"n":2,"t":"product","c":"01","title":"Fundas y cases para celular","desc":"Modelos para Samsung, Xiaomi, Motorola y iPhone.","price":15,"img":"1601593346740-925612772716"},
    {"n":2,"t":"product","c":"01","title":"Cargador rápido 25 W","desc":"Con cable tipo C. Carga completa en una hora.","price":35,"img":"1583863788434-e58a36330cf0"},
    {"n":2,"t":"product","c":"01","title":"Power bank 10 000 mAh","desc":"Batería portátil con dos salidas USB.","price":55,"img":"1609091839311-d5365f9ff1c5"},

    {"n":4,"t":"product","c":"08","title":"Torta de chocolate por encargo","desc":"Para 15 personas. Hacer pedido con dos días de anticipación.","price":60,"img":"1578985545062-69928b1d9587"},
    {"n":4,"t":"product","c":"08","title":"Cachitos de mantequilla (docena)","desc":"Recién horneados, crujientes por fuera y suaves por dentro.","price":8,"img":"1555507036-ab1f4038808a"},
    {"n":4,"t":"product","c":"08","title":"Empanadas de carne","desc":"Empanadas al horno, precio por unidad.","price":3,"img":"1601050690597-df0568f70950"},

    {"n":10,"t":"promotion","c":"03","title":"Arroz chaufa amazónico","desc":"Con cecina y plátano frito. Promoción de lunes a miércoles.","price":14,"orig":18,"img":"1512058564366-18510be2db19"},
    {"n":10,"t":"product","c":"03","title":"Ceviche de pescado","desc":"Pescado fresco del día con camote y chifles.","price":20,"img":"1535399831218-d5bd36d1a6b3"},
    {"n":10,"t":"product","c":"03","title":"Pollo a la brasa (1/4)","desc":"Con papas fritas y ensalada fresca.","price":16,"img":"1598103442097-8b74394b95c6"},
    {"n":10,"t":"product","c":"03","title":"Jugo de frutas de la selva","desc":"Cocona, maracuyá o camu camu. Vaso grande.","price":6,"img":"1600271886742-f049cd451bba"},

    {"n":6,"t":"product","c":"05","title":"Pantalón jean a medida","desc":"Confeccionamos tu jean en tu talla exacta en tres días.","price":70,"img":"1542272604-787c3835535d"},
    {"n":6,"t":"product","c":"05","title":"Vestidos para ocasiones especiales","desc":"Diseños para fiestas y promociones. Consulta por modelos.","price":120,"img":"1595777457583-95e059d581b8"},
    {"n":6,"t":"product","c":"05","title":"Camisas de vestir","desc":"Camisas de algodón en varios colores y tallas.","price":45,"img":"1596755094514-f87e34085b2c"},

    {"n":3,"t":"product","c":"08","title":"Silla de madera tallada","desc":"Madera de la zona, barnizada. También hacemos juegos de comedor.","price":95,"img":"1503602642458-232111445657"},
    {"n":3,"t":"product","c":"08","title":"Repisa flotante de madera","desc":"80 cm de largo, incluye soportes para instalar.","price":60,"img":"1594620302200-9a762244a156"},
    {"n":3,"t":"product","c":"08","title":"Cama de 2 plazas","desc":"Cama de madera maciza con cabecera. Entrega en Bagua.","price":680,"img":"1505693416388-ac5ce068fe85"}
  ]';
begin
  for item in select value from jsonb_array_elements(catalog) loop
    select * into seller from public.profiles where id = ('50000000-0000-4000-8000-' || lpad(item->>'n', 12, '0'))::uuid;
    if not found then continue; end if;
    listing_id := md5(seller.id::text || (item->>'title'))::uuid;
    insert into public.listings (id, owner_id, category_id, type, title, description, price, original_price, negotiable,
      address, city, region, latitude, longitude, status)
    values (listing_id, seller.id, ('10000000-0000-4000-8000-0000000000' || (item->>'c'))::uuid, (item->>'t')::public.listing_type,
      item->>'title', item->>'desc', (item->>'price')::numeric, (item->>'orig')::numeric, item->>'t' <> 'promotion',
      coalesce((select l.address from public.listings l where l.owner_id = seller.id and l.address is not null limit 1), 'Bagua'), 'Bagua', 'Amazonas', seller.latitude, seller.longitude, 'published')
    on conflict (id) do nothing;
    insert into public.listing_media (listing_id, storage_path, public_url, sort_order)
    values (listing_id, 'seed/' || listing_id || '.jpg', coalesce(item->>'url', img || (item->>'img') || '?w=800&auto=format&fit=crop'), 0)
    on conflict (storage_path) do update set public_url = excluded.public_url;
  end loop;
end $$;
