-- Vendedores de ejemplo en Bagua. Son personas y negocios inventados, ubicados en zonas reales de la ciudad.
-- Contraseña de todas las cuentas: Demo12345!  ·  Se puede correr varias veces sin duplicar.
do $$
declare
  s jsonb;
  l jsonb;
  uid uuid;
  img text := 'https://images.unsplash.com/photo-';
  sellers jsonb := '[
    {"n":1,"name":"Rosa Huamán","email":"rosa.bodega@demo.manoamano.pe","job":"Bodega Rosita","bio":"Abarrotes y productos de primera necesidad en el barrio de siempre.","addr":"Jr. Ayacucho, cerca a la Plaza de Armas","lat":-5.6389,"lng":-78.5331,"avatar":"1494790108377-be9c29b29330",
     "items":[{"t":"product","c":"08","title":"Canasta básica familiar","desc":"Arroz, azúcar, aceite, fideos y menestras para la semana. Precio por canasta.","price":45,"img":"1542838132-92c53300491e"},
              {"t":"promotion","c":"13","title":"Arroz 5 kg + aceite 1 L","desc":"Combo económico para el hogar. Válido mientras haya stock.","price":32,"orig":38,"img":"1586201375761-83865001e31c"}]},
    {"n":2,"name":"Pedro Ramírez","email":"pedro.celulares@demo.manoamano.pe","job":"Técnico en celulares","bio":"Reparo celulares y tablets con repuestos de calidad y garantía.","addr":"Jr. Amazonas, cuadra 3","lat":-5.6402,"lng":-78.5343,"avatar":"1507003211169-0a1dd7228f2d",
     "items":[{"t":"service","c":"04","title":"Reparación de celulares y cambio de pantalla","desc":"Cambio de pantalla, batería y pin de carga. Diagnóstico gratis.","price":60,"img":"1512054502232-10a0a035d672"},
              {"t":"product","c":"01","title":"Audífonos y cargadores originales","desc":"Accesorios para Android y iPhone con garantía de 3 meses.","price":25,"img":"1505740420928-5e560c06d30e"}]},
    {"n":3,"name":"Luis Tapia","email":"luis.carpinteria@demo.manoamano.pe","job":"Maestro carpintero","bio":"Más de 10 años haciendo muebles de madera para casas y negocios.","addr":"Av. Héroes del Cenepa","lat":-5.6421,"lng":-78.5298,"avatar":"1506794778202-cad84cf45f1d",
     "items":[{"t":"service","c":"02","title":"Muebles de madera a medida","desc":"Roperos, mesas, puertas y reposteros. Cotización a domicilio sin costo.","price":250,"img":"1504148455328-c376907d081c"}]},
    {"n":4,"name":"Carmen Silva","email":"carmen.panaderia@demo.manoamano.pe","job":"Panadería Doña Carmen","bio":"Pan calientito todas las mañanas desde las 6 a. m.","addr":"Cerca al Mercado Central","lat":-5.6417,"lng":-78.5360,"avatar":"1544005313-94ddf0286df2",
     "items":[{"t":"promotion","c":"03","title":"Desayuno: pan con café","desc":"Dos panes con mantequilla y un café pasado. Lunes a sábado hasta las 10 a. m.","price":5,"orig":7,"img":"1495474472287-4d71bcdd2085"},
              {"t":"product","c":"08","title":"Pan de yema y chancay","desc":"Pan recién horneado, por docena.","price":6,"img":"1509440159596-0249088772ff"}]},
    {"n":5,"name":"Jorge Vásquez","email":"jorge.fletes@demo.manoamano.pe","job":"Fletes en motocarga","bio":"Llevo tus cosas por toda Bagua y alrededores, rápido y seguro.","addr":"Jr. Bolognesi","lat":-5.6376,"lng":-78.5352,"avatar":"1539571696357-5a69c17a67c6",
     "items":[{"t":"service","c":"06","title":"Fletes y mudanzas pequeñas","desc":"Motocarga para muebles, electrodomésticos y mercadería. Precio por viaje dentro de la ciudad.","price":30,"img":"1601628828688-632f38a5a7d0"}]},
    {"n":6,"name":"Milagros Chávez","email":"milagros.confecciones@demo.manoamano.pe","job":"Confecciones Milagros","bio":"Uniformes escolares y polos personalizados para equipos y empresas.","addr":"Jr. Dos de Mayo","lat":-5.6409,"lng":-78.5317,"avatar":"1534528741775-53994a69daeb",
     "items":[{"t":"product","c":"05","title":"Uniformes escolares a medida","desc":"Camisa, pantalón o falda. Tallas para inicial, primaria y secundaria.","price":60,"img":"1503342217505-b0a15ec3261c"},
              {"t":"product","c":"05","title":"Polos estampados para equipos","desc":"Mínimo 6 unidades. Incluye nombre y número.","price":20,"img":"1523381210434-271e8be1f52b"}]},
    {"n":7,"name":"Diego Fernández","email":"diego.clases@demo.manoamano.pe","job":"Profesor de matemática","bio":"Ayudo a escolares a preparar exámenes y entender la matemática sin estrés.","addr":"Urb. Pueblo Nuevo","lat":-5.6362,"lng":-78.5290,"avatar":"1519085360753-af0119f7cbe7",
     "items":[{"t":"service","c":"10","title":"Clases de matemática para colegio","desc":"Primaria y secundaria. En tu casa o virtual. Precio por hora.","price":25,"img":"1509228468518-180dd4864904"}]},
    {"n":8,"name":"Sonia Pérez","email":"sonia.limpieza@demo.manoamano.pe","job":"Limpieza de hogares","bio":"Limpieza profunda de casas y oficinas, con mis propios productos.","addr":"Jr. Sargento Lores","lat":-5.6433,"lng":-78.5335,"avatar":"1438761681033-6461ffad8d80",
     "items":[{"t":"service","c":"11","title":"Limpieza de casas y oficinas","desc":"Medio día de limpieza general. Incluye productos.","price":50,"img":"1581578731548-c64695cc6952"}]},
    {"n":9,"name":"Ricardo Núñez","email":"ricardo.ferreteria@demo.manoamano.pe","job":"Ferretería El Constructor","bio":"Herramientas y materiales de construcción con precios de mayorista.","addr":"Av. Mariscal Castilla","lat":-5.6380,"lng":-78.5372,"avatar":"1500648767791-00dcc994a43e",
     "items":[{"t":"product","c":"09","title":"Taladro percutor 650 W","desc":"Nuevo, con maletín y juego de brocas. Garantía de 1 año.","price":180,"img":"1572981779307-38b8cabb2407"}]},
    {"n":10,"name":"Ana Mendoza","email":"ana.restaurante@demo.manoamano.pe","job":"Restaurante Sabor Amazónico","bio":"Comida casera de la región: juane, tacacho y menú del día.","addr":"Jr. Ayacucho, cuadra 5","lat":-5.6398,"lng":-78.5308,"avatar":"1580489944761-15a19d654956",
     "items":[{"t":"promotion","c":"03","title":"Menú del día con refresco","desc":"Entrada, segundo y refresco de la casa. De lunes a sábado.","price":10,"orig":12,"img":"1546069901-ba9599a7e63c"}]}
  ]';
begin
  for s in select value from jsonb_array_elements(sellers) loop
    uid := ('50000000-0000-4000-8000-' || lpad(s->>'n', 12, '0'))::uuid;
    if not exists (select 1 from auth.users where id = uid) then
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', s->>'email', crypt('Demo12345!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', s->>'name'), now(), now());
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (uid, uid, uid::text, jsonb_build_object('sub', uid::text, 'email', s->>'email', 'email_verified', true), 'email', now(), now(), now());
    end if;

    update public.profiles set
      display_name = s->>'name', profession = s->>'job', bio = s->>'bio', city = 'Bagua', region = 'Amazonas',
      avatar_url = img || (s->>'avatar') || '?w=300&auto=format&fit=crop',
      latitude = (s->>'lat')::float, longitude = (s->>'lng')::float, service_area = 'Bagua', seller_mode = true
    where id = uid;

    for l in select value from jsonb_array_elements(s->'items') with ordinality as x(value, i) loop
      insert into public.listings (id, owner_id, category_id, type, title, description, price, original_price, negotiable,
        address, city, region, latitude, longitude, status)
      values (
        md5(uid::text || (l->>'title'))::uuid, uid, ('10000000-0000-4000-8000-0000000000' || (l->>'c'))::uuid, (l->>'t')::public.listing_type,
        l->>'title', l->>'desc', (l->>'price')::numeric, (l->>'orig')::numeric, l->>'t' <> 'promotion',
        s->>'addr', 'Bagua', 'Amazonas', (s->>'lat')::float, (s->>'lng')::float, 'published')
      on conflict (id) do nothing;
      insert into public.listing_media (listing_id, storage_path, public_url, sort_order)
      values (md5(uid::text || (l->>'title'))::uuid, 'seed/' || md5(uid::text || (l->>'title')) || '.jpg',
        img || (l->>'img') || '?w=800&auto=format&fit=crop', 0)
      on conflict (storage_path) do nothing;
    end loop;
  end loop;
end $$;
