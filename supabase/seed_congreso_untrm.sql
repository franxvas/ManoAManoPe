-- Evento: VIII Congreso Internacional de Ingeniería de Sistemas (UNTRM). Se puede correr varias veces.
insert into public.community_events (id, organizer_id, category, title, organizer_name, description, starts_at, ends_at, place, photo, is_free, requirements, requires_registration, capacity)
values (
  md5('congreso-sistemas-untrm-2026')::uuid,
  '22222222-2222-4222-8222-222222222222',
  'actividad',
  'VIII Congreso Internacional de Ingeniería de Sistemas',
  'Escuela Profesional de Ingeniería de Sistemas – UNTRM',
  'Transformación Digital: IA, Ciberseguridad y Tecnologías emergentes para un mundo hiperconectado. Ponentes de Brasil, Estados Unidos, Chile, Colombia y Perú. 11, 12 y 13 de noviembre de 8:00 a. m. a 1:00 p. m. Dirigido a estudiantes, egresados, docentes de la UNTRM y público en general. Certificación oficial UNTRM 2026. Informes: sara.huaman@untrm.edu.pe · cel. +51 950 982 883.',
  timestamp '2026-11-11 08:00' at time zone 'America/Lima',
  timestamp '2026-11-13 13:00' at time zone 'America/Lima',
  'Modalidad virtual · Transmisión en vivo',
  null, true,
  'Inscribirse con el código QR o el link de inscripción del afiche oficial.',
  false, null
)
on conflict (id) do update set description = excluded.description, starts_at = excluded.starts_at, ends_at = excluded.ends_at;
