import { advanceProgress, isProjectFinished } from './progress';
test('el trabajador solicita y el cliente confirma la finalización', () => {
  expect(
    advanceProgress('in_progress', 'request_completion', 'Trabajador', false),
  ).toBe('completion_requested');
  expect(
    advanceProgress(
      'completion_requested',
      'confirm_completion',
      'Solicitante',
      false,
    ),
  ).toBe('completed');
  expect(() =>
    advanceProgress('in_progress', 'confirm_completion', 'Trabajador', false),
  ).toThrow();
});
test('un presupuesto pendiente impide finalizar y una tarea no termina el proyecto', () => {
  expect(() =>
    advanceProgress('in_progress', 'request_completion', 'Trabajador', true),
  ).toThrow();
  expect(isProjectFinished(['completed', 'open'])).toBe(false);
  expect(isProjectFinished(['completed', 'cancelled'])).toBe(true);
  expect(isProjectFinished([])).toBe(false);
});
