import type { QueryClient } from '@tanstack/react-query';
import { setSaved, type SavedType } from './api';
export const savedQueryKey = (type: SavedType, userId?: string) => ['saved', type, userId] as const;
export async function toggleSavedInCache(cache: QueryClient, type: SavedType, userId: string, id: string) {
  const key = savedQueryKey(type, userId);
  const pending = ['saved-pending', type, userId, id];
  if (cache.getQueryData(pending)) return;
  cache.setQueryData(pending, true);
  await cache.cancelQueries({ queryKey: key, exact: true });
  const wasSaved = (cache.getQueryData<string[]>(key) ?? []).includes(id);
  cache.setQueryData<string[]>(key, (current = []) => wasSaved ? current.filter((entry) => entry !== id) : [...current.filter((entry) => entry !== id), id]);
  try {
    await setSaved(type, id, !wasSaved);
  } catch (error) {
    cache.setQueryData<string[]>(key, (current = []) => wasSaved ? [...current.filter((entry) => entry !== id), id] : current.filter((entry) => entry !== id));
    throw error;
  } finally {
    const active = cache.getQueriesData<boolean>({ queryKey: ['saved-pending', type, userId] }).filter(([, value]) => value).length;
    try {
      await Promise.all([
        active === 1 ? cache.invalidateQueries({ queryKey: key, exact: true }) : Promise.resolve(),
        cache.invalidateQueries({ queryKey: ['saved-entries'] }),
        type === 'event' ? cache.invalidateQueries({ queryKey: ['event-saves'] }) : Promise.resolve(),
      ]);
    } finally { cache.setQueryData(pending, false); }
  }
}
