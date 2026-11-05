import type { Tone } from '../types';

export type AdoptionStatus = 'seeking' | 'evaluating' | 'agreed' | 'adopted';

export interface Adoption {
  id: string;
  owner_id: string;
  owner_name: string;
  pet_name: string;
  species: keyof typeof speciesLabels;
  age_text: string;
  size: keyof typeof sizeLabels;
  description: string;
  care_info: string;
  conditions: string;
  zone: string;
  photos: string[];
  status: AdoptionStatus;
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

export const speciesLabels = { perro: 'Perro', gato: 'Gato', conejo: 'Conejo', ave: 'Ave', otro: 'Otro' };
export const sizeLabels = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };

export const adoptionStatus: Record<AdoptionStatus, { label: string; tone: Tone }> = {
  seeking: { label: 'Buscando hogar', tone: 'green' },
  evaluating: { label: 'Solicitud en evaluación', tone: 'navy' },
  agreed: { label: 'Adopción acordada', tone: 'amber' },
  adopted: { label: 'Adoptado', tone: 'gray' },
};

function between(value: string, min: number, max: number, message: string) {
  const length = value.trim().length;
  if (length < min || length > max) throw new Error(message);
}

export function validateAdoption(input: { petName: string; ageText: string; description: string; conditions: string; zone: string; photos: number }) {
  between(input.petName, 2, 60, 'Escribe el nombre del animal.');
  between(input.ageText, 1, 40, 'Indica una edad aproximada, por ejemplo "2 años".');
  between(input.description, 20, 2000, 'Describe al animal y su comportamiento (mínimo 20 caracteres).');
  between(input.conditions, 5, 1000, 'Indica las condiciones de adopción.');
  between(input.zone, 3, 80, 'Indica la zona o barrio (sin dirección exacta).');
  if (input.photos < 1 || input.photos > 6) throw new Error('Añade entre una y seis fotos.');
}
