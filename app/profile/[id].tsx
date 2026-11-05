import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { fetchMyPublications, type MyPublication } from '@/features/comunidad/actividad';
import { photoUrl } from '@/features/comunidad/api';
import { StatusBadge } from '@/features/comunidad/components';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { PublicReviews } from '@/features/confianza/reviews';
import { TrustSummary } from '@/features/confianza/summary';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { demoListings, demoProfile } from '@/constants/demo';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchListingsByOwner } from '@/services/listings';
import { fetchPublicProfile } from '@/services/profile';

function communityRoute(item: MyPublication): Href {
  if (item.kind === 'donation') return { pathname: '/comunidad/donaciones/[id]', params: { id: item.id } };
  if (item.kind === 'adoption') return { pathname: '/comunidad/adopciones/[id]', params: { id: item.id } };
  return { pathname: '/comunidad/eventos/[id]', params: { id: item.id } };
}

function Stat({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <View className={`flex-1 items-center ${last ? '' : 'border-r border-line'}`}>
      <Text className="font-display text-xl text-navy">{value}</Text>
      <Text className="mt-0.5 text-[11px] text-muted">{label}</Text>
    </View>
  );
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remoteProfile = useQuery({ queryKey: ['public-profile', id], queryFn: () => fetchPublicProfile(id), enabled: isSupabaseConfigured && Boolean(id) });
  const remoteListings = useQuery({ queryKey: ['public-profile-listings', id], queryFn: () => fetchListingsByOwner(id), enabled: isSupabaseConfigured && Boolean(id) });
  const community = useQuery({ queryKey: ['public-profile-community', id], queryFn: () => fetchMyPublications(id), enabled: isSupabaseConfigured && Boolean(id) });
  const profile = isSupabaseConfigured ? remoteProfile.data : (demoProfile.id === id ? demoProfile : null);
  const listings = isSupabaseConfigured ? (remoteListings.data ?? []) : demoListings.filter((item) => item.ownerId === id && item.status === 'published');

  if (remoteProfile.isLoading || remoteListings.isLoading) return <SafeAreaView className="flex-1 items-center justify-center bg-canvas"><ActivityIndicator color={colors.red} /><Text className="mt-3 text-muted">Cargando perfil…</Text></SafeAreaView>;
  if (!profile || remoteProfile.isError) return <SafeAreaView edges={['top']} className="flex-1 bg-canvas"><ScreenHeader title="Perfil" showBack /><EmptyState icon="person-circle-outline" title="Perfil no disponible" description="No pudimos encontrar este perfil." /></SafeAreaView>;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Perfil del vendedor" showBack />
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3"
        contentContainerClassName="pb-10"
        ListHeaderComponent={<>
          <View className="h-36 bg-navy">{Boolean(profile.coverUrl) && <Image source={{ uri: profile.coverUrl }} className="h-full w-full opacity-70" contentFit="cover" />}</View>
          <View className="bg-white px-5 pb-6">
            <View className="-mt-11 self-start rounded-full border-4 border-white"><Avatar uri={profile.avatarUrl} name={profile.displayName} size={88} /></View>
            <View className="mt-3 flex-row items-center"><Text className="font-display text-2xl text-navy">{profile.displayName}</Text></View>
            <Text className="mt-1 text-sm text-muted">{profile.profession}</Text>
            {Boolean(profile.city) && (
              <View className="mt-1 flex-row items-center">
                <Ionicons name="location-outline" size={14} color={colors.muted} />
                <Text className="ml-1 text-sm text-muted">{[profile.city, profile.region].filter(Boolean).join(', ')}</Text>
              </View>
            )}
            {!!profile.bio && <Text className="mt-3 leading-5 text-ink">{profile.bio}</Text>}
            <View className="mt-4 flex-row rounded-2xl bg-canvas py-3">
              <Stat value={profile.ratingCount ? profile.ratingAverage.toFixed(1) : '—'} label="Calificación" />
              <Stat value={String(profile.ratingCount)} label="Reseñas" />
              <Stat value={String(listings.length + (community.data?.length ?? 0))} label="Publicaciones" last />
            </View>
            <TrustSummary ownerId={id}/>
          </View>
          <View className="px-5 pt-4"><PrimaryButton label="Ver portafolio de trabajos" onPress={()=>router.push({pathname:"/portafolio",params:{ownerId:id}})}/></View>
          <View className="px-5"><PublicReviews ownerId={id}/></View>
          {(community.data?.length ?? 0) > 0 && (
            <>
              <Text className="px-5 pb-3 pt-6 font-display text-2xl text-navy">En Comunidad</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-5">
                {community.data!.map((item) => (
                  <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(communityRoute(item))} className="w-44 overflow-hidden rounded-2xl bg-white">
                    {item.photo ? <Image source={{ uri: photoUrl(item.photo) }} style={{ width: '100%', height: 100 }} contentFit="cover" /> : <View className="h-[100px] items-center justify-center bg-red-50"><Ionicons name="people-outline" size={28} color={colors.red} /></View>}
                    <View className="p-3">
                      <Text numberOfLines={1} className="font-medium text-ink">{item.title}</Text>
                      <View className="mt-1.5"><StatusBadge {...item.badge} /></View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          <Text className="px-5 pb-3 pt-6 font-display text-2xl text-navy">Publicaciones</Text>
        </>}
        renderItem={({ item, index }) => <View className={`${index % 2 === 0 ? 'ml-5' : 'mr-5'} flex-1`}><ListingCard listing={item} /></View>}
        ListEmptyComponent={<EmptyState icon="albums-outline" title="Sin publicaciones activas" description="Este perfil no tiene publicaciones disponibles ahora." />}
      />
    </SafeAreaView>
  );
}
