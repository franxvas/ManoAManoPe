import { deadlineFrom, durationText, eventPhase, joinDateTime, parseCapacity, registrationClosed, seatsInfo, validateEvent, validateWorkshop } from './event-model';

describe('talleres', () => {
  it('calcula la duración', () => {
    expect(durationText('2026-11-07T14:00:00.000Z', '2026-11-07T17:00:00.000Z')).toBe('3 horas');
    expect(durationText('2026-11-07T14:00:00.000Z', '2026-11-07T15:30:00.000Z')).toBe('1 h 30 min');
  });

  it('el cierre de inscripción no pasa del inicio del taller', () => {
    const start = new Date(2099, 0, 10, 9, 0);
    expect(deadlineFrom('2099-01-08', start)).toEqual(new Date(2099, 0, 8, 23, 59));
    expect(deadlineFrom('2099-01-10', start)).toEqual(start);
  });

  it('sabe cuándo ya cerraron las inscripciones', () => {
    expect(registrationClosed({ registration_deadline: null })).toBe(false);
    expect(registrationClosed({ registration_deadline: '2020-01-01T00:00:00Z' })).toBe(true);
  });

  it('pide tema, instructor y cupos', () => {
    expect(validateWorkshop({ topic: 'Bicicletas', instructor: 'Pedro', capacity: '15' })).toBe(15);
    expect(() => validateWorkshop({ topic: 'Bicicletas', instructor: 'Pedro', capacity: '' })).toThrow();
  });
});

describe('cupos', () => {
  it('muestra cuántos quedan y cuando se llena', () => {
    expect(seatsInfo({ capacity: 15, registered_count: 11 })).toEqual({ full: false, text: 'Quedan 4 de 15 cupos' });
    expect(seatsInfo({ capacity: 15, registered_count: 15 })).toEqual({ full: true, text: 'Sin cupos' });
    expect(seatsInfo({ capacity: null, registered_count: 1 }).text).toBe('1 inscrito');
  });

  it('acepta capacidad vacía o un número válido', () => {
    expect(parseCapacity('')).toBeNull();
    expect(parseCapacity('15')).toBe(15);
    expect(() => parseCapacity('0')).toThrow();
    expect(() => parseCapacity('dos')).toThrow();
  });
});

const now = new Date(2026, 9, 28, 12, 0);

describe('eventos', () => {
  it('pasa a finalizado cuando termina el horario', () => {
    const event = { starts_at: new Date(2026, 9, 28, 9).toISOString(), ends_at: new Date(2026, 9, 28, 13).toISOString() };
    expect(eventPhase(event, new Date(2026, 9, 28, 8))).toBe('upcoming');
    expect(eventPhase(event, now)).toBe('ongoing');
    expect(eventPhase(event, new Date(2026, 9, 28, 13))).toBe('finished');
  });

  it('arma la fecha con el día y la hora', () => {
    expect(joinDateTime('2026-11-07', '9:30')).toEqual(new Date(2026, 10, 7, 9, 30));
    expect(joinDateTime('2026-11-07', '25:00')).toBeNull();
  });

  const valid = { title: 'Campaña de evaluación visual', organizerName: 'Óptica Bagua', description: 'Evaluación gratuita de la vista para todas las edades.', place: 'Plaza de Armas', day: '2026-11-07', startTime: '09:00', endTime: '13:00', isFree: true, costNote: '' };

  it('acepta un evento bien llenado', () => {
    expect(() => validateEvent(valid, now)).not.toThrow();
  });

  it('rechaza horas al revés, eventos pasados y costos sin detalle', () => {
    expect(() => validateEvent({ ...valid, endTime: '08:00' }, now)).toThrow();
    expect(() => validateEvent({ ...valid, day: '2026-10-01' }, now)).toThrow();
    expect(() => validateEvent({ ...valid, isFree: false }, now)).toThrow();
  });
});
