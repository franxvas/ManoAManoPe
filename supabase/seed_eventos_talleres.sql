-- Eventos y talleres de ejemplo en Bagua. Las fechas se calculan desde hoy,
-- así siempre aparecen como "próximos". Se puede correr varias veces.
delete from public.community_events where id in (
  select md5('demo-comunidad-' || n)::uuid from generate_series(1, 7) n
);

-- Eventos y campañas
insert into public.community_events (id, organizer_id, kind, category, title, organizer_name, description, starts_at, ends_at, place, is_free, cost_note, requirements, requires_registration, capacity)
values
 (md5('demo-comunidad-1')::uuid, '22222222-2222-4222-8222-222222222222', 'event', 'limpieza',
  'Limpieza del río Utcubamba', 'Vecinos de Bagua',
  'Jornada de limpieza en la ribera del río Utcubamba. Llevamos bolsas y guantes; trae gorra y agua. Al final compartimos un refrigerio.',
  date_trunc('day', now()) + interval '3 days 8 hours', date_trunc('day', now()) + interval '3 days 12 hours',
  'Malecón del río Utcubamba, Bagua', true, '', 'Ropa cómoda, gorra y agua', true, 60),
 (md5('demo-comunidad-2')::uuid, '22222222-2222-4222-8222-222222222222', 'event', 'salud',
  'Campaña de salud gratuita', 'Posta Médica de Bagua',
  'Medición de presión arterial, glucosa y despistaje de anemia para niños y adultos. Atención por orden de llegada.',
  date_trunc('day', now()) + interval '6 days 9 hours', date_trunc('day', now()) + interval '6 days 14 hours',
  'Plaza de Armas de Bagua', true, '', 'Traer DNI', false, null),
 (md5('demo-comunidad-3')::uuid, '22222222-2222-4222-8222-222222222222', 'event', 'feria',
  'Feria de emprendedores bagüinos', 'Asociación de Emprendedores de Bagua',
  'Feria con productos locales: cacao, café, artesanías y comida típica. Ven a apoyar a los emprendedores de tu comunidad.',
  date_trunc('day', now()) + interval '10 days 10 hours', date_trunc('day', now()) + interval '10 days 18 hours',
  'Coliseo municipal de Bagua', true, '', '', false, null),
 (md5('demo-comunidad-4')::uuid, '22222222-2222-4222-8222-222222222222', 'event', 'campana',
  'Colecta de útiles escolares', 'Parroquia de Bagua',
  'Recolectamos cuadernos, lápices y mochilas en buen estado para niños de comunidades rurales de Amazonas.',
  date_trunc('day', now()) + interval '14 days 9 hours', date_trunc('day', now()) + interval '14 days 17 hours',
  'Parroquia Santa Rosa, Bagua', true, '', 'Útiles nuevos o en buen estado', false, null);

-- Talleres (necesitan cupos, tema, instructor, nivel, modalidad y fecha límite de inscripción)
insert into public.community_events (id, organizer_id, kind, category, title, organizer_name, description, starts_at, ends_at, place, is_free, cost_note, requirements, requires_registration, capacity, topic, instructor, level, materials, modality, registration_deadline)
values
 (md5('demo-comunidad-5')::uuid, '22222222-2222-4222-8222-222222222222', 'workshop', 'taller',
  'Taller de repostería básica', 'Panadería Doña Rosa',
  'Aprende a preparar queques y alfajores para vender. Al final te llevas lo que preparaste.',
  date_trunc('day', now()) + interval '5 days 15 hours', date_trunc('day', now()) + interval '5 days 18 hours',
  'Jr. Arequipa 245, Bagua', false, 'S/ 15 por materiales', '', true, 15,
  'Repostería', 'Rosa Huamán', 'basico', 'Mandil y un táper', 'presencial',
  date_trunc('day', now()) + interval '4 days 20 hours'),
 (md5('demo-comunidad-6')::uuid, '22222222-2222-4222-8222-222222222222', 'workshop', 'taller',
  'Vende por WhatsApp y redes sociales', 'Mano a Mano Bagua',
  'Taller práctico para emprendedores: catálogo de WhatsApp Business, fotos con el celular y publicaciones que venden.',
  date_trunc('day', now()) + interval '8 days 19 hours', date_trunc('day', now()) + interval '8 days 21 hours',
  'Virtual (enlace por Google Meet)', true, '', 'Celular con WhatsApp Business', true, 40,
  'Marketing digital', 'Luis Torres', 'basico', '', 'virtual',
  date_trunc('day', now()) + interval '8 days 12 hours'),
 (md5('demo-comunidad-7')::uuid, '22222222-2222-4222-8222-222222222222', 'workshop', 'taller',
  'Instalaciones eléctricas seguras en casa', 'Electricistas Unidos Bagua',
  'Aprende a cambiar tomacorrientes e interruptores sin riesgos y a identificar fallas comunes.',
  date_trunc('day', now()) + interval '12 days 9 hours', date_trunc('day', now()) + interval '12 days 12 hours',
  'Local comunal Barrio Alto, Bagua', true, '', '', true, 20,
  'Electricidad', 'Jorge Díaz', 'intermedio', 'Desarmador plano y estrella', 'presencial',
  date_trunc('day', now()) + interval '11 days 18 hours');
