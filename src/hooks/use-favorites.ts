import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchFavoriteIds, toggleRemoteFavorite } from '@/services/user-data';
import { useAppStore } from '@/stores/app-store';

export function useFavorites() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const local = useAppStore((state) => state.favorites);
  const toggleLocal = useAppStore((state) => state.toggleFavorite);
  const remote = useQuery({ queryKey: ['favorites', session?.user.id], queryFn: fetchFavoriteIds, enabled: isSupabaseConfigured && Boolean(session) });
  const favorites = isSupabaseConfigured ? (remote.data ?? []) : local;
  const toggleFavorite = async (listingId: string) => {
    if (!isSupabaseConfigured) return toggleLocal(listingId);
    const previous = favorites;
    const currentlyFavorite = previous.includes(listingId);
    queryClient.setQueryData(['favorites', session?.user.id], currentlyFavorite ? previous.filter((id) => id !== listingId) : [...previous, listingId]);
    try { await toggleRemoteFavorite(listingId, currentlyFavorite); }
    catch (error) { queryClient.setQueryData(['favorites', session?.user.id], previous); throw error; }
  };
  return { favorites, toggleFavorite };
}
