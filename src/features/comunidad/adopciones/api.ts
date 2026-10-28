import { db, rpc, uploadPhotos } from '../api';
import type { Adoption, AdoptionApplication } from './model';

export interface AdoptionInput {
  petName: string;
  species: Adoption['species'];
  ageText: string;
  size: Adoption['size'];
  description: string;
  careInfo: string;
  conditions: string;
  zone: string;
  photos: { uri: string; path?: string }[];
}

const columns = '*, owner:profiles(display_name)';

function mapAdoption(row: Record<string, any>): Adoption {
  const { owner, ...adoption } = row;
  return { ...adoption, owner_name: owner?.display_name ?? 'Vecino' } as Adoption;
}

export async function fetchAdoptions() {
  const { data, error } = await db().from('adoptions').select(columns).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map(mapAdoption);
}

export async function fetchAdoption(id: string) {
  const { data, error } = await db().from('adoptions').select(columns).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapAdoption(data) : null;
}

export async function saveAdoption(input: AdoptionInput, id?: string) {
  const row = {
    pet_name: input.petName.trim(),
    species: input.species,
    age_text: input.ageText.trim(),
    size: input.size,
    description: input.description.trim(),
    care_info: input.careInfo.trim(),
    conditions: input.conditions.trim(),
    zone: input.zone.trim(),
    photos: await uploadPhotos('adopciones', input.photos),
  };
  const request = id ? db().from('adoptions').update(row).eq('id', id) : db().from('adoptions').insert(row);
  const { data, error } = await request.select('id').single();
  if (error) throw error;
  return String(data.id);
}

export async function deleteAdoption(id: string) {
  const { error } = await db().from('adoptions').delete().eq('id', id);
  if (error) throw error;
}

// Gracias a RLS el dueño recibe todas las solicitudes y los demás solo la suya.
export async function fetchAdoptionApplications(adoptionId: string): Promise<AdoptionApplication[]> {
  const { data, error } = await db()
    .from('adoption_applications')
    .select('*, applicant:profiles(display_name)')
    .eq('adoption_id', adoptionId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(({ applicant, ...row }) => ({ ...row, applicant_name: applicant?.display_name ?? 'Vecino' }));
}

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
