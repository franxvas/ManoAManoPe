import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/stores/app-store';
import { fetchSavedIds, type SavedType } from './api';
import { savedQueryKey, toggleSavedInCache } from './mutation';
export function useSaved(type: SavedType) {
  const { session } = useAuth();
  const cache = useQueryClient();
  const local = useAppStore((state) => state.favorites);
  const toggleLocal = useAppStore((state) => state.toggleFavorite);
  const query = useQuery({ queryKey: savedQueryKey(type, session?.user.id), queryFn: () => fetchSavedIds(type), enabled: isSupabaseConfigured && Boolean(session) });
  const ids = isSupabaseConfigured ? (query.data ?? []) : type === 'listing' ? local : [];
  async function toggle(id: string) {
    if (!isSupabaseConfigured && type === 'listing') { toggleLocal(id); return; }
    if (!session) throw new Error('Inicia sesión con tu cuenta para guardar este contenido.');
    if (query.isError) throw new Error('No pudimos consultar tus guardados. Revisa tu conexión.');
    await toggleSavedInCache(cache, type, session.user.id, id);
  }
  return { ids, isSaved: (id: string) => ids.includes(id), toggle, isLoading: query.isLoading, isError: query.isError };
}
