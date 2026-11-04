import type { RequestInput, TaskInput } from './api';
export function validateRequest(input: RequestInput, tasks: TaskInput[]) {
  if (input.title.trim().length < 5 || input.title.trim().length > 120)
    throw Error('El título debe tener entre 5 y 120 caracteres.');
  if (
    !input.category.trim() ||
    !input.description.trim() ||
    !input.approximate_location.trim()
  )
    throw Error('Completa categoría, descripción y ubicación aproximada.');
  if (input.photos.length > 4)
    throw Error('Selecciona como máximo cuatro fotografías.');
  if (input.deadline) {
    const parsed = new Date(input.deadline + 'T00:00:00Z');
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(input.deadline) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== input.deadline
    )
      throw Error('Ingresa una fecha válida con formato AAAA-MM-DD.');
  }
  if (
    input.kind === 'repair' &&
    (!input.repair_item?.trim() ||
      !input.problem_since?.trim() ||
      !input.transport?.trim())
  )
    throw Error(
      'Indica qué reparar, desde cuándo ocurre y si puedes trasladarlo.',
    );
  if (
    tasks.length < 1 ||
    tasks.length > 30 ||
    tasks.some((t) => !t.title.trim())
  )
    throw Error('Agrega entre una y treinta tareas con nombre.');
  if (input.kind !== 'project' && tasks.length !== 1)
    throw Error('Las solicitudes de ayuda y reparación tienen una tarea.');
  for (const item of [input, ...tasks]) {
    for (const amount of [item.budget_min, item.budget_max])
      if (amount != null && (!Number.isFinite(amount) || amount < 0))
        throw Error('Los presupuestos deben ser montos válidos y positivos.');
    if (
      item.budget_min != null &&
      item.budget_max != null &&
      item.budget_min > item.budget_max
    )
      throw Error('El máximo no puede ser menor que el mínimo.');
  }
}
