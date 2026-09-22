import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/listing-card';
import { NearbyMap } from '@/components/nearby-map';
import type { MapRegion } from '@/components/nearby-map.types';
import { SearchBar } from '@/components/search-bar';
import { colors } from '@/constants/theme';
import { demoCategories } from '@/constants/demo';
import { useDeviceLocation } from '@/features/location/location-provider';
import { useNearbyListings } from '@/hooks/use-nearby-listings';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchCategories } from '@/services/listings';
import type { Listing, ListingType } from '@/types/domain';
import { getListingAmount } from '@/utils/format';

const BAGUA_REGION: MapRegion = { latitude: -5.6395, longitude: -78.5325, latitudeDelta: 0.045, longitudeDelta: 0.045 };
const filters: { label: string; value?: ListingType }[] = [{ label: 'Todos' }, { label: 'Productos', value: 'product' }, { label: 'Servicios', value: 'service' }, { label: 'Promos', value: 'promotion' }, { label: 'Necesidades', value: 'need' }];

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ListingType>();
  const [selected, setSelected] = useState<Listing>();
  const [region, setRegion] = useState(BAGUA_REGION);
  const [radiusKm, setRadiusKm] = useState(15);
  const [maxPrice, setMaxPrice] = useState<number>();
  const [categoryId, setCategoryId] = useState<string>();
  const hasCenteredOnUser = useRef(false);
  const { coordinates, permissionStatus, canAskAgain, isLocating, requestLocation, openLocationSettings } = useDeviceLocation();
  const searchCenter = coordinates ? { latitude: region.latitude, longitude: region.longitude } : null;
  const nearby = useNearbyListings(searchCenter, radiusKm, type, categoryId);
  const remoteCategories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, enabled: isSupabaseConfigured });
  const categories = (isSupabaseConfigured ? (remoteCategories.data ?? []) : demoCategories).filter((item) => !type || item.type === type);
  const source = nearby.data ?? [];
  const normalizedQuery = query.trim().toLocaleLowerCase('es-PE');
  const listings = source.filter((item) => (!categoryId || item.categoryId === categoryId) && (!maxPrice || (getListingAmount(item.price, item.budget) ?? 0) <= maxPrice) && (!normalizedQuery || `${item.title} ${item.description} ${item.ownerName}`.toLocaleLowerCase('es-PE').includes(normalizedQuery)));

  const markers = useMemo(() => listings.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)), [listings]);
  const selectListing = (listing: Listing) => setSelected(listing);

  useEffect(() => { void requestLocation(); }, [requestLocation]);
  useEffect(() => {
    if (!coordinates || hasCenteredOnUser.current) return;
    hasCenteredOnUser.current = true;
    setRegion((current) => ({ ...current, ...coordinates }));
  }, [coordinates]);

  const askForLocation = () => void (canAskAgain ? requestLocation() : openLocationSettings());

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="px-5 pb-3 pt-2">
        <Text className="font-display text-3xl text-navy">Explora cerca de ti</Text>
        <Text className="mb-4 mt-1 font-sans text-sm text-muted">Descubre lo que ofrece tu comunidad</Text>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar en el mapa..." />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerClassName="gap-2 px-5 pb-3">
        {filters.map((filter) => {
          const active = type === filter.value;
          return <Pressable key={filter.label} onPress={() => setType(filter.value)} className={`rounded-full border px-4 py-2 ${active ? 'border-brand bg-brand' : 'border-line bg-white'}`}><Text className={`font-medium text-xs ${active ? 'text-white' : 'text-navy'}`}>{filter.label}</Text></Pressable>;
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerClassName="gap-2 px-5 pb-3">
        <Pressable onPress={() => setRadiusKm((value) => value === 5 ? 15 : value === 15 ? 30 : 5)} className="flex-row items-center rounded-full bg-blue-50 px-4 py-2"><Ionicons name="navigate-outline" size={15} color={colors.navy} /><Text className="ml-1.5 font-medium text-xs text-navy">{radiusKm} km</Text></Pressable>
        <Pressable onPress={() => setMaxPrice((value) => value == null ? 50 : value === 50 ? 200 : undefined)} className="rounded-full bg-red-50 px-4 py-2"><Text className="font-medium text-xs text-brand">{maxPrice ? `Hasta S/ ${maxPrice}` : 'Cualquier precio'}</Text></Pressable>
        <Pressable onPress={() => { const current = categories.findIndex((item) => item.id === categoryId); setCategoryId(categories[current + 1]?.id); }} className="rounded-full bg-white px-4 py-2"><Text className="font-medium text-xs text-navy">{categories.find((item) => item.id === categoryId)?.name ?? 'Todas las categorías'}</Text></Pressable>
      </ScrollView>
      <View className="flex-1 overflow-hidden border-t border-line bg-slate-100">
        <NearbyMap
          listings={markers}
          region={region}
          selectedId={selected?.id}
          userCoordinates={coordinates}
          locationUnavailable={!isLocating && permissionStatus !== Location.PermissionStatus.GRANTED}
          onRegionChange={setRegion}
          onSelect={selectListing}
          onRequestLocation={askForLocation}
        />
        <View className="absolute bottom-4 left-0 right-0">
          {selected ? (
            <View className="px-5"><ListingCard listing={selected} horizontal /></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5">
              {listings.slice(0, 5).map((item) => <Pressable key={item.id} onPress={() => selectListing(item)}><ListingCard listing={item} horizontal /></Pressable>)}
            </ScrollView>
          )}
        </View>
        {selected && <Pressable onPress={() => router.push({ pathname: '/listing/[id]', params: { id: selected.id } })} className="absolute bottom-7 right-9 h-11 w-11 items-center justify-center rounded-full bg-brand"><Ionicons name="arrow-forward" size={22} color="white" /></Pressable>}
      </View>
    </SafeAreaView>
  );
}
