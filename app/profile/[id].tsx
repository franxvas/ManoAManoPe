import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { demoListings, demoProfile } from '@/constants/demo';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchListingsByOwner } from '@/services/listings';
import { fetchPublicProfile } from '@/services/profile';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remoteProfile = useQuery({ queryKey: ['public-profile', id], queryFn: () => fetchPublicProfile(id), enabled: isSupabaseConfigured && Boolean(id) });
  const remoteListings = useQuery({ queryKey: ['public-profile-listings', id], queryFn: () => fetchListingsByOwner(id), enabled: isSupabaseConfigured && Boolean(id) });
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
            <View className="mt-3 flex-row items-center"><Text className="font-display text-2xl text-navy">{profile.displayName}</Text>{profile.verified && <Ionicons name="checkmark-circle" size={19} color={colors.navy} style={{ marginLeft: 6 }} />}</View>
            <Text className="mt-1 text-sm text-muted">{profile.profession}</Text>
            {!!profile.bio && <Text className="mt-3 leading-5 text-ink">{profile.bio}</Text>}
            <View className="mt-4 flex-row items-center rounded-2xl bg-canvas p-4"><Ionicons name="star" size={20} color={colors.rating} /><Text className="ml-2 font-medium text-ink">{profile.ratingAverage.toFixed(1)} · {profile.ratingCount} reseñas</Text></View>
          </View>
          <Text className="px-5 pb-3 pt-6 font-display text-2xl text-navy">Publicaciones</Text>
        </>}
        renderItem={({ item, index }) => <View className={`${index % 2 === 0 ? 'ml-5' : 'mr-5'} flex-1`}><ListingCard listing={item} /></View>}
        ListEmptyComponent={<EmptyState icon="albums-outline" title="Sin publicaciones activas" description="Este perfil no tiene publicaciones disponibles ahora." />}
      />
    </SafeAreaView>
  );
}
