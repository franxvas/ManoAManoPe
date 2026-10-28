import type { Tone } from './model';

export interface CommunityEvent {
  id: string;
  organizer_id: string;
  category: keyof typeof categoryLabels | 'taller';
  title: string;
  organizer_name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  place: string;
  photo: string | null;
  is_free: boolean;
  cost_note: string;
  requirements: string;
  requires_registration: boolean;
  capacity: number | null;
  registered_count: number;
  kind: 'event' | 'workshop';
  topic: string;
  instructor: string;
  level: keyof typeof levelLabels | null;
  materials: string;
  modality: keyof typeof modalityLabels | null;
  registration_deadline: string | null;
}

export const categoryLabels = {
  campana: 'Campaña',
  limpieza: 'Limpieza',
  feria: 'Feria',
  salud: 'Salud',
  actividad: 'Actividad',
};

export const levelLabels = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
export const modalityLabels = { presencial: 'Presencial', virtual: 'Virtual' };

export function categoryText(event: Pick<CommunityEvent, 'kind' | 'category'>) {
  return event.category === 'taller' ? 'Taller' : categoryLabels[event.category];
}

export function durationText(startsAt: string, endsAt: string) {
  const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

export function registrationClosed(event: Pick<CommunityEvent, 'registration_deadline'>, now = new Date()) {
  return Boolean(event.registration_deadline && now > new Date(event.registration_deadline));
}

// Las inscripciones cierran al final del día elegido, o al empezar el taller si es antes.
export function deadlineFrom(day: string, start: Date) {
  const endOfDay = parseDay(day, 23, 59);
  if (!endOfDay) throw new Error('Elige hasta qué día se reciben inscripciones.');
  if (endOfDay < new Date()) throw new Error('El cierre de inscripción no puede ser en el pasado.');
  return endOfDay > start ? start : endOfDay;
}

export function validateWorkshop(input: { topic: string; instructor: string; capacity: string }) {
  if (input.topic.trim().length < 2) throw new Error('Indica el tema del taller.');
  if (input.instructor.trim().length < 2) throw new Error('Indica quién dicta el taller.');
  if (!input.capacity.trim()) throw new Error('Los talleres necesitan un número de cupos.');
  return parseCapacity(input.capacity);
}

export type EventPhase = 'upcoming' | 'ongoing' | 'finished';

export const phaseBadges: Record<EventPhase, { label: string; tone: Tone }> = {
  upcoming: { label: 'Próximo', tone: 'navy' },
  ongoing: { label: 'En curso', tone: 'green' },
  finished: { label: 'Finalizado', tone: 'gray' },
};

// Finalizado solo dice que terminó el horario, no quién asistió.
export function eventPhase(event: Pick<CommunityEvent, 'starts_at' | 'ends_at'>, now = new Date()): EventPhase {
  if (now >= new Date(event.ends_at)) return 'finished';
  if (now >= new Date(event.starts_at)) return 'ongoing';
  return 'upcoming';
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDay(day: string, hours = 0, minutes = 0) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hours, minutes);
}

// Une el día elegido y una hora "HH:MM" en una fecha local.
export function joinDateTime(day: string, time: string) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  return match ? parseDay(day, Number(match[1]), Number(match[2])) : null;
}

export function validateEvent(input: { title: string; organizerName: string; description: string; place: string; day: string; startTime: string; endTime: string; isFree: boolean; costNote: string }, now = new Date()) {
  if (input.title.trim().length < 5) throw new Error('Ponle un nombre al evento (mínimo 5 caracteres).');
  if (input.organizerName.trim().length < 2) throw new Error('Indica quién organiza.');
  if (input.description.trim().length < 20) throw new Error('Describe el evento con al menos 20 caracteres.');
  if (input.place.trim().length < 3) throw new Error('Indica el lugar.');
  const start = joinDateTime(input.day, input.startTime);
  const end = joinDateTime(input.day, input.endTime);
  if (!start || !end) throw new Error('Elige el día y escribe las horas como 09:00.');
  if (end <= start) throw new Error('La hora de fin debe ser después del inicio.');
  if (end <= now) throw new Error('El evento no puede terminar en el pasado.');
  if (!input.isFree && !input.costNote.trim()) throw new Error('Si tiene costo, indica cuánto o qué se paga.');
  return { start, end };
}

export function seatsInfo(event: Pick<CommunityEvent, 'capacity' | 'registered_count'>) {
  if (event.capacity == null) return { full: false, text: `${event.registered_count} ${event.registered_count === 1 ? 'inscrito' : 'inscritos'}` };
  const left = Math.max(event.capacity - event.registered_count, 0);
  return { full: left === 0, text: left === 0 ? 'Sin cupos' : `Quedan ${left} de ${event.capacity} cupos` };
}

export function parseCapacity(value: string) {
  if (!value.trim()) return null;
  const capacity = Number(value);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) throw new Error('La capacidad debe ser un número entre 1 y 5000.');
  return capacity;
}

export function timeText(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
