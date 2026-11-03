export type WorkProgress =
  'open' | 'in_progress' | 'completion_requested' | 'completed' | 'cancelled';
export function isProjectFinished(states: WorkProgress[]) {
  return (
    states.length > 0 &&
    states.every((state) => state === 'completed' || state === 'cancelled')
  );
}
export function advanceProgress(
  current: WorkProgress,
  action: 'request_completion' | 'confirm_completion' | 'cancel',
  role: 'Solicitante' | 'Trabajador',
  pendingRevision: boolean,
): WorkProgress {
  if (
    action === 'request_completion' &&
    role === 'Trabajador' &&
    current === 'in_progress' &&
    !pendingRevision
  )
    return 'completion_requested';
  if (
    action === 'confirm_completion' &&
    role === 'Solicitante' &&
    current === 'completion_requested'
  )
    return 'completed';
  if (action === 'cancel' && role === 'Solicitante' && current === 'open')
    return 'cancelled';
  throw new Error(
    pendingRevision
      ? 'Resuelve primero la actualización del presupuesto.'
      : 'Esta acción no está disponible para el estado y rol actuales.',
  );
}
