import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { colors } from '@/constants/theme';
import { useDeviceLocation } from '@/features/location/location-provider';
import { useListings } from '@/hooks/use-listings';
import { useNearbyListings } from '@/hooks/use-nearby-listings';
import type { ListingType } from '@/types/domain';

const quickLinks: { type?: ListingType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'product', label: 'Productos', icon: 'bag-handle-outline' },
  { type: 'service', label: 'Servicios', icon: 'construct-outline' },
  { type: 'promotion', label: 'Promociones', icon: 'pricetag-outline' },
  { type: 'need', label: 'Necesidades', icon: 'megaphone-outline' },
  { label: 'Cerca de ti', icon: 'location-outline' },
];

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ListingType>();
  const { listings, isLoading, isError, refresh } = useListings(query, type);
  const { coordinates, permissionStatus, canAskAgain, isLocating, error: locationError, requestLocation, openLocationSettings } = useDeviceLocation();
  const nearby = useNearbyListings(coordinates, 15, type);
  const featured = useMemo(() => listings.slice(0, 4), [listings]);

  useEffect(() => { void requestLocation(); }, [requestLocation]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} tintColor={colors.red} />}
        contentContainerClassName="pb-28"
      >
        <View className="bg-white px-5 pb-5">
          <Text className="mt-1 font-display text-[28px] leading-8 text-navy">Encuentra. Ofrece.{`\n`}Haz tu trato.</Text>
          <Text className="mb-3 mt-5 font-medium text-sm text-ink">¿Qué estás buscando?</Text>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-5 py-5">
          {quickLinks.map((item) => {
            const active = item.type === type && item.type !== undefined;
            return (
              <Pressable key={item.label} onPress={() => setType(active ? undefined : item.type)} className="items-center">
                <View className={`h-14 w-14 items-center justify-center rounded-2xl ${active ? 'bg-brand' : 'bg-white'}`}>
                  <Ionicons name={item.icon} size={25} color={active ? colors.white : colors.navy} />
                </View>
                <Text className={`mt-2 font-medium text-[11px] ${active ? 'text-brand' : 'text-muted'}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? <ActivityIndicator className="my-16" color={colors.red} /> : isError ? (
          <EmptyState icon="cloud-offline-outline" title="No pudimos cargar las publicaciones" description="Revisa tu conexión y desliza para volver a intentar." />
        ) : listings.length === 0 ? (
          <EmptyState title="No encontramos resultados" description="Prueba otra palabra o quita el filtro seleccionado." />
        ) : (
          <>
            <View className="mb-3 flex-row items-end justify-between px-5">
              <View><Text className="font-display text-2xl text-navy">Explora por tu zona</Text><Text className="mt-1 font-sans text-sm text-muted">Opciones destacadas en Bagua</Text></View>
              <Text className="font-medium text-sm text-brand">Ver todo</Text>
            </View>
            <FlatList horizontal data={featured} keyExtractor={(item) => item.id} renderItem={({ item }) => <ListingCard listing={item} horizontal />} showsHorizontalScrollIndicator={false} contentContainerClassName="px-5" />
            <Text className="mb-3 mt-7 px-5 font-display text-2xl text-navy">Recomendados cerca de ti</Text>
            {permissionStatus === Location.PermissionStatus.DENIED ? (
              <View className="mx-5 rounded-3xl bg-white p-6">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50"><Ionicons name="location-outline" size={25} color={colors.red} /></View>
                <Text className="mt-4 font-display text-xl text-navy">Activa tu ubicación</Text>
                <Text className="mt-2 font-sans leading-5 text-muted">No podemos mostrar recomendaciones cercanas porque el permiso de ubicación no está activado.</Text>
                <Pressable onPress={() => void (canAskAgain ? requestLocation() : openLocationSettings())} className="mt-5 self-start rounded-full bg-navy px-5 py-3">
                  <Text className="font-medium text-sm text-white">{canAskAgain ? 'Permitir ubicación' : 'Abrir configuración'}</Text>
                </Pressable>
              </View>
            ) : isLocating || permissionStatus === Location.PermissionStatus.UNDETERMINED ? (
              <View className="items-center py-12"><ActivityIndicator color={colors.red} /><Text className="mt-3 font-sans text-sm text-muted">Buscando opciones cerca de ti…</Text></View>
            ) : locationError ? (
              <View className="mx-5 rounded-2xl bg-white p-5"><Text className="font-sans text-sm leading-5 text-muted">{locationError}</Text></View>
            ) : nearby.isLoading ? (
              <ActivityIndicator className="my-12" color={colors.red} />
            ) : nearby.data?.length ? (
              <View className="flex-row flex-wrap gap-x-3 px-5">
                {nearby.data.map((item) => <View key={item.id} className="w-[48%]"><ListingCard listing={item} /></View>)}
              </View>
            ) : (
              <View className="mx-5 rounded-2xl bg-white p-5"><Text className="font-medium text-navy">No encontramos publicaciones en un radio de 15 km.</Text></View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
