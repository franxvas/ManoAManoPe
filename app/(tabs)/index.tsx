import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRequests } from '@/features/mano/api';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingState, OfflineNotice } from '@/components/feedback-state';
import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { colors, listingColors } from '@/constants/theme';
import { useDeviceLocation } from '@/features/location/location-provider';
import { useListings } from '@/hooks/use-listings';
import { useNearbyListings } from '@/hooks/use-nearby-listings';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Listing, ListingType } from '@/types/domain';

const categories: { type?: ListingType; label: string }[] = [
  { label: 'Todo' },
  { type: 'product', label: 'Productos' },
  { type: 'service', label: 'Servicios' },
  { type: 'promotion', label: 'Promociones' },
  { type: 'need', label: 'Necesidades' },
];

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ListingType>();
  const { listings, isLoading, isError, refresh, cached } = useListings(query, type);
  const { coordinates, isLocating, error: locationError, requestLocation, canAskAgain, openLocationSettings } = useDeviceLocation();
  const nearby = useNearbyListings(coordinates, 15, type);
  const browsing = !query.trim() && !type;
  const promotions = listings.filter((item) => item.type === 'promotion' && (!item.validUntil || item.validUntil >= new Date().toLocaleDateString('sv-SE')));
  const discoveries = listings.filter((item) => item.type === 'product');
  const needs = listings.filter((item) => item.type === 'need');
  const hands = useQuery({ queryKey: ['home-mano-requests'], queryFn: listRequests, enabled: isSupabaseConfigured });
  const services = listings.filter((item) => item.type === 'service');
  const nearbyRows = (nearby.data ?? []).filter((item) => !query.trim() || `${item.title} ${item.description} ${item.ownerName}`.toLocaleLowerCase('es-PE').includes(query.trim().toLocaleLowerCase('es-PE')));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader hideSearch />
      <View className="bg-canvas px-4 pb-2">
        <SearchBar value={query} onChangeText={setQuery} placeholder="¿Qué estás buscando?" />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36" refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { void refresh(); void hands.refetch(); }} tintColor={colors.red} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 py-3">
          {categories.map((item) => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: type === item.type }} onPress={() => setType(item.type)} style={{ backgroundColor: type === item.type ? (item.type ? listingColors[item.type].foreground : colors.red) : colors.white, borderColor: type === item.type ? (item.type ? listingColors[item.type].foreground : colors.red) : colors.border }} className="min-h-11 justify-center rounded-full border px-4">
              <Text className={`font-medium text-xs ${type === item.type ? 'text-white' : 'text-ink'}`}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {!isSupabaseConfigured && <Text className="mb-3 px-4 font-sans text-xs text-muted">Vista de ejemplo · las publicaciones no son reales</Text>}
        {cached && <OfflineNotice onRetry={() => void refresh()} />}
        {isLoading ? <LoadingState /> : isError ? (
          <View><EmptyState icon="cloud-offline-outline" title="No pudimos cargar las publicaciones" description="Revisa tu conexión y vuelve a intentarlo." /><Pressable accessibilityRole="button" onPress={() => void refresh()} className="self-center p-3"><Text className="font-medium text-brand">Reintentar</Text></Pressable></View>
        ) : listings.length === 0 ? (
          <EmptyState title="No encontramos resultados" description="Prueba otra palabra o selecciona Todo." />
        ) : (!browsing || discoveries.length > 0) && <ListingSection title={browsing ? 'Descubre lo que hay' : `${listings.length} resultados`} rows={browsing ? discoveries : listings} limit={browsing ? 8 : listings.length} showMap />}

        {browsing && promotions.length > 0 && <ListingSection title="Promociones" rows={promotions} accent="promotion" />}
        {browsing && <View className="mb-5">
          <View className="mb-2 flex-row items-center justify-between px-4"><Text className="font-display text-xl text-ink">Dame una mano</Text><Pressable accessibilityRole="button" onPress={() => router.push('/mano')} className="min-h-11 justify-center pl-3"><Text className="font-medium text-xs text-brand">Ver todas →</Text></Pressable></View>
          {hands.isLoading ? <LoadingState /> : hands.isError ? <View className="mx-4 rounded-2xl bg-white p-4"><Text className="font-sans text-sm text-muted">No pudimos cargar las solicitudes.</Text><Pressable accessibilityRole="button" onPress={() => void hands.refetch()} className="min-h-11 justify-center"><Text className="font-medium text-xs text-brand">Reintentar</Text></Pressable></View> : hands.data?.length ? <FlatList horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4" data={hands.data.slice(0, 8)} keyExtractor={item => item.id} renderItem={({item}) => <Pressable accessibilityRole="button" onPress={() => router.push({pathname: '/mano', params: {requestId: item.id}})} className="w-56 rounded-2xl border border-line bg-white p-4"><Ionicons name="hand-left-outline" size={22} color={colors.red}/><Text numberOfLines={2} className="mt-2 font-medium text-sm text-ink">{item.title}</Text><Text numberOfLines={2} className="mt-1 font-sans text-xs text-muted">{item.description}</Text><Text numberOfLines={1} className="mt-3 font-sans text-xs text-muted">{item.approximate_location}</Text></Pressable>} /> : <Pressable accessibilityRole="button" onPress={() => router.push('/mano')} className="mx-4 rounded-2xl border border-line bg-white p-4"><Text className="font-medium text-sm text-ink">¿Necesitas ayuda con algo?</Text><Text className="mt-1 font-sans text-xs text-muted">Publica tu solicitud para que puedan darte una mano.</Text><Text className="mt-3 font-medium text-xs text-brand">Pedir una mano →</Text></Pressable>}
        </View>}
        {browsing && needs.length > 0 && <ListingSection title="Se busca cerca de ti" rows={needs} accent="need" />}
        {browsing && services.length > 0 && <ListingSection title="Servicios para ti" rows={services} accent="service" />}

        <View className="mx-4 mb-3 mt-2 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center gap-2"><Ionicons name="location-outline" size={20} color={colors.red} /><Text className="font-display text-lg text-ink">Cerca de ti</Text></View>
          <Text className="mb-2 mt-1 font-sans text-xs leading-5 text-muted">{coordinates ? 'Publicaciones a menos de 15 km.' : 'Usa tu ubicación para encontrar opciones cercanas.'}</Text>
          {!!locationError && <Text accessibilityRole="alert" className="mb-2 text-xs text-muted">{locationError}</Text>}
          <Pressable accessibilityRole="button" disabled={isLocating} onPress={() => void (canAskAgain ? requestLocation() : openLocationSettings())} className="min-h-11 justify-center self-start rounded-xl bg-red-50 px-4">
            <Text className="font-medium text-xs text-brand">{isLocating ? 'Obteniendo ubicación…' : coordinates ? 'Actualizar ubicación' : canAskAgain ? 'Usar mi ubicación' : 'Revisar permisos'}</Text>
          </Pressable>
        </View>
        {coordinates && (nearby.isLoading ? <LoadingState label="Buscando publicaciones cercanas…" /> : nearby.isError ? (
          <Text accessibilityRole="alert" className="px-4 pb-4 text-sm text-muted">No pudimos cargar las opciones cercanas. Puedes seguir viendo las demás publicaciones.</Text>
        ) : nearbyRows.length ? <ListingSection title="En tu zona" rows={nearbyRows} /> : <Text className="px-4 pb-4 text-sm text-muted">No encontramos resultados dentro de 15 km.</Text>)}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingSection({ title, rows, showMap = false, limit = 8, accent }: { title: string; rows: Listing[]; showMap?: boolean; limit?: number; accent?: ListingType }) {
  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center justify-between px-4">
        <View className="flex-1 flex-row items-center gap-2"><View style={{backgroundColor: accent ? listingColors[accent].foreground : colors.red}} className="h-5 w-1 rounded-full"/><Text className="font-display text-xl text-ink">{title}</Text></View>
        {showMap && <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/explore')} className="min-h-11 justify-center pl-3"><Text className="font-medium text-xs text-brand">Explorar →</Text></Pressable>}
      </View>
      <FlatList horizontal data={rows.slice(0, limit)} keyExtractor={(item) => item.id} renderItem={({ item }) => <ListingCard listing={item} horizontal compact />} showsHorizontalScrollIndicator={false} contentContainerClassName="px-4" />
    </View>
  );
}
