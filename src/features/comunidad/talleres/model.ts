import { parseCapacity, parseDay, type CommunityEvent } from '../eventos/model';

// Los talleres se guardan como eventos con kind = 'workshop' y estos datos extra.
export const levelLabels = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
export const modalityLabels = { presencial: 'Presencial', virtual: 'Virtual' };

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
