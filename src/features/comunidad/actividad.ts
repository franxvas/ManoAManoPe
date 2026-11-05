import { adoptionStatus } from './adopciones/model';
import { db } from './api';
import { donationStatus } from './donaciones/model';
import { eventPhase, phaseBadges, seatsInfo, type CommunityEvent } from './eventos/model';
import type { Tone } from './types';

export interface MyPublication {
  id: string;
  kind: 'donation' | 'adoption' | 'event' | 'workshop';
  title: string;
  photo: string | null;
  badge: { label: string; tone: Tone };
  detail: string;
  pending: number;
}

// Eventos y talleres donde el usuario tiene una inscripción activa.
export async function fetchMyRegistrations(userId: string) {
  const { data, error } = await db()
    .from('event_registrations')
    .select('id, event:community_events(*)')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.event as CommunityEvent | null)
    .filter((event): event is CommunityEvent => Boolean(event))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

// Todo lo que el usuario publicó, con cuántas solicitudes esperan su respuesta.
export async function fetchMyPublications(userId: string): Promise<MyPublication[]> {
  const [donations, adoptions, events] = await Promise.all([
    db().from('donations').select('id, title, status, photos, created_at').eq('owner_id', userId),
    db().from('adoptions').select('id, pet_name, status, photos, created_at').eq('owner_id', userId),
    db().from('community_events').select('*').eq('organizer_id', userId),
  ]);
  for (const result of [donations, adoptions, events]) if (result.error) throw result.error;

  const donationIds = (donations.data ?? []).map((row) => row.id);
  const adoptionIds = (adoptions.data ?? []).map((row) => row.id);
  const [requests, applications] = await Promise.all([
    donationIds.length ? db().from('donation_requests').select('donation_id').eq('status', 'pending').in('donation_id', donationIds) : { data: [], error: null },
    adoptionIds.length ? db().from('adoption_applications').select('adoption_id').in('status', ['pending', 'evaluating']).in('adoption_id', adoptionIds) : { data: [], error: null },
  ]);
  if (requests.error) throw requests.error;
  if (applications.error) throw applications.error;
  const pendingFor = (rows: Record<string, string>[], key: string, id: string) => rows.filter((row) => row[key] === id).length;

  return [
    ...(donations.data ?? []).map((row: any) => {
      const pending = pendingFor(requests.data as any[], 'donation_id', row.id);
      return { id: row.id, kind: 'donation' as const, title: row.title, photo: row.photos[0] ?? null, badge: donationStatus[row.status as keyof typeof donationStatus], detail: requestText(pending), pending, sort: row.created_at };
    }),
    ...(adoptions.data ?? []).map((row: any) => {
      const pending = pendingFor(applications.data as any[], 'adoption_id', row.id);
      return { id: row.id, kind: 'adoption' as const, title: row.pet_name, photo: row.photos[0] ?? null, badge: adoptionStatus[row.status as keyof typeof adoptionStatus], detail: requestText(pending), pending, sort: row.created_at };
    }),
    ...((events.data ?? []) as CommunityEvent[]).map((event) => ({
      id: event.id,
      kind: event.kind,
      title: event.title,
      photo: event.photo,
      badge: phaseBadges[eventPhase(event)],
      detail: event.requires_registration ? seatsInfo(event).text : 'Entrada libre',
      pending: 0,
      sort: event.starts_at,
    })),
  ]
    .sort((a, b) => b.pending - a.pending || b.sort.localeCompare(a.sort))
    .map(({ sort, ...publication }) => publication);
}

function requestText(pending: number) {
  if (!pending) return 'Sin solicitudes nuevas';
  return pending === 1 ? '1 solicitud por revisar' : `${pending} solicitudes por revisar`;
}
