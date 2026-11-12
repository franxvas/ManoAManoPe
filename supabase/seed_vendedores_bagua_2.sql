-- Segunda tanda de vendedores de ejemplo en Bagua capital, con productos, servicios y promociones.
-- Personas y negocios inventados, en calles reales de la ciudad. Correr después de seed_vendedores_bagua.sql.
-- Contraseña de todas las cuentas: Demo12345!  ·  Se puede correr varias veces sin duplicar.
do $$
declare
  s jsonb;
  l jsonb;
  uid uuid;
  img text := 'https://images.unsplash.com/photo-';
  -- c = categoría (01 tecnología, 02 carpintería, 03 restaurantes, 04 técnicos, 05 ropa, 06 transporte, 08 hogar,
  --     09 herramientas, 10 clases, 11 limpieza, 12 ofertas de servicios, 13 ofertas de productos)
  sellers jsonb := '[
    {"n":11,"name":"Rosa Guevara","email":"frutas.selva@demo.manoamano.pe","job":"Frutería Frutas de la Selva","bio":"Frutas frescas de la zona: plátano, piña, cocona y camu camu. Jugos al paso.","addr":"Mercado Modelo de Bagua, puesto 24","lat":-5.6395,"lng":-78.5322,"avatar":"1494790108377-be9c29b29330",
     "items":[{"t":"product","c":"13","title":"Canasta de frutas de la selva","desc":"Piña, plátano, cocona, maracuyá y papaya. Ideal para regalar o para la semana.","price":30,"img":"1542838132-92c53300491e"},
              {"t":"product","c":"03","title":"Jugo de camu camu (1 litro)","desc":"Jugo natural de camu camu con poca azúcar, rico en vitamina C.","price":8,"img":"1600271886742-f049cd451bba"},
              {"t":"promotion","c":"13","title":"2 jugos de fruta por S/ 10","desc":"Elige dos jugos de fruta natural de medio litro. Todos los días hasta las 12 m.","price":10,"orig":14,"img":"1600271886742-f049cd451bba"}]},

    {"n":12,"name":"Manuel Rojas","email":"cevicheria.utcubamba@demo.manoamano.pe","job":"Cevichería El Utcubamba","bio":"Ceviche de pescado de río y platos marinos. Atendemos de 11 a. m. a 4 p. m.","addr":"Jr. Ayacucho 412","lat":-5.6386,"lng":-78.5340,"avatar":"1507003211169-0a1dd7228f2d",
     "items":[{"t":"product","c":"03","title":"Ceviche de doncella","desc":"Ceviche de pescado doncella con camote, choclo y cancha. Porción para una persona.","price":22,"img":"1535399831218-d5bd36d1a6b3"},
              {"t":"product","c":"03","title":"Chaufa de mariscos","desc":"Arroz chaufa con mariscos frescos y tortilla. Porción abundante.","price":20,"img":"1512058564366-18510be2db19"},
              {"t":"promotion","c":"03","title":"Dúo marino para dos","desc":"Un ceviche y un chaufa de mariscos para compartir, con dos refrescos de la casa.","price":38,"orig":46,"img":"1535399831218-d5bd36d1a6b3"},
              {"t":"service","c":"03","title":"Delivery de comida en Bagua","desc":"Llevamos tu pedido a cualquier punto del centro de Bagua en 30 minutos.","price":3,"img":"1512058564366-18510be2db19"}]},

    {"n":13,"name":"Jhonatan Mego","email":"celubagua@demo.manoamano.pe","job":"Tienda CeluBagua","bio":"Celulares libres, accesorios originales y servicio técnico con garantía.","addr":"Jr. Comercio 230","lat":-5.6400,"lng":-78.5327,"avatar":"1506794778202-cad84cf45f1d",
     "items":[{"t":"product","c":"01","title":"Celular Android 64 GB libre","desc":"Equipo nuevo en caja, libre para cualquier operador. Garantía de 6 meses.","price":549,"img":"1511707171634-5f897ff02aa9"},
              {"t":"product","c":"01","title":"Audífonos inalámbricos","desc":"Audífonos bluetooth con estuche de carga y 20 horas de batería.","price":79,"img":"1505740420928-5e560c06d30e"},
              {"t":"service","c":"04","title":"Cambio de batería de celular","desc":"Cambiamos la batería de tu celular en una hora. Batería original con garantía.","price":60,"img":"1512054502232-10a0a035d672"},
              {"t":"promotion","c":"13","title":"Celular + funda + mica de regalo","desc":"Llévate el celular Android 64 GB con funda y mica de vidrio templado incluidas.","price":519,"orig":579,"img":"1601593346740-925612772716"}]},

    {"n":14,"name":"Wilmer Cieza","email":"maderafina@demo.manoamano.pe","job":"Mueblería Madera Fina","bio":"Muebles de madera de la región hechos a pedido. Entrega e instalación en Bagua.","addr":"Av. Héroes del Cenepa 815","lat":-5.6428,"lng":-78.5305,"avatar":"1500648767791-00dcc994a43e",
     "items":[{"t":"product","c":"08","title":"Juego de comedor de 6 sillas","desc":"Mesa de madera tornillo con seis sillas tapizadas. Hecho a pedido en 15 días.","price":1450,"img":"1503602642458-232111445657"},
              {"t":"product","c":"08","title":"Cama de madera de 1 1/2 plaza","desc":"Cama de madera maciza con cabecera tallada. Incluye tablas.","price":520,"img":"1505693416388-ac5ce068fe85"},
              {"t":"service","c":"02","title":"Reparación y barnizado de muebles","desc":"Arreglamos sillas, mesas y roperos. Lijado y barnizado a domicilio.","price":80,"img":"1504148455328-c376907d081c"},
              {"t":"promotion","c":"13","title":"Repisas flotantes 3x2","desc":"Lleva tres repisas flotantes de 60 cm y paga solo dos. Incluye soportes.","price":100,"orig":150,"img":"1594620302200-9a762244a156"}]},

    {"n":15,"name":"Karina Vílchez","email":"moda.amazonica@demo.manoamano.pe","job":"Boutique Moda Amazónica","bio":"Ropa para dama y caballero, nuevas colecciones cada mes.","addr":"Jr. Bolognesi 318","lat":-5.6391,"lng":-78.5356,"avatar":"1534528741775-53994a69daeb",
     "items":[{"t":"product","c":"05","title":"Vestido casual de verano","desc":"Vestido fresco de algodón, tallas S a XL, varios colores.","price":65,"img":"1595777457583-95e059d581b8"},
              {"t":"product","c":"05","title":"Jean clásico para caballero","desc":"Jean de corte recto, tela gruesa. Tallas 28 a 38.","price":75,"img":"1542272604-787c3835535d"},
              {"t":"product","c":"05","title":"Camisa manga larga a cuadros","desc":"Camisa de algodón para el trabajo o salir. Tallas S a XL.","price":49,"img":"1596755094514-f87e34085b2c"},
              {"t":"promotion","c":"13","title":"Segunda prenda a mitad de precio","desc":"Compra cualquier prenda y la segunda te sale a mitad de precio. Válido de lunes a jueves.","price":37,"orig":75,"img":"1542272604-787c3835535d"}]},

    {"n":16,"name":"Lucía Fernández","email":"dulce.bagua@demo.manoamano.pe","job":"Pastelería Dulce Bagua","bio":"Tortas, bocaditos y panes dulces para toda ocasión. Pedidos con un día de anticipación.","addr":"Jr. Arica 145","lat":-5.6410,"lng":-78.5348,"avatar":"1544005313-94ddf0286df2",
     "items":[{"t":"product","c":"03","title":"Torta tres leches (20 porciones)","desc":"Torta tres leches decorada con fruta. Personaliza el mensaje.","price":75,"img":"1578985545062-69928b1d9587"},
              {"t":"product","c":"03","title":"Bocaditos para fiesta (cien unidades)","desc":"Empanaditas, alfajores y cachitos para cumpleaños y reuniones.","price":90,"img":"1555507036-ab1f4038808a"},
              {"t":"promotion","c":"03","title":"Torta + 50 bocaditos","desc":"Combo para cumpleaños: torta de chocolate de 20 porciones y 50 bocaditos surtidos.","price":115,"orig":135,"img":"1578985545062-69928b1d9587"}]},

    {"n":17,"name":"Edwin Ruiz","email":"electricos.ruiz@demo.manoamano.pe","job":"Servicios Eléctricos Ruiz","bio":"Electricista con 12 años de experiencia. Instalaciones en casas y negocios.","addr":"Jr. Grau 506","lat":-5.6370,"lng":-78.5315,"avatar":"1519085360753-af0119f7cbe7",
     "items":[{"t":"service","c":"04","title":"Instalación eléctrica de vivienda","desc":"Cableado, tomacorrientes, interruptores y tablero. Presupuesto sin costo.","price":350,"img":"1572981779307-38b8cabb2407"},
              {"t":"service","c":"04","title":"Revisión de cortocircuitos","desc":"Detectamos fallas eléctricas y cambiamos llaves térmicas el mismo día.","price":50,"img":"1586864387967-d02ef85d93e8"},
              {"t":"promotion","c":"12","title":"Instalación de 5 focos LED","desc":"Instalamos cinco focos LED de 12 W en tu casa, focos incluidos.","price":70,"orig":95,"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/LED-E27-Light-Bulb-1134.jpg/960px-LED-E27-Light-Bulb-1134.jpg"}]},

    {"n":18,"name":"Patricia Bustamante","email":"ingles.bagua@demo.manoamano.pe","job":"Profesora de inglés","bio":"Licenciada en educación. Clases de inglés para niños, escolares y adultos.","addr":"Jr. Ica 220","lat":-5.6415,"lng":-78.5325,"avatar":"1580489944761-15a19d654956",
     "items":[{"t":"service","c":"10","title":"Clases de inglés para escolares","desc":"Refuerzo de inglés para primaria y secundaria, a domicilio o virtual.","price":30,"img":"1509228468518-180dd4864904"},
              {"t":"service","c":"10","title":"Inglés básico para adultos","desc":"Curso de conversación básica para el trabajo y los viajes. Grupos pequeños.","price":120,"img":"1509228468518-180dd4864904"},
              {"t":"promotion","c":"12","title":"Mes de clases de inglés con 20% menos","desc":"Ocho clases de una hora en el mes. Matrícula gratis para nuevos alumnos.","price":160,"orig":200,"img":"1509228468518-180dd4864904"}]},

    {"n":19,"name":"Segundo Díaz","email":"transportes.rapido@demo.manoamano.pe","job":"Transportes El Rápido","bio":"Mototaxi y carga ligera en Bagua, La Peca y Morerillo.","addr":"Av. Mesones Muro 640","lat":-5.6358,"lng":-78.5348,"avatar":"1539571696357-5a69c17a67c6",
     "items":[{"t":"service","c":"06","title":"Carga ligera en motocarga","desc":"Traslado de compras, materiales y muebles pequeños dentro de Bagua.","price":15,"img":"1601628828688-632f38a5a7d0"},
              {"t":"service","c":"06","title":"Traslado a La Peca","desc":"Viaje en mototaxi de Bagua a La Peca, ida o vuelta.","price":12,"img":"1601628828688-632f38a5a7d0"},
              {"t":"promotion","c":"12","title":"Mudanza completa en el centro","desc":"Mudanza dentro del centro de Bagua con dos ayudantes. Hasta 3 viajes.","price":90,"orig":120,"img":"1601628828688-632f38a5a7d0"}]},

    {"n":20,"name":"Gladys Tantaleán","email":"brillo.total@demo.manoamano.pe","job":"Limpieza Brillo Total","bio":"Limpieza de casas, oficinas y locales. Trabajamos con productos propios.","addr":"Jr. Amazonas 377","lat":-5.6403,"lng":-78.5294,"avatar":"1438761681033-6461ffad8d80",
     "items":[{"t":"service","c":"11","title":"Limpieza de oficina por día","desc":"Limpieza completa de oficinas y locales comerciales. Turnos mañana o tarde.","price":80,"img":"1581578731548-c64695cc6952"},
              {"t":"service","c":"11","title":"Lavado de muebles y colchones","desc":"Lavado a vapor de muebles, sillones y colchones a domicilio.","price":60,"img":"1581578731548-c64695cc6952"},
              {"t":"promotion","c":"12","title":"Limpieza post fiesta","desc":"Dejamos tu casa impecable después de la fiesta. Hasta 4 horas de trabajo.","price":70,"orig":95,"img":"1581578731548-c64695cc6952"}]}
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

    for l in select value from jsonb_array_elements(s->'items') loop
      insert into public.listings (id, owner_id, category_id, type, title, description, price, original_price, negotiable, valid_until,
        address, city, region, latitude, longitude, status)
      values (
        md5(uid::text || (l->>'title'))::uuid, uid, ('10000000-0000-4000-8000-0000000000' || (l->>'c'))::uuid, (l->>'t')::public.listing_type,
        l->>'title', l->>'desc', (l->>'price')::numeric, (l->>'orig')::numeric, l->>'t' <> 'promotion',
        case when l->>'t' = 'promotion' then current_date + 30 end,
        s->>'addr', 'Bagua', 'Amazonas', (s->>'lat')::float, (s->>'lng')::float, 'published')
      on conflict (id) do nothing;
      insert into public.listing_media (listing_id, storage_path, public_url, sort_order)
      values (md5(uid::text || (l->>'title'))::uuid, 'seed/' || md5(uid::text || (l->>'title')) || '.jpg',
        coalesce(l->>'url', img || (l->>'img') || '?w=800&auto=format&fit=crop'), 0)
      on conflict (storage_path) do nothing;
    end loop;
  end loop;
end $$;

-- Supabase Auth falla con "Database error querying schema" si estas columnas quedan en NULL.
update auth.users set confirmation_token = coalesce(confirmation_token, ''), recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''), email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''), phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''), reauthentication_token = coalesce(reauthentication_token, '')
where email like '%@demo.manoamano.pe';
