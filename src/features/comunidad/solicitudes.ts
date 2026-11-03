import type { AdoptionApplication } from './adopciones/model';
import { db } from './api';
import type { DonationRequest } from './donaciones/model';

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

// Junta las donaciones y adopciones que pidió el usuario para "Mis solicitudes".
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
