import { db, photoUrl } from '@/features/comunidad/api';
import { mapListingRow } from '@/services/listings';

export type SavedType = 'listing' | 'donation' | 'adoption' | 'event' | 'resource' | 'mano';

export interface SavedEntry {
  type: SavedType;
  id: string;
  title: string;
  subtitle: string;
  photo: string | null;
  savedAt: string;
  resourceKind?: 'loan' | 'rental';
}

export async function fetchSavedIds(type: SavedType) {
  const { data, error } = await db().from('saved_items').select('item_id').eq('item_type', type);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.item_id));
}

export async function setSaved(type: SavedType, id: string, saved: boolean) {
  const { error } = saved
    ? await db().from('saved_items').insert({ item_type: type, item_id: id })
    : await db().from('saved_items').delete().eq('item_type', type).eq('item_id', id);
  // Si ya estaba guardado (doble toque), no es un error.
  if (error && error.code !== '23505') throw error;
}

const labels: Record<SavedType, string> = {
  listing: 'Publicación',
  donation: 'Donación',
  adoption: 'Adopción',
  event: 'Evento',
  resource: 'Préstamo o alquiler',
  mano: 'Necesito una mano',
};

// Trae todo lo guardado con sus datos. Lo que el dueño borró ya no aparece.
export async function fetchSavedEntries(): Promise<SavedEntry[]> {
  const { data, error } = await db().from('saved_items').select('item_type, item_id, created_at').order('created_at', { ascending: false });
  if (error) throw error;
  const saved = data ?? [];
  const idsOf = (type: SavedType) => saved.filter((row) => row.item_type === type).map((row) => String(row.item_id));
  const query = async (table: string, columns: string, type: SavedType) => {
    const ids = idsOf(type);
    if (!ids.length) return [];
    const result = await db().from(table).select(columns).in('id', ids);
    if (result.error) throw result.error;
    return (result.data ?? []) as any[];
  };

  const [listings, donations, adoptions, events, resources, manos] = await Promise.all([
    query('listing_feed', '*', 'listing'),
    query('donations', 'id, title, zone, photos', 'donation'),
    query('adoptions', 'id, pet_name, zone, photos', 'adoption'),
    query('community_events', 'id, title, kind, place, photo, starts_at', 'event'),
    query('resource_posts', 'id, title, zone, photos, kind', 'resource'),
    query('mano_requests', 'id, title, category, photos', 'mano'),
  ]);

  const details = new Map<string, Omit<SavedEntry, 'savedAt'>>();
  const add = (type: SavedType, id: string, title: string, subtitle: string, photo: string | null, resourceKind?: 'loan' | 'rental') =>
    details.set(`${type}:${id}`, { type, id, title, subtitle: `${labels[type]} · ${subtitle}`, photo, resourceKind });

  listings.map(mapListingRow).forEach((item) => add('listing', item.id, item.title, item.ownerName, item.images[0] ?? null));
  donations.forEach((row) => add('donation', row.id, row.title, row.zone, row.photos[0] ? photoUrl(row.photos[0]) : null));
  adoptions.forEach((row) => add('adoption', row.id, row.pet_name, row.zone, row.photos[0] ? photoUrl(row.photos[0]) : null));
  events.forEach((row) => add('event', row.id, row.title, row.place, row.photo ? photoUrl(row.photo) : null));
  resources.forEach((row) => add('resource', row.id, row.title, row.zone, row.photos?.[0] ? photoUrl(row.photos[0]) : null, row.kind));
  manos.forEach((row) => add('mano', row.id, row.title, row.category, row.photos?.[0]?.startsWith('http') ? row.photos[0] : null));

  return saved.flatMap((row) => {
    const entry = details.get(`${row.item_type}:${row.item_id}`);
    return entry ? [{ ...entry, savedAt: String(row.created_at) }] : [];
  });
}
