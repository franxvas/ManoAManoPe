import { db, rpc, uploadPhotos } from '../api';
import type { Donation, DonationRequest } from './model';

export interface DonationInput {
  title: string;
  description: string;
  condition: Donation['condition'];
  quantity: number;
  zone: string;
  pickupTerms: string;
  photos: { uri: string; path?: string }[];
}

const columns = '*, owner:profiles(display_name)';

function mapDonation(row: Record<string, any>): Donation {
  const { owner, ...donation } = row;
  return { ...donation, owner_name: owner?.display_name ?? 'Vecino' } as Donation;
}

export async function fetchDonations() {
  const { data, error } = await db().from('donations').select(columns).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map(mapDonation);
}

export async function fetchDonation(id: string) {
  const { data, error } = await db().from('donations').select(columns).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapDonation(data) : null;
}

export async function saveDonation(input: DonationInput, id?: string) {
  const row = {
    title: input.title.trim(),
    description: input.description.trim(),
    condition: input.condition,
    quantity: input.quantity,
    zone: input.zone.trim(),
    pickup_terms: input.pickupTerms.trim(),
    photos: await uploadPhotos('donaciones', input.photos),
  };
  const request = id ? db().from('donations').update(row).eq('id', id) : db().from('donations').insert(row);
  const { data, error } = await request.select('id').single();
  if (error) throw error;
  return String(data.id);
}

export async function deleteDonation(id: string) {
  const { error } = await db().from('donations').delete().eq('id', id);
  if (error) throw error;
}

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

export const requestDonation = (donationId: string, message: string) => rpc<string>('request_donation', { p_donation: donationId, p_message: message });
export const withdrawDonationRequest = (requestId: string) => rpc('withdraw_donation_request', { p_request: requestId });
export const selectDonationRequest = (requestId: string) => rpc('select_donation_request', { p_request: requestId });
export const markDonationDelivered = (donationId: string) => rpc('mark_donation_delivered', { p_donation: donationId });
export const cancelDonationAgreement = (donationId: string) => rpc('cancel_donation_agreement', { p_donation: donationId });
