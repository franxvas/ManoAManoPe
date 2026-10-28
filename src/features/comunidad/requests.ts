import { db, rpc } from './api';

export interface DonationRequest {
  id: string;
  donation_id: string;
  requester_id: string;
  requester_name: string;
  message: string;
  status: 'pending' | 'selected' | 'declined' | 'withdrawn' | 'cancelled' | 'delivered';
  created_at: string;
}

export interface AdoptionApplication {
  id: string;
  adoption_id: string;
  applicant_id: string;
  applicant_name: string;
  housing: string;
  other_pets: string;
  daily_care: string;
  experience: string;
  message: string;
  status: 'pending' | 'evaluating' | 'accepted' | 'declined' | 'withdrawn' | 'cancelled' | 'completed';
  created_at: string;
}

export const requestStatusLabels: Record<DonationRequest['status'] | AdoptionApplication['status'], string> = {
  pending: 'Pendiente',
  selected: 'Elegida',
  evaluating: 'En evaluación',
  accepted: 'Acordada',
  declined: 'No seleccionada',
  withdrawn: 'Retirada',
  cancelled: 'Cancelada',
  delivered: 'Entregada',
  completed: 'Adopción completada',
};

// Gracias a RLS el dueño recibe todas las solicitudes y los demás solo la suya.
export async function fetchDonationRequests(donationId: string): Promise<DonationRequest[]> {
  const { data, error } = await db()
    .from('donation_requests')
    .select('*, requester:profiles(display_name)')
    .eq('donation_id', donationId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(({ requester, ...row }) => ({ ...row, requester_name: requester?.display_name ?? 'Vecino' }));
}

export async function fetchAdoptionApplications(adoptionId: string): Promise<AdoptionApplication[]> {
  const { data, error } = await db()
    .from('adoption_applications')
    .select('*, applicant:profiles(display_name)')
    .eq('adoption_id', adoptionId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(({ applicant, ...row }) => ({ ...row, applicant_name: applicant?.display_name ?? 'Vecino' }));
}

export async function fetchMyRequests(userId: string) {
  const [donations, adoptions] = await Promise.all([
    db().from('donation_requests').select('id, status, created_at, donation:donations(id, title)').eq('requester_id', userId).order('created_at', { ascending: false }),
    db().from('adoption_applications').select('id, status, created_at, adoption:adoptions(id, pet_name)').eq('applicant_id', userId).order('created_at', { ascending: false }),
  ]);
  if (donations.error) throw donations.error;
  if (adoptions.error) throw adoptions.error;
  return [
    ...(donations.data ?? []).map((row: any) => ({ id: row.id, kind: 'donation' as const, targetId: row.donation?.id, title: row.donation?.title, status: row.status, created_at: row.created_at })),
    ...(adoptions.data ?? []).map((row: any) => ({ id: row.id, kind: 'adoption' as const, targetId: row.adoption?.id, title: row.adoption?.pet_name, status: row.status, created_at: row.created_at })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at)) as {
    id: string;
    kind: 'donation' | 'adoption';
    targetId: string;
    title: string;
    status: keyof typeof requestStatusLabels;
    created_at: string;
  }[];
}

export const requestDonation = (donationId: string, message: string) => rpc<string>('request_donation', { p_donation: donationId, p_message: message });
export const withdrawDonationRequest = (requestId: string) => rpc('withdraw_donation_request', { p_request: requestId });
export const selectDonationRequest = (requestId: string) => rpc('select_donation_request', { p_request: requestId });
export const markDonationDelivered = (donationId: string) => rpc('mark_donation_delivered', { p_donation: donationId });
export const cancelDonationAgreement = (donationId: string) => rpc('cancel_donation_agreement', { p_donation: donationId });

export const applyForAdoption = (adoptionId: string, answers: { housing: string; otherPets: string; dailyCare: string; experience: string; message: string }) =>
  rpc<string>('apply_for_adoption', {
    p_adoption: adoptionId,
    p_housing: answers.housing,
    p_other_pets: answers.otherPets,
    p_daily_care: answers.dailyCare,
    p_experience: answers.experience,
    p_message: answers.message,
  });
export const reviewApplication = (applicationId: string, action: 'evaluate' | 'decline' | 'agree') => rpc('review_adoption_application', { p_application: applicationId, p_action: action });
export const completeAdoption = (adoptionId: string) => rpc('complete_adoption', { p_adoption: adoptionId });
export const cancelAdoptionProcess = (adoptionId: string) => rpc('cancel_adoption_process', { p_adoption: adoptionId });
export const withdrawApplication = (applicationId: string) => rpc('withdraw_adoption_application', { p_application: applicationId });
