export type RequestKind = 'help' | 'repair' | 'project';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type QuoteKind = 'diagnosis' | 'estimate' | 'fixed';
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  acceptedProposalId?: string;
}
export interface Proposal {
  id: string;
  taskId: string;
  workerId: string;
  amount: number;
  maxAmount?: number;
  scope: string;
  duration: string;
  start: string;
  materials: string;
  note: string;
  kind: QuoteKind;
  status: 'pending' | 'accepted' | 'rejected';
  revision?: { amount: number; scope: string };
}
export interface ManoRequest {
  id: string;
  ownerId: string;
  kind: RequestKind;
  title: string;
  category: string;
  description: string;
  budget: string;
  deadline: string;
  modality: string;
  location: string;
  repairItem: string;
  brandModel: string;
  since: string;
  transport: string;
  photos: string[];
  tasks: Task[];
  proposals: Proposal[];
}
export function projectFinished(tasks: Task[]) {
  return (
    tasks.length > 0 &&
    tasks.every((t) => t.status === 'completed' || t.status === 'cancelled')
  );
}
export function canPropose(request: ManoRequest, task: Task, workerId: string) {
  return request.ownerId !== workerId && task.status === 'open';
}
export function acceptProposal(
  request: ManoRequest,
  taskId: string,
  proposalId: string,
  actorId: string,
): ManoRequest {
  if (request.ownerId !== actorId)
    throw new Error('Solo el solicitante puede aceptar una propuesta.');
  const task = request.tasks.find((t) => t.id === taskId);
  const proposal = request.proposals.find(
    (p) => p.id === proposalId && p.taskId === taskId && p.status === 'pending',
  );
  if (!task || task.status !== 'open' || !proposal)
    throw new Error('Esta propuesta ya no está disponible.');
  return {
    ...request,
    tasks: request.tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: 'in_progress', acceptedProposalId: proposalId }
        : t,
    ),
    proposals: request.proposals.map((p) =>
      p.taskId === taskId && p.status === 'pending'
        ? { ...p, status: p.id === proposalId ? 'accepted' : 'rejected' }
        : p,
    ),
  };
}
