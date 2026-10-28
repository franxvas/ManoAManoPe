import { deadlineFrom, registrationClosed, validateWorkshop } from './model';

describe('talleres', () => {
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
