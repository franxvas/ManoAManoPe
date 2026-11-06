import { useSaved } from '@/features/guardados/use-saved';
export function useFavorites() {
  const { ids, toggle } = useSaved('listing');
  return { favorites: ids, toggleFavorite: toggle };
}
