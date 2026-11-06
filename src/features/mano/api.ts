import { supabase } from '@/lib/supabase';

export type Kind = 'help' | 'repair' | 'project';
export type TaskState =
  'open' | 'in_progress' | 'completion_requested' | 'completed' | 'cancelled';
export type QuoteKind = 'diagnosis' | 'estimate' | 'fixed';
export interface RequestInput {
  kind: Kind;
  title: string;
  category: string;
  description: string;
  budget_min?: number | null;
  budget_max?: number | null;
  deadline?: string | null;
  modality?: 'home' | 'worker_location' | 'remote' | null;
  approximate_location: string;
  approximate_latitude?: number | null;
  approximate_longitude?: number | null;
  repair_item?: string;
  brand_model?: string;
  problem_since?: string;
  transport?: string;
  photos: string[];
}
export interface TaskInput {
  title: string;
  budget_min?: number | null;
  budget_max?: number | null;
}
export interface RequestRow extends RequestInput {
  id: string;
  owner_id: string;
  created_at: string;
}
export interface TaskRow extends TaskInput {
  id: string;
  request_id: string;
  status: TaskState;
  selected_proposal_id: string | null;
}
export interface ProposalInput {
  quote_kind: QuoteKind;
  amount_min: number;
  amount_max?: number | null;
  scope: string;
  duration: string;
  available_from: string;
  materials: string;
  inspection_cost?: number | null;
  note: string;
}
export interface ProposalRow extends ProposalInput {
  id: string;
  task_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  profile?: {
    display_name: string;
    profession: string | null;
    rating_average: number;
  } | null;
}
export interface RevisionRow {
  id: string;
  proposal_id: string;
  amount_min: number;
  amount_max: number | null;
  scope: string;
  status: 'pending' | 'accepted' | 'rejected';
}
export interface MessageRow {
  id: string;
  proposal_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
function client() {
  if (!supabase) throw new Error('Conecta Supabase para usar esta función.');
  return supabase;
}
export async function listRequests() {
  const { data, error } = await client()
    .from('mano_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RequestRow[];
}
export async function createRequest(data: RequestInput, tasks: TaskInput[]) {
  const { data: id, error } = await client().rpc('mano_create_request', {
    p_data: data,
    p_tasks: tasks,
  });
  if (error) throw error;
  return String(id);
}
export async function getTasks(requestId: string) {
  const { data, error } = await client()
    .from('mano_tasks')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}
export async function getProposals(taskId: string) {
  const { data, error } = await client()
    .from('mano_proposals')
    .select(
      '*,profile:profiles!worker_id(display_name,profession,rating_average)',
    )
    .eq('task_id', taskId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as unknown as ProposalRow[];
}
export async function submitProposal(taskId: string, p: ProposalInput) {
  const { data, error } = await client().rpc('mano_submit_proposal', {
    p_task: taskId,
    p_kind: p.quote_kind,
    p_min: p.amount_min,
    p_max: p.amount_max ?? null,
    p_scope: p.scope,
    p_duration: p.duration,
    p_start: p.available_from,
    p_materials: p.materials,
    p_inspection: p.inspection_cost ?? null,
    p_note: p.note,
  });
  if (error) throw error;
  return String(data);
}
export async function acceptProposal(id: string) {
  const { error } = await client().rpc('mano_accept_proposal', {
    p_proposal: id,
  });
  if (error) throw error;
}
export async function rejectProposal(id: string) {
  const { error } = await client().rpc('mano_reject_proposal', {
    p_proposal: id,
  });
  if (error) throw error;
}
export async function listRevisions(id: string) {
  const { data, error } = await client()
    .from('mano_quote_revisions')
    .select('*')
    .eq('proposal_id', id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RevisionRow[];
}
export async function reviseQuote(
  id: string,
  min: number,
  max: number | null,
  scope: string,
) {
  const { error } = await client().rpc('mano_revise_quote', {
    p_proposal: id,
    p_min: min,
    p_max: max,
    p_scope: scope,
  });
  if (error) throw error;
}
export async function respondRevision(id: string, accept: boolean) {
  const { error } = await client().rpc('mano_respond_revision', {
    p_revision: id,
    p_accept: accept,
  });
  if (error) throw error;
}
export async function changeTask(
  id: string,
  action: 'request_completion' | 'confirm_completion' | 'cancel',
) {
  const { error } = await client().rpc('mano_change_task_status', {
    p_task: id,
    p_action: action,
  });
  if (error) throw error;
}
export async function submitReview(
  id: string,
  rating: number,
  comment: string,
) {
  const { error } = await client().rpc('mano_submit_review', {
    p_task: id,
    p_rating: rating,
    p_comment: comment,
  });
  if (error) throw error;
}
export async function listMessages(id: string) {
  const { data, error } = await client()
    .from('mano_messages')
    .select('*')
    .eq('proposal_id', id)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}
export async function sendMessage(id: string, userId: string, body: string) {
  const { error } = await client()
    .from('mano_messages')
    .insert({ proposal_id: id, sender_id: userId, body });
  if (error) throw error;
}

export async function deleteRequest(id: string) {
  const { error } = await client().rpc('mano_delete_request', { p_request: id });
  if (error) throw error;
}
