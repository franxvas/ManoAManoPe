import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { colors, listingLabels } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import type { Listing } from '@/types/domain';
import { formatMoney, getListingAmount } from '@/utils/format';

export function ListingCard({ listing, horizontal = false }: { listing: Listing; horizontal?: boolean }) {
  const { favorites, toggleFavorite } = useFavorites();
  const favorite = favorites.includes(listing.id);
  const image = listing.images[0];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      className={`overflow-hidden rounded-2xl border border-line bg-white ${horizontal ? 'mr-4 w-64' : 'mb-4 flex-1'}`}
      accessibilityLabel={`Abrir ${listing.title}`}
    >
      <View className="relative h-36 bg-slate-200">
        {image ? <Image source={{ uri: image }} className="h-full w-full" contentFit="cover" transition={200} /> : <View className="h-full w-full bg-slate-200" />}
        <View className="absolute left-3 top-3 rounded-full bg-navy px-2.5 py-1">
          <Text className="font-medium text-[10px] uppercase tracking-wide text-white">{listingLabels[listing.type]}</Text>
        </View>
        <Pressable
          onPress={(event) => { event.stopPropagation(); void toggleFavorite(listing.id); }}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/95"
          accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={21} color={colors.red} />
        </Pressable>
      </View>
      <View className="p-3.5">
        <Text className="font-display text-lg text-ink" numberOfLines={1}>{listing.title}</Text>
        <Text className="mt-1 font-display text-xl text-brand">{formatMoney(getListingAmount(listing.price, listing.budget))}</Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="star" size={14} color={colors.rating} />
          <Text className="ml-1 font-medium text-xs text-ink">{listing.rating.toFixed(1)}</Text>
          <Text className="mx-2 text-line">•</Text>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text className="ml-1 flex-1 font-sans text-xs text-muted" numberOfLines={1}>{listing.city} · {listing.address}</Text>
        </View>
      </View>
    </Pressable>
  );
}
