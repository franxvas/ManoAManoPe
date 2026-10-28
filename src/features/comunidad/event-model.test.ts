import { eventPhase, joinDateTime, validateEvent } from './event-model';

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
