import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { useFavorites } from '@/hooks/use-favorites';
import { useListings } from '@/hooks/use-listings';

export default function FavoritesScreen() {
  const { favorites: favoriteIds } = useFavorites();
  const { listings } = useListings();
  const favorites = listings.filter((item) => favoriteIds.includes(item.id));
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Favoritos" showBack />
      <FlatList
        data={favorites} keyExtractor={(item) => item.id} numColumns={2} columnWrapperClassName="gap-3" contentContainerClassName="p-5"
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={<EmptyState icon="heart-outline" title="Sin favoritos todavía" description="Toca el corazón de una publicación para guardarla aquí." />}
      />
    </SafeAreaView>
  );
}
