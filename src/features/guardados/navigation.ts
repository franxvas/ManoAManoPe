import type { Href } from 'expo-router';
import type { SavedEntry } from './api';
export function savedRoute(entry: Pick<SavedEntry, 'type' | 'id' | 'resourceKind'>): Href {
  if (entry.type === 'listing') return { pathname: '/listing/[id]', params: { id: entry.id } };
  if (entry.type === 'donation') return { pathname: '/comunidad/donaciones/[id]', params: { id: entry.id } };
  if (entry.type === 'adoption') return { pathname: '/comunidad/adopciones/[id]', params: { id: entry.id } };
  if (entry.type === 'event') return { pathname: '/comunidad/eventos/[id]', params: { id: entry.id } };
  if (entry.type === 'resource') return { pathname: entry.resourceKind === 'rental' ? '/alquileres' : '/prestamos', params: { postId: entry.id } };
  return { pathname: '/mano', params: { requestId: entry.id } };
}
