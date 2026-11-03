import { validateRequest } from './validation';
const input = {
  kind: 'help' as const,
  title: 'Pintar habitación',
  category: 'Pintura',
  description: 'Pintar paredes',
  approximate_location: 'Bagua',
  photos: [],
};
test('valida fechas reales antes de crear la solicitud', () => {
  expect(() =>
    validateRequest({ ...input, deadline: '2026-02-30' }, [
      { title: 'Pintar' },
    ]),
  ).toThrow();
  expect(() =>
    validateRequest({ ...input, deadline: '2026-02-28' }, [
      { title: 'Pintar' },
    ]),
  ).not.toThrow();
});
test('exige datos de reparación y presupuestos coherentes por tarea', () => {
  expect(() =>
    validateRequest({ ...input, kind: 'repair' }, [{ title: 'Revisar' }]),
  ).toThrow();
  expect(() =>
    validateRequest(input, [
      { title: 'Pintar', budget_min: 200, budget_max: 100 },
    ]),
  ).toThrow();
});
