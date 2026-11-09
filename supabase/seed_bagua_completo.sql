-- Más datos de ejemplo de Bagua para todas las secciones. Usa los vendedores de seed_vendedores_bagua.sql.
-- Correr después de ese archivo. Se puede correr varias veces sin duplicar.
do $$
declare
  img constant text := 'https://images.unsplash.com/photo-';
  fit constant text := '?w=800&auto=format&fit=crop';
  rosa uuid := '50000000-0000-4000-8000-000000000001';
  pedro uuid := '50000000-0000-4000-8000-000000000002';
  luis uuid := '50000000-0000-4000-8000-000000000003';
  carmen uuid := '50000000-0000-4000-8000-000000000004';
  jorge uuid := '50000000-0000-4000-8000-000000000005';
  milagros uuid := '50000000-0000-4000-8000-000000000006';
  diego uuid := '50000000-0000-4000-8000-000000000007';
  sonia uuid := '50000000-0000-4000-8000-000000000008';
  ricardo uuid := '50000000-0000-4000-8000-000000000009';
  ana uuid := '50000000-0000-4000-8000-000000000010';
  d date := current_date;
begin
  -- Necesito una mano: pedidos de ayuda, reparaciones y proyectos.
  insert into public.mano_requests (id, owner_id, kind, title, category, description, budget_min, budget_max, deadline, modality, approximate_location, approximate_latitude, approximate_longitude, repair_item, brand_model, problem_since, transport, photos) values
    (md5('mano-1')::uuid, rosa, 'repair', 'Refrigeradora no enfría bien', 'Electrodomésticos', 'Enciende pero no enfría desde hace unos días. Necesito que la revisen en la bodega.', 50, 150, d + 5, 'home', 'Jr. Ayacucho, Bagua', -5.639, -78.533, 'Refrigeradora', 'LG de 2 puertas', 'Hace 4 días', 'Revisión en el lugar', array[img || '1585771724684-38269d6639fd' || fit]),
    (md5('mano-2')::uuid, carmen, 'help', 'Ayuda para pintar la fachada de la panadería', 'Pintura', 'Busco a alguien para pintar la fachada de un local de un piso. Yo pongo la pintura.', 120, 200, d + 10, 'home', 'Cerca al Mercado Central', -5.642, -78.536, null, null, null, null, '{}'),
    (md5('mano-3')::uuid, ana, 'project', 'Instalar repisas en el restaurante', 'Carpintería', 'Necesito 4 repisas de madera para la cocina del restaurante, con instalación.', 200, 400, d + 15, 'home', 'Jr. Ayacucho, Bagua', -5.640, -78.531, null, null, null, null, array[img || '1555041469-a586c61ea9bc' || fit]),
    (md5('mano-4')::uuid, milagros, 'repair', 'Máquina de coser se traba', 'Reparaciones', 'La máquina se traba al coser tela gruesa. Necesito mantenimiento.', 40, 80, d + 7, 'worker_location', 'Jr. Dos de Mayo, Bagua', -5.641, -78.532, 'Máquina de coser', 'Singer industrial', 'Hace una semana', 'Puedo llevarla', '{}'),
    (md5('mano-5')::uuid, jorge, 'help', 'Clases de computación básica', 'Clases', 'Quiero aprender a usar Excel para llevar las cuentas de mis fletes.', 20, 40, d + 20, 'remote', 'Jr. Bolognesi, Bagua', -5.638, -78.535, null, null, null, null, array[img || '1593642632823-8f785ba67e45' || fit])
  on conflict (id) do nothing;

  -- Préstamos (sin precio) y alquileres.
  insert into public.resource_posts (id, owner_id, kind, title, description, zone, starts_at, ends_at, price, unit, deposit, photos) values
    (md5('rec-1')::uuid, diego, 'loan', 'Necesito prestada una escalera', 'Una escalera de 2 metros para cambiar focos en casa. La devuelvo el mismo día.', 'Urb. Pueblo Nuevo', now() + interval '1 day', now() + interval '2 days', 0, 'dia', 0, '{}'),
    (md5('rec-2')::uuid, sonia, 'loan', 'Busco una carpa para una actividad', 'Para una reunión familiar en el patio el domingo. La cuido y la devuelvo limpia.', 'Jr. Sargento Lores', now() + interval '3 days', now() + interval '4 days', 0, 'dia', 0, array[img || '1504280390367-361c6d9f38f4' || fit]),
    (md5('rec-3')::uuid, rosa, 'loan', 'Necesito libros de primaria', 'Libros de matemática y comunicación de 4.º grado para mi hija, solo por el bimestre.', 'Jr. Ayacucho', now() + interval '2 days', now() + interval '60 days', 0, 'dia', 0, array[img || '1512820790803-83ca734da794' || fit]),
    (md5('rec-4')::uuid, ricardo, 'rental', 'Alquilo taladro percutor', 'Taladro de 650 W con brocas. Ideal para trabajos en casa.', 'Av. Mariscal Castilla', now() + interval '1 day', now() + interval '30 days', 15, 'dia', 50, array[img || '1572981779307-38b8cabb2407' || fit]),
    (md5('rec-5')::uuid, jorge, 'rental', 'Alquilo bicicleta para paseos', 'Bicicleta montañera en buen estado, con casco.', 'Jr. Bolognesi', now() + interval '1 day', now() + interval '30 days', 5, 'hora', 30, array[img || '1485965120184-e220f721d03e' || fit]),
    (md5('rec-6')::uuid, luis, 'rental', 'Alquilo mesas y sillas para eventos', 'Juego de mesa de madera con 6 sillas. Precio por día, incluye traslado en Bagua.', 'Av. Héroes del Cenepa', now() + interval '2 days', now() + interval '45 days', 25, 'dia', 100, array[img || '1533090481720-856c6e3c1fdc' || fit])
  on conflict (id) do nothing;

  -- Agenda: horarios libres de los que ofrecen servicios, en los próximos días.
  insert into public.service_slots (id, owner_id, listing_id, starts_at, ends_at)
  select md5(l.id::text || g::text)::uuid, l.owner_id, l.id,
    ((d + g)::timestamp + time '09:00') at time zone 'America/Lima', ((d + g)::timestamp + time '11:00') at time zone 'America/Lima'
  from public.listings l, generate_series(1, 3) g
  where l.type = 'service' and l.owner_id in (pedro, luis, diego, sonia, jorge)
  on conflict (id) do nothing;

  -- Más donaciones.
  insert into public.donations (id, owner_id, title, description, condition, quantity, zone, pickup_terms, photos) values
    (md5('don-1')::uuid, luis, 'Sofá de tres cuerpos', 'Sofá en buen estado, solo tiene el forro un poco gastado.', 'usado', 1, 'Av. Héroes del Cenepa', 'Recojo con movilidad propia, de lunes a viernes por la tarde.', array[img || '1555041469-a586c61ea9bc' || fit]),
    (md5('don-2')::uuid, diego, 'Libros escolares de secundaria', 'Matemática, historia y ciencias de 1.º a 3.º de secundaria.', 'buen_estado', 12, 'Urb. Pueblo Nuevo', 'Pasar a recoger los sábados de 9 a 12.', array[img || '1512820790803-83ca734da794' || fit]),
    (md5('don-3')::uuid, milagros, 'Ropa de niño talla 6 a 8', 'Polos, pantalones y casacas en buen estado, todo lavado.', 'buen_estado', 15, 'Jr. Dos de Mayo', 'Recojo en el taller de confecciones en horario de atención.', array[img || '1523381210434-271e8be1f52b' || fit])
  on conflict (id) do nothing;

  -- Más adopciones.
  insert into public.adoptions (id, owner_id, pet_name, species, age_text, size, description, care_info, conditions, zone, photos) values
    (md5('adop-1')::uuid, sonia, 'Michi', 'gato', '1 año', 'pequeno', 'Gata cariñosa y tranquila, le gusta dormir al sol y se lleva bien con niños.', 'Vacunada y esterilizada.', 'Casa con ventanas protegidas.', 'Jr. Sargento Lores', array[img || '1514888286974-6c03e2ca1dba' || fit]),
    (md5('adop-2')::uuid, jorge, 'Rocky', 'perro', '3 años', 'grande', 'Perro guardián, muy leal y juguetón con la familia. Necesita espacio para correr.', 'Vacunas al día, desparasitado.', 'Casa con patio grande y compromiso de paseos diarios.', 'Jr. Bolognesi', array[img || '1543466835-00a7907e9de1' || fit])
  on conflict (id) do nothing;

  -- Más eventos y un taller.
  insert into public.community_events (id, organizer_id, category, title, organizer_name, description, starts_at, ends_at, place, photo, is_free, requirements, requires_registration, capacity) values
    (md5('ev-1')::uuid, carmen, 'feria', 'Feria de emprendedores de Bagua', 'Asociación de Comerciantes de Bagua', 'Productos locales, comida típica y música en vivo. Entrada libre para toda la familia.', ((d + 9)::timestamp + time '10:00') at time zone 'America/Lima', ((d + 9)::timestamp + time '18:00') at time zone 'America/Lima', 'Plaza de Armas de Bagua', null, true, '', false, null),
    (md5('ev-2')::uuid, sonia, 'salud', 'Campaña de vacunación para mascotas', 'Veterinaria municipal', 'Vacuna antirrábica gratuita para perros y gatos. Traer a la mascota con correa.', ((d + 12)::timestamp + time '08:00') at time zone 'America/Lima', ((d + 12)::timestamp + time '13:00') at time zone 'America/Lima', 'Losa deportiva de Pueblo Nuevo', null, true, 'Carné de vacunas si tiene', true, 80)
  on conflict (id) do nothing;

  insert into public.community_events (id, organizer_id, kind, category, title, organizer_name, description, starts_at, ends_at, place, photo, is_free, cost_note, requirements, requires_registration, capacity, topic, instructor, level, materials, modality, registration_deadline) values
    (md5('ws-1')::uuid, carmen, 'workshop', 'taller', 'Taller de panadería casera', 'Panadería Doña Carmen', 'Aprende a preparar pan de yema y chancay en casa, paso a paso.', ((d + 14)::timestamp + time '15:00') at time zone 'America/Lima', ((d + 14)::timestamp + time '18:00') at time zone 'America/Lima', 'Panadería Doña Carmen, cerca al Mercado Central', null, false, 'S/ 10 por los insumos', 'Traer mandil', true, 12, 'Panadería', 'Carmen Silva', 'basico', 'Mandil y un táper', 'presencial', ((d + 13)::timestamp + time '23:59') at time zone 'America/Lima')
  on conflict (id) do nothing;
end $$;

