import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View, Image, StyleSheet } from 'react-native';
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
import { getAlquileres, Recurso } from '@/features/recursos/recursosStore';
import { useAuth } from '@/features/auth/auth-provider';
import { coincide, interesesDe } from '@/features/preferencias/intereses';

const categories: { type?: ListingType | 'alquiler'; label: string }[] = [
  { label: 'Todo' },
  { type: 'product', label: 'Productos' },
  { type: 'service', label: 'Servicios' },
  { type: 'promotion', label: 'Promociones' },
  { type: 'need', label: 'Necesidades' },
  { type: 'alquiler', label: 'Alquileres' },
];

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ListingType | 'alquiler' | undefined>(undefined);
  const [alquileresList, setAlquileresList] = useState<Recurso[]>([]);

  useFocusEffect(
    useCallback(() => {
      setAlquileresList(getAlquileres());
    }, [])
  );

  const { listings, isLoading, isError, refresh, cached } = useListings(query, type === 'alquiler' ? undefined : type);
  const { coordinates, isLocating, error: locationError, requestLocation, canAskAgain, openLocationSettings } = useDeviceLocation();
  const nearby = useNearbyListings(coordinates, 15, type === 'alquiler' ? undefined : type);
  const browsing = !query.trim() && !type;
  
  const { session } = useAuth();
  const misIntereses = interesesDe(session);
  const promotions = listings.filter((item) => item.type === 'promotion' && (!item.validUntil || item.validUntil >= new Date().toLocaleDateString('sv-SE')));
  // Con intereses guardados, se muestran las promociones que coinciden; si ninguna coincide, todas.
  const paraTi = promotions.filter((item) => coincide(item, misIntereses));
  const promosInicio = paraTi.length ? paraTi : promotions;
  const discoveries = listings.filter((item) => item.type === 'product');
  const needs = listings.filter((item) => item.type === 'need');
  const services = listings.filter((item) => item.type === 'service');

  // Filtrar alquileres si el tipo seleccionado es 'alquiler'
  const filteredAlquileres = alquileresList.filter(item => 
    !query.trim() || `${item.titulo} ${item.propietario} ${item.condiciones}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader hideSearch />
      <View className="bg-canvas px-4 pb-2">
        <SearchBar value={query} onChangeText={setQuery} placeholder="¿Qué estás buscando?" />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36" refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { void refresh(); }} tintColor={colors.red} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 py-3">
          {categories.map((item) => {
            const isSelected = type === item.type;
            const activeBg = item.type === 'alquiler' ? colors.red : (item.type ? listingColors[item.type]?.foreground : colors.red);

            return (
              <Pressable 
                key={item.label} 
                accessibilityRole="button" 
                accessibilityState={{ selected: isSelected }} 
                onPress={() => setType(item.type)} 
                style={{ 
                  backgroundColor: isSelected ? activeBg : colors.white, 
                  borderColor: isSelected ? activeBg : colors.border 
                }} 
                className="min-h-11 justify-center rounded-full border px-4"
              >
                <Text className={`font-medium text-xs ${isSelected ? 'text-white' : 'text-ink'}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {browsing && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/comunidad')} className="mx-4 mb-4 flex-row items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-red-50"><Ionicons name="people-outline" size={22} color={colors.red} /></View>
            <View className="flex-1">
              <Text className="font-display text-base text-ink">Comunidad</Text>
              <Text className="font-sans text-xs text-muted">Donaciones, adopciones, eventos y talleres</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )}

        {/* VISTA CUANDO SE SELECCIONA ALQUILERES */}
        {type === 'alquiler' ? (
          <View className="px-4 mb-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-5 w-1 rounded-full bg-red-600"/>
                <Text className="font-display text-xl text-ink">{filteredAlquileres.length} resultados de Alquileres</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => router.push('/alquileres/nuevo')} className="bg-red-600 px-4 py-3 rounded-xl">
                <Text className="text-white font-bold text-sm">+ Publicar</Text>
              </Pressable>
            </View>

            {filteredAlquileres.length === 0 ? (
              <EmptyState title="No hay alquileres" description="Sé el primero en publicar un alquiler." />
            ) : (
              <FlatList
                data={filteredAlquileres}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                  <Pressable 
                    accessibilityRole="button"
                    className="w-48 bg-white rounded-2xl border border-line overflow-hidden"
                    onPress={() => router.push(`/alquileres/${item.id}` as any)}
                  >
                    <View className="relative">
                      <Image source={{ uri: item.foto }} className="w-full h-32 bg-gray-200" />
                      <View className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded-md">
                        <Text className="text-white text-[10px] font-bold uppercase">ALQUILER</Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text numberOfLines={2} className="font-medium text-sm text-ink mb-1">{item.titulo}</Text>
                      <Text className="font-bold text-sm text-emerald-600 mb-1">{item.precio}</Text>
                      <Text numberOfLines={1} className="text-[11px] text-muted">Por: {item.propietario}</Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        ) : (
          <>
            {!isSupabaseConfigured && <Text className="mb-3 px-4 font-sans text-xs text-muted">Vista de ejemplo · las publicaciones no son reales</Text>}
            {cached && <OfflineNotice onRetry={() => void refresh()} />}
            {isLoading ? <LoadingState /> : isError ? (
              <View><EmptyState icon="cloud-offline-outline" title="No pudimos cargar las publicaciones" description="Revisa tu conexión y vuelve a intentarlo." /><Pressable accessibilityRole="button" onPress={() => void refresh()} className="self-center p-3"><Text className="font-medium text-brand">Reintentar</Text></Pressable></View>
            ) : listings.length === 0 ? (
              <EmptyState title="No encontramos resultados" description="Prueba otra palabra o selecciona Todo." />
            ) : (!browsing || discoveries.length > 0) && <ListingSection title={browsing ? 'Descubre lo que hay' : `${listings.length} resultados`} rows={browsing ? discoveries : listings} limit={browsing ? 8 : listings.length} showMap />}

            {browsing && promosInicio.length > 0 && <ListingSection title={paraTi.length ? 'Promociones para ti' : 'Promociones'} rows={promosInicio} accent="promotion" />}
            {browsing && needs.length > 0 && <ListingSection title="Se busca cerca de ti" rows={needs} accent="need" />}
            {browsing && services.length > 0 && <ListingSection title="Servicios para ti" rows={services} accent="service" />}
          </>
        )}

        <View className="mx-4 mb-3 mt-2 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center gap-2"><Ionicons name="location-outline" size={20} color={colors.red} /><Text className="font-display text-lg text-ink">Cerca de ti</Text></View>
          <Text className="mb-2 mt-1 font-sans text-xs leading-5 text-muted">{coordinates ? 'Publicaciones a menos de 15 km.' : 'Usa tu ubicación para encontrar opciones cercanas.'}</Text>
          {!!locationError && <Text accessibilityRole="alert" className="mb-2 text-xs text-muted">{locationError}</Text>}
          <Pressable accessibilityRole="button" disabled={isLocating} onPress={() => void (canAskAgain ? requestLocation() : openLocationSettings())} className="min-h-11 justify-center self-start rounded-xl bg-red-50 px-4">
            <Text className="font-medium text-xs text-brand">{isLocating ? 'Obteniendo ubicación…' : coordinates ? 'Actualizar ubicación' : canAskAgain ? 'Usar mi ubicación' : 'Revisar permisos'}</Text>
          </Pressable>
        </View>
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