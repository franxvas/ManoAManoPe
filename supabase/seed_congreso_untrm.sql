-- Evento: VIII Congreso Internacional de Ingeniería de Sistemas (UNTRM), un evento por cada día. Se puede correr varias veces.
delete from public.community_events where id = md5('congreso-sistemas-untrm-2026')::uuid;

insert into public.community_events (id, organizer_id, category, title, organizer_name, description, starts_at, ends_at, place, photo, is_free, requirements, requires_registration, capacity)
select
  md5('congreso-sistemas-untrm-2026-dia-' || n)::uuid,
  '22222222-2222-4222-8222-222222222222',
  'actividad',
  'Congreso Internacional de Ing. de Sistemas · Día ' || n,
  'Escuela Profesional de Ingeniería de Sistemas – UNTRM',
  'VIII Congreso Internacional de Ingeniería de Sistemas, día ' || n || ' de 3. Transformación Digital: IA, Ciberseguridad y Tecnologías emergentes para un mundo hiperconectado. Ponentes de Brasil, Estados Unidos, Chile, Colombia y Perú. Dirigido a estudiantes, egresados, docentes de la UNTRM y público en general. Certificación oficial UNTRM 2026. Informes: sara.huaman@untrm.edu.pe · cel. +51 950 982 883.',
  (date '2026-11-10' + n + time '08:00') at time zone 'America/Lima',
  (date '2026-11-10' + n + time '13:00') at time zone 'America/Lima',
  'Modalidad virtual · Transmisión en vivo',
  null, true,
  'Inscribirse con el código QR o el link de inscripción del afiche oficial.',
  false, null
from generate_series(1, 3) as n
on conflict (id) do update set title = excluded.title, description = excluded.description, starts_at = excluded.starts_at, ends_at = excluded.ends_at;
