import type { Tone } from '../types';

export type DonationStatus = 'available' | 'reserved' | 'delivered';

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

export interface DonationRequest {
  id: string;
  donation_id: string;
  requester_id: string;
  requester_name: string;
  message: string;
  status: 'pending' | 'selected' | 'declined' | 'withdrawn' | 'cancelled' | 'delivered';
  created_at: string;
}

export const conditionLabels = {
  nuevo: 'Nuevo',
  como_nuevo: 'Como nuevo',
  buen_estado: 'Buen estado',
  usado: 'Usado',
  para_reparar: 'Para reparar',
};

export const donationStatus: Record<DonationStatus, { label: string; tone: Tone }> = {
  available: { label: 'Disponible', tone: 'green' },
  reserved: { label: 'Reservado', tone: 'amber' },
  delivered: { label: 'Entregado', tone: 'gray' },
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
