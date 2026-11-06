import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, listingColors, listingLabels } from '@/constants/theme';
import { FavoriteButton } from '@/features/guardados/favorite-button';
import type { Listing } from '@/types/domain';
import { formatMoney, getListingAmount } from '@/utils/format';

export function ListingCard({ listing, horizontal = false, compact = false, mapPreview = false }: { listing: Listing; horizontal?: boolean; compact?: boolean; mapPreview?: boolean }) {
  const image = listing.images[0];
  const palette = listingColors[listing.type];
  const discount = listing.type === 'promotion' && listing.originalPrice && listing.price != null && listing.originalPrice > listing.price ? Math.round((1 - listing.price / listing.originalPrice) * 100) : 0;

  if (mapPreview) return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver publicación: ${listing.title}`} onPress={() => router.push({pathname:'/listing/[id]',params:{id:listing.id}})} className="mr-3 w-72 flex-row items-center overflow-hidden rounded-2xl border border-line bg-white p-2">
      <View className="h-20 w-20 overflow-hidden rounded-xl bg-slate-200">{image && <Image source={{uri:image}} style={{width:80,height:80}} contentFit="cover"/>}</View>
      <View className="ml-3 flex-1"><Text style={{color:palette.foreground}} className="mb-1 font-medium text-[10px]">{listingLabels[listing.type]}</Text><Text numberOfLines={2} className="font-medium text-xs leading-4 text-ink">{listing.title}</Text><Text className="mt-1 font-display text-lg text-ink">{formatMoney(getListingAmount(listing.price,listing.budget))}</Text></View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted}/>
    </Pressable>
  );

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      className={`overflow-hidden rounded-2xl border border-line bg-white ${horizontal ? (compact ? 'mr-3 w-44' : 'mr-4 w-64') : 'mb-4 flex-1'}`}
      accessibilityLabel={`Abrir ${listing.title}`}
    >
      <View className={`relative bg-slate-200 ${compact ? 'h-28' : 'h-36'}`}>
        {image ? <Image source={{ uri: image }} className="h-full w-full" contentFit="cover" transition={200} /> : <View className="h-full w-full bg-slate-200" />}
        <View style={{ backgroundColor: palette.background }} className="absolute left-2 top-2 rounded-lg px-2 py-1">
          <Text style={{ color: palette.foreground }} className="font-medium text-[10px] uppercase tracking-wide">{listingLabels[listing.type]}</Text>
        </View>
        <View className="absolute right-1 top-1"><FavoriteButton type="listing" id={listing.id} returnTo={`/listing/${listing.id}`} /></View>
      </View>
      <View className={compact ? 'p-2.5' : 'p-3.5'}>
        <Text className={`font-display text-ink ${compact ? 'h-9 text-sm leading-[18px]' : 'text-lg'}`} numberOfLines={compact ? 2 : 1}>{listing.title}</Text>
        {listing.type === 'promotion' && listing.originalPrice != null && listing.price != null && listing.originalPrice > listing.price && <Text className="mt-1 font-sans text-xs text-muted line-through">{formatMoney(listing.originalPrice)}</Text>}
        <View className="mt-1 flex-row flex-wrap items-center gap-x-2"><Text className={`font-display text-ink ${compact ? 'text-lg' : 'text-xl'}`}>{formatMoney(getListingAmount(listing.price, listing.budget))}</Text>{discount > 0 && <Text className="font-medium text-[10px] text-success">-{discount}%</Text>}</View>
        <View className="mt-2 flex-row items-center">
          {!compact && <><Ionicons name="star" size={14} color={colors.rating} />
          <Text className="ml-1 font-medium text-xs text-ink">{isSupabaseConfigured ? (listing.rating > 0 ? listing.rating.toFixed(1) : 'Sin reseñas') : 'Demo'}</Text>
          <Text className="mx-2 text-line">•</Text></>}
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text className="ml-1 flex-1 font-sans text-xs text-muted" numberOfLines={1}>{compact ? listing.city : `${listing.city} · ${listing.address}`}</Text>
        </View>
      </View>
    </Pressable>
  );
}
