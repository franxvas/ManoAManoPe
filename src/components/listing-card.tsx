import { FavoriteButton } from '@/features/guardados/favorite-button';
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { colors, listingLabels } from "@/constants/theme";
import type { Listing } from "@/types/domain";
import { formatMoney, getListingAmount } from "@/utils/format";

export function ListingCard({
  listing,
  horizontal = false,
}: {
  listing: Listing;
  horizontal?: boolean;
}) {
  const image = listing.images[0];

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/listing/[id]", params: { id: listing.id } })
      }
      className={`overflow-hidden rounded-3xl bg-white ${horizontal ? "mr-3 w-60" : "mb-4 flex-1"}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      accessibilityLabel={`Abrir ${listing.title}`}
    >
      <View className="relative h-36 bg-slate-200">
        {image ? (
          <Image
            source={{ uri: image }}
            className="h-full w-full"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-full w-full bg-slate-200" />
        )}
        <View className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1">
          <Text className="font-medium text-[10px] text-navy">
            {listingLabels[listing.type]}
          </Text>
        </View>
<View className="absolute right-3 top-3"><FavoriteButton type="listing" id={listing.id} size="sm" returnTo={`/listing/${listing.id}`} /></View>
      </View>
      <View className="p-3.5">
        <Text className="font-medium text-sm text-ink" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text className="mt-1.5 font-medium text-lg text-navy">
          {formatMoney(getListingAmount(listing.price, listing.budget))}
        </Text>
        <View className="mt-2 flex-row items-center">
          {listing.rating > 0 && (
            <>
              <Ionicons name="star" size={12} color={colors.rating} />
              <Text className="ml-1 mr-2 font-medium text-xs text-ink">
                {listing.rating.toFixed(1)}
              </Text>
            </>
          )}
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text
            className="ml-1 flex-1 font-sans text-xs text-muted"
            numberOfLines={1}
          >
            {listing.city}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
