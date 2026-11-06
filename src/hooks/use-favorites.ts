import { isSupabaseConfigured } from '@/lib/supabase';
import { useSaved } from '@/features/guardados/use-saved';
import { useAppStore } from '@/stores/app-store';

export function useFavorites() {
  const saved = useSaved('listing');
  const local = useAppStore(state => state.favorites);
  const toggleLocal = useAppStore(state => state.toggleFavorite);
  return {
    favorites: isSupabaseConfigured ? saved.ids : local,
    toggleFavorite: async (id: string) => {
      if (isSupabaseConfigured) await saved.toggle(id);
      else toggleLocal(id);
    },
  };
}
