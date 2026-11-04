import {
  acceptProposal,
  canPropose,
  projectFinished,
  type ManoRequest,
} from './model';
const request: ManoRequest = {
  id: 'r',
  ownerId: 'owner',
  kind: 'project',
  title: 'Feria',
  category: 'Eventos',
  description: '',
  budget: '',
  deadline: '',
  modality: '',
  location: '',
  repairItem: '',
  brandModel: '',
  since: '',
  transport: '',
  photos: [],
  tasks: [
    { id: 'a', title: 'Foto', status: 'open' },
    { id: 'b', title: 'Sonido', status: 'open' },
  ],
  proposals: [
    {
      id: 'p',
      taskId: 'a',
      workerId: 'worker',
      amount: 100,
      scope: 'Fotos',
      duration: '1 día',
      start: 'lunes',
      materials: 'incluidos',
      note: '',
      kind: 'fixed',
      status: 'pending',
    },
    {
      id: 'q',
      taskId: 'a',
      workerId: 'other',
      amount: 120,
      scope: 'Fotos',
      duration: '1 día',
      start: 'lunes',
      materials: 'incluidos',
      note: '',
      kind: 'fixed',
      status: 'pending',
    },
  ],
};
test('el autor no puede proponerse y una tarea cerrada no recibe propuestas', () => {
  expect(canPropose(request, request.tasks[0]!, 'owner')).toBe(false);
  expect(
    canPropose(
      request,
      { ...request.tasks[0]!, status: 'in_progress' },
      'worker',
    ),
  ).toBe(false);
});
test('aceptar selecciona una propuesta y cierra solo esa tarea', () => {
  const next = acceptProposal(request, 'a', 'p', 'owner');
  expect(next.tasks[0]!.status).toBe('in_progress');
  expect(next.tasks[1]!.status).toBe('open');
  expect(next.proposals.map((p) => p.status)).toEqual(['accepted', 'rejected']);
  expect(() => acceptProposal(request, 'a', 'p', 'worker')).toThrow();
});
test('un proyecto termina solo cuando todas las tareas terminan o se cancelan', () => {
  expect(
    projectFinished([
      { id: 'a', title: 'A', status: 'completed' },
      { id: 'b', title: 'B', status: 'open' },
    ]),
  ).toBe(false);
  expect(
    projectFinished([
      { id: 'a', title: 'A', status: 'completed' },
      { id: 'b', title: 'B', status: 'cancelled' },
    ]),
  ).toBe(true);
  expect(projectFinished([])).toBe(false);
});
