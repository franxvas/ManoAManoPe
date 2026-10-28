export type DonationStatus = 'available' | 'reserved' | 'delivered';
export type AdoptionStatus = 'seeking' | 'evaluating' | 'agreed' | 'adopted';

export interface Donation {
  id: string;
  owner_id: string;
  owner_name: string;
  title: string;
  description: string;
  condition: keyof typeof conditionLabels;
  quantity: number;
  zone: string;
  pickup_terms: string;
  photos: string[];
  status: DonationStatus;
  created_at: string;
}

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

export const conditionLabels = {
  nuevo: 'Nuevo',
  como_nuevo: 'Como nuevo',
  buen_estado: 'Buen estado',
  usado: 'Usado',
  para_reparar: 'Para reparar',
};

export const speciesLabels = { perro: 'Perro', gato: 'Gato', conejo: 'Conejo', ave: 'Ave', otro: 'Otro' };
export const sizeLabels = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };

export type Tone = 'green' | 'amber' | 'navy' | 'gray' | 'red';

export const donationStatus: Record<DonationStatus, { label: string; tone: Tone }> = {
  available: { label: 'Disponible', tone: 'green' },
  reserved: { label: 'Reservado', tone: 'amber' },
  delivered: { label: 'Entregado', tone: 'gray' },
};

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

export function validateDonation(input: { title: string; zone: string; pickupTerms: string; quantity: string; photos: number }) {
  between(input.title, 5, 100, 'Cuenta qué donas en 5 a 100 caracteres.');
  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new Error('La cantidad debe ser un número entre 1 y 999.');
  between(input.zone, 3, 80, 'Indica la zona o barrio (sin dirección exacta).');
  between(input.pickupTerms, 5, 500, 'Explica las condiciones y el horario de recojo.');
  if (input.photos < 1 || input.photos > 6) throw new Error('Añade entre una y seis fotos.');
}

export function validateAdoption(input: { petName: string; ageText: string; description: string; conditions: string; zone: string; photos: number }) {
  between(input.petName, 2, 60, 'Escribe el nombre del animal.');
  between(input.ageText, 1, 40, 'Indica una edad aproximada, por ejemplo "2 años".');
  between(input.description, 20, 2000, 'Describe al animal y su comportamiento (mínimo 20 caracteres).');
  between(input.conditions, 5, 1000, 'Indica las condiciones de adopción.');
  between(input.zone, 3, 80, 'Indica la zona o barrio (sin dirección exacta).');
  if (input.photos < 1 || input.photos > 6) throw new Error('Añade entre una y seis fotos.');
}
