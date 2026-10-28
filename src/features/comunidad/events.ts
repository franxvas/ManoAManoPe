import { db, rpc, uploadPhotos } from './api';
import type { CommunityEvent } from './event-model';

type WorkshopFields = 'topic' | 'instructor' | 'level' | 'materials' | 'modality' | 'registration_deadline';
export type EventInput = Omit<CommunityEvent, 'id' | 'organizer_id' | 'photo' | 'registered_count' | WorkshopFields> &
  Partial<Pick<CommunityEvent, WorkshopFields>> & { photo: { uri: string; path?: string } | null };

export async function fetchEvents(kind: CommunityEvent['kind'] = 'event') {
  const { data, error } = await db().from('community_events').select('*').eq('kind', kind).order('starts_at').limit(200);
  if (error) throw error;
  return (data ?? []) as CommunityEvent[];
}

export async function fetchEvent(id: string) {
  const { data, error } = await db().from('community_events').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as CommunityEvent | null;
}

// Al editar no se manda "kind": un evento no puede convertirse en taller ni al revés.
export async function saveEvent({ photo, kind, ...input }: EventInput, id?: string) {
  const [path] = photo ? await uploadPhotos('eventos', [photo]) : [];
  const row = { ...input, photo: path ?? null };
  const request = id ? db().from('community_events').update(row).eq('id', id) : db().from('community_events').insert({ ...row, kind });
  const { data, error } = await request.select('id').single();
  if (error) throw error;
  return String(data.id);
}

export async function deleteEvent(id: string) {
  const { error } = await db().from('community_events').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchSavedEventIds() {
  const { data, error } = await db().from('event_saves').select('event_id');
  if (error) throw error;
  return new Set((data ?? []).map((row) => String(row.event_id)));
}

export async function isRegistered(eventId: string, userId: string) {
  const { data, error } = await db().from('event_registrations').select('id').eq('event_id', eventId).eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export const registerForEvent = (eventId: string) => rpc<string>('register_for_event', { p_event: eventId });
export const cancelRegistration = (eventId: string) => rpc('cancel_event_registration', { p_event: eventId });

export async function toggleSavedEvent(eventId: string, saved: boolean) {
  const { error } = saved
    ? await db().from('event_saves').delete().eq('event_id', eventId)
    : await db().from('event_saves').insert({ event_id: eventId });
  if (error) throw error;
}
