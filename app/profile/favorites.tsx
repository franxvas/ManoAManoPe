import { savedRoute } from '@/features/guardados/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { FilterChips } from '@/features/comunidad/components';
import { fetchSavedEntries, type SavedType } from '@/features/guardados/api';
import { FavoriteButton } from '@/features/guardados/favorite-button';
import { useFavorites } from '@/hooks/use-favorites';
import { useListings } from '@/hooks/use-listings';
import { isSupabaseConfigured } from '@/lib/supabase';

const tabs: { label: string; value: SavedType | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Publicaciones', value: 'listing' },
  { label: 'Donaciones', value: 'donation' },
  { label: 'Adopciones', value: 'adoption' },
  { label: 'Eventos', value: 'event' },
  { label: 'Préstamos y alquileres', value: 'resource' },
  { label: 'Necesito una mano', value: 'mano' },
];

const icons: Record<SavedType, keyof typeof Ionicons.glyphMap> = {
  listing: 'pricetag-outline',
  donation: 'gift-outline',
  adoption: 'paw-outline',
  event: 'calendar-outline',
  resource: 'swap-horizontal-outline',
  mano: 'hand-left-outline',
};


export default function SavedScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Mis guardados" showBack />
      {isSupabaseConfigured ? <SavedList /> : <DemoFavorites />}
    </SafeAreaView>
  );
}

function SavedList() {
  const { session } = useAuth();
  const [tab, setTab] = useState<SavedType>();
  const query = useQuery({ queryKey: ['saved-entries', session?.user.id], queryFn: fetchSavedEntries, enabled: Boolean(session), staleTime: 0 });
  const entries = (query.data ?? []).filter((entry) => !tab || entry.type === tab);

  if (!session) return <EmptyState icon="heart-outline" title="Inicia sesión" description="Guarda lo que te interesa y encuéntralo aquí." />;
  return (
    <FlatList
      data={entries}
      keyExtractor={(entry) => `${entry.type}:${entry.id}`}
      contentContainerClassName="gap-3 p-5 pb-12"
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      ListHeaderComponent={<FilterChips options={tabs} value={tab} onChange={setTab} />}
      ListEmptyComponent={
        query.isLoading ? (
          <ActivityIndicator className="mt-10" color={colors.red} />
        ) : query.isError ? (
          <EmptyState icon="cloud-offline-outline" title="No pudimos cargar tus guardados" description={query.error.message} />
        ) : (
          <EmptyState icon="heart-outline" title="Nada guardado todavía" description="Toca el corazón en cualquier publicación, donación, evento o pedido para guardarlo aquí." />
        )
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push(savedRoute(item))} className="flex-row items-center rounded-2xl bg-white p-3">
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={{ width: 64, height: 64, borderRadius: 14 }} contentFit="cover" />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <Ionicons name={icons[item.type]} size={26} color={colors.red} />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text numberOfLines={2} className="font-medium text-ink">{item.title}</Text>
            <Text numberOfLines={1} className="mt-1 font-sans text-xs text-muted">{item.subtitle}</Text>
          </View>
          <FavoriteButton type={item.type} id={item.id} size="sm" />
        </Pressable>
      )}
    />
  );
}

// Sin Supabase solo existen las publicaciones de demostración.
function DemoFavorites() {
  const { favorites: favoriteIds } = useFavorites();
  const { listings } = useListings();
  return (
    <FlatList
      data={listings.filter((item) => favoriteIds.includes(item.id))}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperClassName="gap-3"
      contentContainerClassName="p-5"
      renderItem={({ item }) => <ListingCard listing={item} />}
      ListEmptyComponent={<EmptyState icon="heart-outline" title="Sin favoritos todavía" description="Toca el corazón de una publicación para guardarla aquí." />}
    />
  );
}
