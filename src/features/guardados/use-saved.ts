import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchSavedIds, setSaved, type SavedType } from './api';

// Ids guardados de un tipo, con cambio inmediato en pantalla y vuelta atrás si falla.
export function useSaved(type: SavedType) {
  const { session } = useAuth();
  const cache = useQueryClient();
  const key = ['saved', type, session?.user.id];
  const query = useQuery({ queryKey: key, queryFn: () => fetchSavedIds(type), enabled: isSupabaseConfigured && Boolean(session) });
  const ids = query.data ?? [];

  async function toggle(id: string) {
    const previous = ids;
    const saved = previous.includes(id);
    cache.setQueryData(key, saved ? previous.filter((item) => item !== id) : [...previous, id]);
    try {
      await setSaved(type, id, !saved);
      await cache.invalidateQueries({ queryKey: ['saved-entries'] });
    } catch (error) {
      cache.setQueryData(key, previous);
      throw error;
    }
  }

  return { ids, isSaved: (id: string) => ids.includes(id), toggle };
}
